import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.scss";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useModal } from "../context/ModalContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Footer } from "../components/Footer/Footer.jsx";
import Loader from "../components/Loader/Loader.jsx";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_THUMBNAILS = 4;

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns true when the OS has requested reduced motion.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Formats an ISO timestamp as a human-readable date (e.g. "12 Jun 2025").
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Formats an ISO timestamp as a 12-hour locale time string (e.g. "07:30 PM").
const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Truncates a delivery address to its first comma-segment, capped at 30 characters.
const shortAddress = (address) => {
  if (!address) return "";
  const first = address.split(",")[0].trim();
  return first.length > 30 ? `${first.slice(0, 28)}…` : first;
};

// ── Icons ─────────────────────────────────────────────────────────────────────

// Inline SVG calendar glyph. Decorative — callers supply accessible context.
const CalendarIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Inline SVG location-pin glyph.
const PinIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Inline SVG refresh/re-order glyph.
const RefreshIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────────

// Renders a single past-order card: order ID, timestamp, item thumbnails,
// address snippet, price breakdown, and a re-order CTA.
const OrderCard = ({ order, onReorder }) => {
  const visibleItems = order.items.slice(0, MAX_THUMBNAILS);
  const extraCount = order.items.length - MAX_THUMBNAILS;
  const nameSummary = order.items
    .slice(0, 3)
    .map((item) => item.name)
    .join(", ");
  const extraNames = order.items.length > 3 ? ` +${order.items.length - 3} more` : "";
  // MongoDB timestamps use createdAt; fall back to the stored placedAt for
  // orders that were created before the backend migration.
  const timestamp = order.createdAt || order.placedAt;

  return (
    <article className="order-card" data-reveal>
      <header className="order-card-header">
        <span className="order-id-badge">{order.orderId}</span>
        <span className="order-meta">
          <CalendarIcon />
          {formatDate(timestamp)} · {formatTime(timestamp)}
        </span>
      </header>

      <div className="order-card-body">
        <div className="order-thumbnails" aria-hidden="true">
          {visibleItems.map((item) => (
            <span key={item.itemId} className="order-thumb">
              {item.image ? (
                <img src={item.image} alt="" loading="lazy" />
              ) : (
                <span className="order-thumb-placeholder" />
              )}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="order-thumb order-thumb-more">+{extraCount}</span>
          )}
        </div>

        <p className="order-items-summary">{nameSummary}{extraNames}</p>

        {order.address && (
          <p className="order-address">
            <PinIcon />
            {shortAddress(order.address)}
          </p>
        )}
      </div>

      <footer className="order-card-footer">
        <dl className="order-price-summary">
          <div className="order-price-row">
            <dt>Items</dt>
            <dd>₹{order.subtotal?.toFixed(2)}</dd>
          </div>
          <div className="order-price-row">
            <dt>GST</dt>
            <dd>₹{order.gst?.toFixed(2)}</dd>
          </div>
          <div className="order-price-row">
            <dt>Platform fee</dt>
            <dd>₹{order.platformFee?.toFixed(2)}</dd>
          </div>
          <div className="order-price-row is-total">
            <dt>Total paid</dt>
            <dd>₹{order.total?.toFixed(2)}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="reorder-btn"
          onClick={() => onReorder(order)}
        >
          <RefreshIcon />
          Re-order
        </button>
      </footer>
    </article>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

// Order History page — fetches persisted orders from the backend API newest-first.
// Unauthenticated users see a sign-in prompt (auth modal is already in the Header).
// Each order card has a re-order button that repopulates the cart and navigates to /menu.
export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fetch orders from the backend whenever the auth state changes.
  // Clears the list immediately on sign-out so stale data is never shown.
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    setIsLoading(true);
    setHasError(false);
    apiService.getRequest(
      `${AppConstants.Api_Domain}api/orders`,
      { authorization: AppConstants.Auth_Token },
      (res) => {
        setOrders(res.data ?? []);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      }
    );
  }, [user]);

  // Attach an IntersectionObserver to every [data-reveal] element so cards
  // fade in as they enter the viewport. Re-runs when the orders array changes.
  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return undefined;

    if (prefersReducedMotion()) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [orders]);

  // Re-adds all items from a past order back to the cart at their original
  // quantities, shows a confirmation toast, and navigates to /menu.
  const handleReorder = (order) => {
    order.items.forEach((item) => {
      // itemId is a cart-internal key not needed by addToCart.
      const { itemId: _itemId, quantity, category, ...itemData } = item;
      addToCart(itemData, category, quantity);
    });
    showToast({
      title: "Items added to cart",
      body: "Head to the menu to review your cart.",
      type: "success",
    });
    navigate("/menu");
  };

  // Retries the order fetch after a network failure.
  const handleRetry = () => {
    setHasError(false);
    setOrders([]);
    // Toggling a dependency re-triggers the useEffect.
    // Simplest approach: re-invoke the fetch inline.
    if (!user) return;
    setIsLoading(true);
    apiService.getRequest(
      `${AppConstants.Api_Domain}api/orders`,
      { authorization: AppConstants.Auth_Token },
      (res) => {
        setOrders(res.data ?? []);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="dashboard-page">
      {/* ── Hero ── */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-bg" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="grid" />
        </div>
        <div className="dashboard-hero-inner">
          <p className="dashboard-eyebrow">
            <span className="dot" />
            Your orders
          </p>
          <h1>Order history</h1>
          <p className="dashboard-hero-sub">
            Every meal you&apos;ve ordered — all in one place.
          </p>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="dashboard-body">
        {!user ? (
          <div className="dashboard-gated" data-reveal>
            <p className="dashboard-state-emoji" aria-hidden="true">🔒</p>
            <h2>Sign in to view your orders</h2>
            <p>Your order history is linked to your account.</p>
            <button type="button" className="dashboard-cta-btn" onClick={openModal}>
              Sign in
            </button>
          </div>
        ) : isLoading ? (
          <div className="dashboard-loader">
            <Loader />
          </div>
        ) : hasError ? (
          <div className="dashboard-error" data-reveal>
            <p className="dashboard-state-emoji" aria-hidden="true">⚠️</p>
            <h2>Couldn&apos;t load your orders</h2>
            <p>Something went wrong fetching your order history.</p>
            <button type="button" className="dashboard-cta-btn" onClick={handleRetry}>
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="dashboard-empty" data-reveal>
            <p className="dashboard-state-emoji" aria-hidden="true">🍽️</p>
            <h2>No orders yet</h2>
            <p>Your history will appear here once you place your first order.</p>
            <button
              type="button"
              className="dashboard-cta-btn"
              onClick={() => navigate("/menu")}
            >
              Browse menu
            </button>
          </div>
        ) : (
          <>
            <p className="dashboard-count">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </p>
            <div className="orders-grid">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onReorder={handleReorder}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};
