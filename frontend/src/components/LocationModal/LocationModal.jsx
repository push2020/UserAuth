import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./LocationModal.scss";
import { reverseGeocode, useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";

// ── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6L6 18" /><path d="M6 6l12 12" />
  </svg>
);

const PinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const DetectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// ── Constants ────────────────────────────────────────────────────────────────

// Geolocation options — 10 s timeout, low accuracy is fine for address lookup.
const GEO_OPTIONS = { enableHighAccuracy: false, timeout: 10000 };

// Modal states
const STATE = {
  IDLE: "idle",         // initial: two CTA buttons
  DETECTING: "detecting", // geolocation in progress
  DETECTED: "detected", // address resolved — confirm or retry
  ERROR: "error",       // permission denied or detection failed
  MANUAL: "manual",     // manual text-entry form
};

// ── Component ────────────────────────────────────────────────────────────────

// Location selection modal. Rendered into document.body via a React portal.
// Two modes: browser geolocation (auto-detect) and manual text entry.
// Saves the chosen address to LocationContext and, if the user is signed in,
// also writes it to their profile via the API.
export const LocationModal = () => {
  const { isModalOpen, closeModal, saveLocation } = useLocation();
  const { user } = useAuth();
  const [view, setView] = useState(STATE.IDLE);
  const [detectedAddress, setDetectedAddress] = useState("");
  const [detectedCoords, setDetectedCoords] = useState(null);
  const [manualInput, setManualInput] = useState(user?.address ?? "");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  // Focuses the manual input whenever that panel becomes visible.
  useEffect(() => {
    if (view === STATE.MANUAL) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [view]);

  // Locks body scroll and binds Escape-to-close while the modal is open.
  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (e) => { if (e.key === "Escape") handleClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resets back to the IDLE state whenever the modal re-opens.
  useEffect(() => {
    if (isModalOpen) {
      setView(STATE.IDLE);
      setManualInput(user?.address ?? "");
    }
  }, [isModalOpen, user?.address]);

  const handleClose = () => {
    closeModal();
    setView(STATE.IDLE);
  };

  // Requests the browser's geolocation, then reverse-geocodes the result.
  const handleDetect = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Your browser doesn't support location detection.");
      setView(STATE.ERROR);
      return;
    }

    setView(STATE.DETECTING);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDetectedCoords({ lat, lng });
        const address = await reverseGeocode(lat, lng);
        if (address) {
          setDetectedAddress(address);
          setView(STATE.DETECTED);
        } else {
          setErrorMsg("We found your position but couldn't resolve the address. Enter it manually.");
          setView(STATE.ERROR);
        }
      },
      (err) => {
        const messages = {
          1: "Location permission was denied. You can enter your address manually.",
          2: "Your location couldn't be determined. Check your device settings.",
          3: "Location detection timed out. Try again or enter manually.",
        };
        setErrorMsg(messages[err.code] ?? "Location detection failed.");
        setView(STATE.ERROR);
      },
      GEO_OPTIONS,
    );
  };

  // Commits the auto-detected address to the context.
  const handleConfirmDetected = () => {
    saveLocation(
      { address: detectedAddress, lat: detectedCoords.lat, lng: detectedCoords.lng, source: "auto" },
      user,
    );
    handleClose();
  };

  // Commits the manually typed address to the context.
  const handleSaveManual = (e) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    saveLocation({ address: trimmed, lat: null, lng: null, source: "manual" }, user);
    handleClose();
  };

  if (!isModalOpen) return null;

  const modal = (
    <div className="loc-overlay" onClick={handleClose} role="presentation">
      <div
        className="loc-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loc-modal-title"
      >
        <div className="loc-modal-bg" aria-hidden="true">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
        </div>

        <button type="button" className="loc-close" onClick={handleClose} aria-label="Close">
          <CloseIcon />
        </button>

        <header className="loc-header">
          <span className="loc-pin" aria-hidden="true"><PinIcon /></span>
          <p className="loc-eyebrow">Delivery location</p>
          <h2 id="loc-modal-title">Where should we deliver?</h2>
          <p className="loc-sub">
            We&apos;ll show you restaurants and delivery times for your area.
          </p>
        </header>

        {/* ── IDLE: two primary CTAs ── */}
        {view === STATE.IDLE && (
          <div className="loc-actions">
            <button type="button" className="loc-btn primary" onClick={handleDetect}>
              <DetectIcon />
              <span>Detect my location</span>
            </button>
            <button type="button" className="loc-btn ghost" onClick={() => setView(STATE.MANUAL)}>
              <EditIcon />
              <span>Enter address manually</span>
            </button>
          </div>
        )}

        {/* ── DETECTING ── */}
        {view === STATE.DETECTING && (
          <div className="loc-status">
            <span className="loc-spinner" aria-hidden="true" />
            <p>Detecting your location…</p>
          </div>
        )}

        {/* ── DETECTED: show address, confirm or retry ── */}
        {view === STATE.DETECTED && (
          <div className="loc-detected">
            <div className="detected-address">
              <span className="detected-icon" aria-hidden="true"><PinIcon /></span>
              <p>{detectedAddress}</p>
            </div>
            <div className="loc-actions">
              <button type="button" className="loc-btn primary" onClick={handleConfirmDetected}>
                <CheckIcon />
                <span>Confirm this address</span>
              </button>
              <button type="button" className="loc-btn ghost" onClick={() => setView(STATE.MANUAL)}>
                <EditIcon />
                <span>Enter a different address</span>
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {view === STATE.ERROR && (
          <div className="loc-error">
            <p className="error-msg">{errorMsg}</p>
            <div className="loc-actions">
              <button type="button" className="loc-btn primary" onClick={handleDetect}>
                <DetectIcon />
                <span>Try again</span>
              </button>
              <button type="button" className="loc-btn ghost" onClick={() => setView(STATE.MANUAL)}>
                <EditIcon />
                <span>Enter manually</span>
              </button>
            </div>
          </div>
        )}

        {/* ── MANUAL: text input form ── */}
        {view === STATE.MANUAL && (
          <form className="loc-form" onSubmit={handleSaveManual}>
            <div className="loc-field">
              <label htmlFor="manual-address">Delivery address</label>
              <input
                id="manual-address"
                ref={inputRef}
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. 123 Food Street, Andheri West, Mumbai"
                autoComplete="street-address"
              />
            </div>
            <div className="loc-actions">
              <button
                type="submit"
                className="loc-btn primary"
                disabled={!manualInput.trim()}
              >
                <CheckIcon />
                <span>Save address</span>
              </button>
              <button type="button" className="loc-btn ghost" onClick={() => setView(STATE.IDLE)}>
                <span>Back</span>
              </button>
            </div>
          </form>
        )}

        {user && (
          <p className="loc-profile-note">
            Your address will also be saved to your profile.
          </p>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
