import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../AuthModal/AuthModal.scss";
import AppConstants from "../../constants/AppConstants.js";
import { apiService } from "../../services/apiservice.js";
import { validationService } from "../../services/validationservice.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const LOGIN_REDIRECT_DELAY_MS = 2000;
const EXPIRED_TOKEN_CODE = 419;

/** Modal views: login, signup, OTP verification, or the forgot-password form. */
const VIEW_LOGIN = "login";
const VIEW_SIGNUP = "signup";
const VIEW_FORGOT = "forgot";
const VIEW_OTP = "otp";

const OTP_LENGTH = 4;

const { isEmail, isName, isPassword } = validationService;

// Close glyph used by the top-right dismiss button.
const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

// Open-eye glyph for the password visibility toggle (password currently hidden).
const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Crossed-out eye glyph for the password visibility toggle (password currently visible).
const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </svg>
);

// Validates the request payload before submission. Returns true only when every
// supplied field passes its rule. An unknown field is treated as invalid.
const isPayloadValid = (data) => {
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") return false;
    if (key === "name" && !isName.test(value)) return false;
    if (key === "email" && !isEmail.test(value)) return false;
    if (key === "password" && !isPassword.test(value)) return false;
  }
  return true;
};

// Auth modal — login, sign-up, and forgot-password in a single panel, rendered
// into document.body via a React portal so the Header's backdrop-filter doesn't
// break its fixed positioning.
export const AuthModal = ({ isOpen, onClose }) => {
  const { login, logout } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState(VIEW_LOGIN);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [pendingSignup, setPendingSignup] = useState(null);
  const firstInputRef = useRef(null);
  const otpRefs = useRef([]);

  const isLogin = view === VIEW_LOGIN;

  // Focuses the first visible input whenever the modal opens or the view changes.
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => firstInputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [isOpen, view]);

  // Closes the modal on Escape. Also locks body scroll while the modal is open.
  useEffect(() => {
    if (!isOpen) return undefined;

    // Dismisses the modal when the user presses Escape.
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Updates a single field of the auth state from a form input change event.
  const handleInputChange = (event) => {
    const { name: key, value } = event.target;
    setAuth((prev) => ({ ...prev, [key]: value }));
  };

  // Submits a forgot-password request and shows the result via toast.
  const handleForgotSubmit = (event) => {
    event.preventDefault();
    if (!isEmail.test(forgotEmail)) {
      showToast({
        title: "Invalid email",
        body: "Enter a valid email address.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    const url = AppConstants.Api_Domain + "auth/forgot-password";
    apiService.postRequest(
      url,
      { "Content-Type": "application/json" },
      JSON.stringify({ email: forgotEmail }),
      (res) => {
        setIsSubmitting(false);
        showToast({ title: "Check your inbox", body: res.message });
        if (res.devResetUrl) {
          showToast({ title: "Dev mode — reset link", body: res.devResetUrl });
          window.open(res.devResetUrl, "_self");
        } else {
          setView(VIEW_LOGIN);
        }
      },
      (error) => {
        setIsSubmitting(false);
        showToast({
          title: "Request failed",
          body: error?.message || "Please try again later.",
          type: "error",
        });
      },
    );
  };

  // Fetches the full user record after a successful login and hands it to AuthContext.
  const fetchUserDetails = (userId) => {
    const url = AppConstants.Api_Domain + `api/user/${userId}`;
    const headers = {
      "content-type": "application/json",
      authorization: AppConstants.Auth_Token,
    };
    apiService.getRequest(
      url,
      headers,
      (res) => {
        const { data } = res;
        localStorage.setItem("userProfile", JSON.stringify(data));
        window.setTimeout(() => {
          login(data);
          onClose();
          setIsSubmitting(false);
        }, LOGIN_REDIRECT_DELAY_MS);
      },
      (error) => {
        setIsSubmitting(false);
        if (error?.code === EXPIRED_TOKEN_CODE) logout();
      },
    );
  };

  // Handles the API response for login or signup.
  const handleAuthSuccess = (res) => {
    showToast({
      title: "Authentication successful",
      body: res.message,
    });
    if (isLogin) {
      AppConstants.Auth_Token = res.jwtToken;
      localStorage.setItem("authToken", res.jwtToken);
      fetchUserDetails(res.user.id);
    } else {
      setView(VIEW_LOGIN);
      setIsSubmitting(false);
    }
  };

  // Surfaces an error toast and clears the submitting state.
  const handleAuthError = (error) => {
    setIsSubmitting(false);
    showToast({
      title: "Sign in failed",
      body: error?.message || "Please check your details and try again.",
      type: "error",
    });
  };

  // Submits login, or kicks off the signup OTP flow.
  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = isLogin
      ? { email: auth.email, password: auth.password }
      : { name: auth.name, email: auth.email, password: auth.password };

    if (!isPayloadValid(payload)) {
      showToast({
        title: "Invalid details",
        body: isLogin
          ? "Enter a valid email and password."
          : "Name must be letters only; password needs 8+ chars with upper, lower, number, and symbol.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    if (!isLogin) {
      // Request an OTP — actual account creation happens after verification.
      apiService.postRequest(
        AppConstants.Api_Domain + "auth/send-otp",
        { "Content-Type": "application/json" },
        JSON.stringify({ email: auth.email }),
        (res) => {
          setIsSubmitting(false);
          showToast({ title: "Code sent", body: res.message });
          setPendingSignup({ name: auth.name, email: auth.email, password: auth.password });
          if (res.devOtp) {
            const digits = res.devOtp.split("");
            setOtpDigits(digits);
            showToast({ title: "Dev mode", body: `OTP: ${res.devOtp}` });
          }
          setView(VIEW_OTP);
        },
        (error) => {
          setIsSubmitting(false);
          showToast({
            title: "Could not send code",
            body: error?.message || "Please try again.",
            type: "error",
          });
        },
      );
      return;
    }

    apiService.postRequest(
      AppConstants.Api_Domain + "auth/login",
      { "Content-Type": "application/json" },
      JSON.stringify(payload),
      handleAuthSuccess,
      handleAuthError,
    );
  };

  // Switches view and resets transient state.
  const switchView = (nextView) => {
    setShowPassword(false);
    setIsSubmitting(false);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    if (nextView !== VIEW_OTP) setPendingSignup(null);
    setView(nextView);
  };

  // Handles a single OTP digit box: updates state and advances/retreats focus.
  const handleOtpChange = (index, event) => {
    const digit = event.target.value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  // Moves focus back on Backspace when the current box is already empty.
  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handles pasting a full OTP code into any digit box.
  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  // Submits the OTP along with the pending signup data to create the account.
  const handleOtpSubmit = (event) => {
    event.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length < OTP_LENGTH) {
      showToast({ title: "Incomplete code", body: "Enter all 4 digits.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    apiService.postRequest(
      AppConstants.Api_Domain + "auth/signup",
      { "Content-Type": "application/json" },
      JSON.stringify({ ...pendingSignup, otp }),
      (res) => {
        setIsSubmitting(false);
        showToast({ title: "Account created", body: res.message });
        switchView(VIEW_LOGIN);
      },
      (error) => {
        setIsSubmitting(false);
        showToast({
          title: "Verification failed",
          body: error?.message || "Invalid or expired code.",
          type: "error",
        });
      },
    );
  };

  if (!isOpen) return null;

  const isForgot = view === VIEW_FORGOT;
  const isOtp = view === VIEW_OTP;

  const modal = (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="modal-bg" aria-hidden="true">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
        </div>

        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* ── OTP verification view ───────────────────────────────────── */}
        {isOtp && (
          <>
            <div className="modal-header">
              <p className="modal-eyebrow">Almost there</p>
              <h2 id="auth-modal-title">Enter verification code</h2>
              <p className="modal-sub">
                We sent a 4-digit code to{" "}
                <strong>{pendingSignup?.email}</strong>. It expires in 10 minutes.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleOtpSubmit} noValidate>
              <div className="otp-boxes" role="group" aria-label="Verification code">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                      if (i === 0) firstInputRef.current = el;
                    }}
                    className="otp-box"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    aria-label={`Digit ${i + 1}`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || otpDigits.join("").length < OTP_LENGTH}
              >
                {isSubmitting ? (
                  <span className="spinner" aria-hidden="true" />
                ) : (
                  <span>Verify &amp; create account</span>
                )}
              </button>
            </form>

            <p className="toggle-text">
              Wrong email?{" "}
              <button
                type="button"
                className="toggle-link"
                onClick={() => switchView(VIEW_SIGNUP)}
              >
                Go back
              </button>
            </p>
          </>
        )}

        {/* ── Forgot-password view ─────────────────────────────────────── */}
        {isForgot && (
          <>
            <div className="modal-header">
              <p className="modal-eyebrow">Account recovery</p>
              <h2 id="auth-modal-title">Forgot your password?</h2>
              <p className="modal-sub">
                Enter the email linked to your account and we&rsquo;ll send a
                reset link — valid for 1 hour.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={handleForgotSubmit}
              noValidate
            >
              <div className="field">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  name="forgotEmail"
                  type="email"
                  autoComplete="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  ref={firstInputRef}
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="spinner" aria-hidden="true" />
                ) : (
                  <span>Send reset link</span>
                )}
              </button>
            </form>

            <p className="toggle-text">
              Remembered it?{" "}
              <button
                type="button"
                className="toggle-link"
                onClick={() => switchView(VIEW_LOGIN)}
              >
                Sign in
              </button>
            </p>
          </>
        )}

        {/* ── Login / signup view ──────────────────────────────────────── */}
        {!isForgot && !isOtp && (
          <>
            <div className="modal-header">
              <p className="modal-eyebrow">
                {isLogin ? "Welcome back" : "Join us"}
              </p>
              <h2 id="auth-modal-title">
                {isLogin ? "Sign in to FoodExpress" : "Create your account"}
              </h2>
              <p className="modal-sub">
                {isLogin
                  ? "Order from your favourite kitchens in one tap."
                  : "A faster way to order food, save addresses, and track deliveries."}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {!isLogin && (
                <div className="field">
                  <label htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={auth.name}
                    onChange={handleInputChange}
                    placeholder="Jane Doe"
                    ref={firstInputRef}
                    required
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={auth.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  ref={isLogin ? firstInputRef : null}
                  required
                />
              </div>

              <div className="field">
                <div className="field-label-row">
                  <label htmlFor="auth-password">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => switchView(VIEW_FORGOT)}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="field-with-icon">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={auth.password}
                    onChange={handleInputChange}
                    placeholder={
                      isLogin ? "Your password" : "8+ chars, mixed case, symbol"
                    }
                    required
                  />
                  <button
                    type="button"
                    className="field-icon-btn"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="spinner" aria-hidden="true" />
                ) : (
                  <span>{isLogin ? "Sign in" : "Create account"}</span>
                )}
              </button>
            </form>

            <p className="toggle-text">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="toggle-link"
                onClick={() =>
                  switchView(isLogin ? VIEW_SIGNUP : VIEW_LOGIN)
                }
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
