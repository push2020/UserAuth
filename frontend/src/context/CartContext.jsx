import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import AppConstants from "../constants/AppConstants";
import { apiService } from "../services/apiservice";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart(null);
      setItemCount(0);
    }
  }, [user]);

  const fetchCart = () => {
    if (!user) return;

    setLoading(true);
    const url = AppConstants.Api_Domain + "api/cart";
    const headers = {
      "Content-Type": "application/json",
      authorization: AppConstants.Auth_Token,
    };

    apiService.getRequest(
      url,
      headers,
      (res) => {
        setCart(res.data);
        const count = res.data.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setItemCount(count);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching cart:", error);
        setLoading(false);
      }
    );
  };

  const addToCart = (item, category, quantity = 1) => {
    if (!user) return;

    const url = AppConstants.Api_Domain + "api/cart/add";
    const headers = {
      "Content-Type": "application/json",
      authorization: AppConstants.Auth_Token,
    };
    const body = JSON.stringify({ item, category, quantity });

    apiService.postRequest(
      url,
      headers,
      body,
      (res) => {
        setCart(res.data);
        const count = res.data.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setItemCount(count);
      },
      (error) => {
        console.error("Error adding to cart:", error);
      }
    );
  };

  const updateQuantity = (itemId, quantity) => {
    if (!user) return;

    const url = AppConstants.Api_Domain + `api/cart/item/${itemId}`;
    const headers = {
      "Content-Type": "application/json",
      authorization: AppConstants.Auth_Token,
    };
    const body = JSON.stringify({ quantity });

    apiService.putRequest(
      url,
      headers,
      body,
      (res) => {
        setCart(res.data);
        const count = res.data.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setItemCount(count);
      },
      (error) => {
        console.error("Error updating quantity:", error);
      }
    );
  };

  const removeFromCart = (itemId) => {
    if (!user) return;

    const url = AppConstants.Api_Domain + `api/cart/item/${itemId}`;
    const headers = {
      "Content-Type": "application/json",
      authorization: AppConstants.Auth_Token,
    };

    apiService.deleteRequest(
      url,
      headers,
      null,
      (res) => {
        setCart(res.data);
        const count = res.data.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setItemCount(count);
      },
      (error) => {
        console.error("Error removing from cart:", error);
      }
    );
  };

  const clearCart = () => {
    if (!user) return;

    const url = AppConstants.Api_Domain + "api/cart/clear";
    const headers = {
      "Content-Type": "application/json",
      authorization: AppConstants.Auth_Token,
    };

    apiService.deleteRequest(
      url,
      headers,
      null,
      (res) => {
        setCart(res.data);
        setItemCount(0);
      },
      (error) => {
        console.error("Error clearing cart:", error);
      }
    );
  };

  const getTotalAmount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        getTotalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
