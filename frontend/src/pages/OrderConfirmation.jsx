import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/OrderConfirmation.scss";

// ── Icons ─────────────────────────────────────────────────────────────────────

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M3 3h2.2l2.2 12.2A2 2 0 0 0 9.4 17h8.4a2 2 0 0 0 1.96-1.6L21 8H6.6" />
    <circle cx="10" cy="20.5" r="1.5" />
    <circle cx="18" cy="20.5" r="1.5" />
  </svg>
);

// Animated SVG checkmark — ring draws in, tick follows.
const AnimatedCheck = () => (
  <div className="check-wrap" aria-hidden="true">
    <svg viewBox="0 0 52 52">
      <circle className="check-ring" cx="26" cy="26" r="24" />
      <path className="check-tick" d="M14 27l8 8 16-16" />
    </svg>
  </div>
);

// Max number of item thumbnails shown in the strip.
const MAX_THUMBS = 4;

// Order confirmation page. Reads order data from sessionStorage (written by
// Checkout on successful placement). Redirects to / if no data is found.
export const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastOrder");
    if (!raw) { navigate("/", { replace: true }); return; }
    try {
      setOrder(JSON.parse(raw));
      window.setTimeout(() => setVisible(true), 60);
    } catch {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (!order) return null;

  const thumbItems = order.items?.slice(0, MAX_THUMBS) ?? [];
  const extraCount = Math.max(0, (order.items?.length ?? 0) - MAX_THUMBS);
  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div className={`conf-page${visible ? " is-visible" : ""}`}>
      <div className="conf-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="grid" />
      </div>

      {/* Animated check */}
      <AnimatedCheck />

      {/* Headline */}
      <div className="conf-headline">
        <p className="conf-label">Order confirmed</p>
        <h1>Your food is on its way!</h1>
        <span className="conf-order-id">{order.orderId}</span>
      </div>

      {/* ETA */}
      <div className="conf-eta">
        <span className="eta-icon"><ClockIcon /></span>
        <span className="eta-time">{order.estimatedMinutes} min</span>
        <span className="eta-sep" aria-hidden="true" />
        <span className="eta-label">estimated delivery</span>
      </div>

      {/* Item thumbnails */}
      {thumbItems.length > 0 && (
        <div className="conf-thumbs" aria-label={`${totalItems} items ordered`}>
          {thumbItems.map((item, i) => (
            <div
              key={item.itemId}
              className="conf-thumb"
              style={{ "--i": i }}
              title={item.name}
            >
              {item.image
                ? <img src={item.image} alt={item.name} loading="lazy" />
                : <span className="thumb-fallback" aria-hidden="true" />
              }
            </div>
          ))}
          {extraCount > 0 && (
            <div className="conf-thumb conf-thumb-more" style={{ "--i": MAX_THUMBS }}>
              +{extraCount}
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="conf-total">
        <span>Total paid</span>
        <strong>₹{(order.total ?? 0).toFixed(2)}</strong>
      </div>

      {/* CTAs */}
      <div className="conf-actions">
        <Link to="/" className="conf-btn ghost">
          <HomeIcon /><span>Back to home</span>
        </Link>
        <Link to="/menu" className="conf-btn primary">
          <MenuIcon /><span>Order more</span>
        </Link>
      </div>
    </div>
  );
};
