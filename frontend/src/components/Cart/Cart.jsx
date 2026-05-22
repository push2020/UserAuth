import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./Cart.scss";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

// Close glyph for the drawer's dismiss button.
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

// Minus glyph for the quantity stepper's decrement segment.
const MinusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
  </svg>
);

// Plus glyph for the quantity stepper's increment segment.
const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Trash glyph for the per-row remove button.
const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

// Empty-state illustration — a stylised bag/box icon to replace the previous emoji.
const EmptyCartIcon = () => (
  <svg
    width="72"
    height="72"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 3h2.2l2.2 12.2A2 2 0 0 0 9.4 17h8.4a2 2 0 0 0 1.96-1.6L21 8H6.6" />
    <circle cx="10" cy="20.5" r="1.5" />
    <circle cx="18" cy="20.5" r="1.5" />
  </svg>
);

// Decorative placeholder rendered when a cart item has no image.
const NoImageIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 21h14a2 2 0 0 0 2-2v-3.5L17 12l-4 4-3-3-7 7" />
    <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10" />
    <circle cx="9" cy="9" r="2" />
  </svg>
);

// Right-side cart drawer. Rendered via portal to escape the Header's
// backdrop-filter containing block.
export const Cart = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalAmount } =
    useCart();
  const { showToast } = useToast();
  const [removingId, setRemovingId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Locks body scroll while the drawer is open and binds Escape-to-close.
  useEffect(() => {
    if (!isOpen) return undefined;

    // Dismisses the drawer when the user presses Escape.
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

  // Resets the "clear cart" confirmation prompt whenever the drawer closes.
  useEffect(() => {
    if (!isOpen) setConfirmClear(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // Bumps quantity up or down by 1, removing the line when it would go below 1.
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  // Removes a single line and fires a confirmation toast.
  const handleRemoveItem = (itemId) => {
    setRemovingId(itemId);
    removeFromCart(itemId);
    showToast({
      title: "Item removed",
      body: "Item removed from cart.",
      type: "success",
    });
    window.setTimeout(() => setRemovingId(null), 300);
  };

  // Clears the entire cart after the inline confirmation toggle is accepted.
  const handleConfirmClear = () => {
    clearCart();
    setConfirmClear(false);
    showToast({
      title: "Cart cleared",
      body: "All items removed from cart.",
      type: "success",
    });
  };

  const totalAmount = getTotalAmount();
  const isEmpty = !cart || !cart.items || cart.items.length === 0;
  const itemCount = cart?.items?.length ?? 0;

  const drawer = (
    <div className="cart-overlay" onClick={onClose} role="presentation">
      <aside
        className="cart-container"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header className="cart-header">
          <div className="cart-header-text">
            <p className="cart-eyebrow">Your selection</p>
            <h2 id="cart-drawer-title">Your cart</h2>
            {itemCount > 0 && (
              <span className="cart-count">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close cart"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="cart-content">
          {isEmpty ? (
            <div className="empty-cart">
              <div className="empty-cart-icon" aria-hidden="true">
                <EmptyCartIcon />
              </div>
              <h3>Your cart is empty</h3>
              <p>Add some delicious items to get started.</p>
              <button type="button" className="ghost-btn" onClick={onClose}>
                Browse menu
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {cart.items.map((item) => (
                <article
                  key={item.itemId}
                  className={`cart-item${removingId === item.itemId ? " is-removing" : ""}`}
                >
                  <div className="item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} loading="lazy" />
                    ) : (
                      <div className="no-image" aria-hidden="true">
                        <NoImageIcon />
                      </div>
                    )}
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    {item.category && (
                      <p className="item-category">{item.category}</p>
                    )}
                    {item.isVeg !== undefined && (
                      <span
                        className={`veg-chip ${item.isVeg ? "is-veg" : "is-non-veg"}`}
                        aria-label={item.isVeg ? "Vegetarian" : "Non-vegetarian"}
                      >
                        <span className="veg-square" aria-hidden="true">
                          <span className="veg-dot" />
                        </span>
                        {item.isVeg ? "Veg" : "Non-Veg"}
                      </span>
                    )}
                    <p className="item-price">₹{item.price}</p>
                  </div>
                  <div className="item-controls">
                    <div
                      className="qty-stepper"
                      role="group"
                      aria-label={`Quantity for ${item.name}`}
                    >
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() =>
                          handleQuantityChange(item.itemId, item.quantity - 1)
                        }
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <MinusIcon />
                      </button>
                      <span className="quantity" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() =>
                          handleQuantityChange(item.itemId, item.quantity + 1)
                        }
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.itemId)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <TrashIcon />
                      <span>Remove</span>
                    </button>
                  </div>
                  <div className="item-total">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {!isEmpty && (
          <footer className="cart-footer">
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery fee</span>
                <span className="free-tag">Free</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {confirmClear ? (
              <div className="confirm-row" role="alertdialog">
                <p>Remove all items from your cart?</p>
                <div className="confirm-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={handleConfirmClear}
                  >
                    Yes, clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="cart-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setConfirmClear(true)}
                >
                  Clear cart
                </button>
                <button type="button" className="checkout-btn">
                  Proceed to checkout
                </button>
              </div>
            )}
          </footer>
        )}
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
};
