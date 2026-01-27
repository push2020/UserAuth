import React, { useState } from "react";
import "./Cart.scss";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

export const Cart = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalAmount } =
    useCart();
  const { showToast } = useToast();
  const [removing, setRemoving] = useState(null);

  if (!isOpen) return null;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    setRemoving(itemId);
    removeFromCart(itemId);
    showToast({
      title: "Item Removed",
      body: "Item removed from cart",
      type: "success",
    });
    setTimeout(() => setRemoving(null), 300);
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart();
      showToast({
        title: "Cart Cleared",
        body: "All items removed from cart",
        type: "success",
      });
    }
  };

  const totalAmount = getTotalAmount();

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-container" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="cart-content">
          {!cart || !cart.items || cart.items.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <p>Your cart is empty</p>
              <p className="empty-cart-subtitle">
                Add some delicious items to get started!
              </p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.items.map((item) => (
                  <div
                    key={item.itemId}
                    className={`cart-item ${removing === item.itemId ? "removing" : ""}`}
                  >
                    <div className="item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="no-image">🍽️</div>
                      )}
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p className="item-category">{item.category}</p>
                      <p className="item-price">₹{item.price}</p>
                      {item.isVeg !== undefined && (
                        <span className={`item-type ${item.isVeg ? "veg" : "non-veg"}`}>
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </span>
                      )}
                    </div>
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            handleQuantityChange(item.itemId, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            handleQuantityChange(item.itemId, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.itemId)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="item-total">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Fee:</span>
                    <span>Free</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="cart-actions">
                  <button className="clear-cart-btn" onClick={handleClearCart}>
                    Clear Cart
                  </button>
                  <button className="checkout-btn">Proceed to Checkout</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
