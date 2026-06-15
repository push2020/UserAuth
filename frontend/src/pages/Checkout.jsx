import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Checkout.scss";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation as useDeliveryLocation } from "../context/LocationContext.jsx";
import { LocationModal } from "../components/LocationModal/LocationModal.jsx";
import AppConstants from "../constants/AppConstants.js";

// ── Icons ─────────────────────────────────────────────────────────────────────

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

// Resolves avatar URL for cart item image fallback.
const resolveImage = (src, defaultImage) => src || defaultImage || "";

// Generates a random order ID in the format FE-XXXXXX.
const generateOrderId = () =>
  `FE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

// Checkout page — shows order summary, delivery address review and the
// Place Order CTA. Clears the cart and redirects to /order-confirmation on success.
// Redirects to /menu if the cart is empty on mount.
export const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart, getTotalAmount } = useCart();
  const { user } = useAuth();
  const {
    location: deliveryLocation,
    isModalOpen,
    openModal: openLocationModal,
  } = useDeliveryLocation();

  const [isPlacing, setIsPlacing] = useState(false);
  const [defaultImage, setDefaultImage] = useState("");

  const isEmpty = !cart?.items?.length;
  const subtotal = getTotalAmount ? getTotalAmount() : 0;
  const deliveryFee = 0;
  const GST_RATE = 0.05;
  const PLATFORM_FEE = 5;
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = subtotal + deliveryFee + gst + PLATFORM_FEE;

  // Resolves the menu-wide fallback image from AppConstants for use when
  // individual cart items have no image.
  useEffect(() => {
    const url = AppConstants.Api_Domain + "api/begin";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setDefaultImage(data?.data?.defaultImage ?? ""))
      .catch(() => {});
  }, []);

  // Redirects unauthenticated users to home.
  useEffect(() => {
    if (user === null) navigate("/", { replace: true });
  }, [user, navigate]);

  // Redirects to the menu if the cart is empty (order was already placed or
  // user navigated here directly without items).
  useEffect(() => {
    if (user && isEmpty) navigate("/menu", { replace: true });
  }, [user, isEmpty, navigate]);

  // Resolves the best available delivery address from the location context
  // or the user's saved profile address.
  const deliveryAddress =
    deliveryLocation?.address || user?.address || null;

  // Simulates order placement: saves order data to sessionStorage, clears the
  // cart, and navigates to the confirmation page. A 1.4 s delay gives the
  // spinner time to be seen (mimics a network call; replace with a real API
  // call when the orders endpoint is available).
  const handlePlaceOrder = () => {
    if (!deliveryAddress) {
      openLocationModal();
      return;
    }

    setIsPlacing(true);

    const orderData = {
      orderId: generateOrderId(),
      items: cart.items,
      subtotal,
      deliveryFee,
      gst,
      platformFee: PLATFORM_FEE,
      total,
      address: deliveryAddress,
      estimatedMinutes: `${25 + Math.floor(Math.random() * 8)}–${35 + Math.floor(Math.random() * 5)}`,
      placedAt: new Date().toISOString(),
    };

    window.setTimeout(() => {
      clearCart();
      sessionStorage.setItem("lastOrder", JSON.stringify(orderData));
      navigate("/order-confirmation");
    }, 1400);
  };

  if (!user || isEmpty) return null;

  return (
    <>
      <div className="checkout-page">
        <section className="checkout-hero">
          <div className="checkout-hero-bg" aria-hidden="true">
            <span className="orb orb-1" /><span className="orb orb-2" />
          </div>
          <div className="checkout-hero-inner">
            <p className="checkout-eyebrow">
              <span className="dot" />
              Almost there
            </p>
            <h1>Review your order</h1>
          </div>
        </section>

        <div className="checkout-body">
          {/* ── Left: items ── */}
          <section className="checkout-items-col">
            <h2 className="col-heading">
              Order summary
              <span className="item-badge">
                {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
              </span>
            </h2>

            <ul className="checkout-items">
              {cart.items.map((item) => (
                <li key={item.itemId} className="checkout-item">
                  <div className="checkout-item-img">
                    <img
                      src={resolveImage(item.image, defaultImage)}
                      alt={item.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="checkout-item-info">
                    <p className="checkout-item-name">{item.name}</p>
                    {item.category && (
                      <p className="checkout-item-cat">{item.category}</p>
                    )}
                    <p className="checkout-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <p className="checkout-item-total">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Right: address + price + CTA ── */}
          <aside className="checkout-summary-col">
            {/* Delivery address */}
            <div className="checkout-card address-card">
              <div className="card-heading">
                <PinIcon />
                <h3>Deliver to</h3>
              </div>
              {deliveryAddress ? (
                <div className="address-body">
                  <p className="address-text">{deliveryAddress}</p>
                  <button
                    type="button"
                    className="change-address-btn"
                    onClick={openLocationModal}
                  >
                    <EditIcon />
                    Change
                  </button>
                </div>
              ) : (
                <div className="address-missing">
                  <p>No delivery address saved.</p>
                  <button
                    type="button"
                    className="set-address-btn"
                    onClick={openLocationModal}
                  >
                    <PinIcon />
                    Set delivery address
                  </button>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="checkout-card price-card">
              <div className="card-heading">
                <TagIcon />
                <h3>Price details</h3>
              </div>
              <ul className="price-rows">
                <li>
                  <span>
                    Item total ({cart.items.length}{" "}
                    {cart.items.length === 1 ? "item" : "items"})
                  </span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </li>
                <li>
                  <span>Delivery fee</span>
                  <span className="free">Free</span>
                </li>
                <li>
                  <span>GST &amp; charges <span className="rate">(5%)</span></span>
                  <span>₹{gst.toFixed(2)}</span>
                </li>
                <li>
                  <span>Platform fee</span>
                  <span>₹{PLATFORM_FEE.toFixed(2)}</span>
                </li>
              </ul>
              <div className="price-total">
                <span>To pay</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Place order CTA */}
            {!deliveryAddress && (
              <p className="address-warning">
                Please set a delivery address before placing your order.
              </p>
            )}
            <button
              type="button"
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              aria-busy={isPlacing}
            >
              {isPlacing ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  <span>Placing your order…</span>
                </>
              ) : (
                <span>Place order · ₹{total.toFixed(2)}</span>
              )}
            </button>

            <p className="checkout-note">
              By placing your order you agree to our terms. Payment is collected
              on delivery.
            </p>
          </aside>
        </div>
      </div>

      {/* Allow editing the delivery address inline from the checkout page */}
      {isModalOpen && <LocationModal />}
    </>
  );
};
