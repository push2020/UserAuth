import { useEffect, useState } from "react";
import "../styles/Menu.scss";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { Footer } from "../components/Footer/Footer.jsx";
import Loader from "../components/Loader/Loader.jsx";

// Helper function to generate itemId (must match backend)
const generateItemId = (category, itemName) => {
  return `${category}_${itemName}`.replace(/\s+/g, "_").toLowerCase();
};

export const Menu = () => {
  const [menu, setMenu] = useState(null);
  const { user } = useAuth();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

  useEffect(() => {
    if (!user) return;
    const url = AppConstants.Api_Domain + "menu";
    const headers = { authorization: AppConstants.Auth_Token };
    apiService.getRequest(url, headers, menuSuccessHandler, menuErrorHandler);
  }, [user]);

  const menuSuccessHandler = (res) => {
    const { data } = res;
    console.log("menu handler sucess", data);
    setMenu(data);
  };

  const menuErrorHandler = (error) => {
    console.log("menuErrorHandler", error);
    setMenu("error");
  };

  // Get quantity for an item from cart
  const getItemQuantity = (category, item) => {
    if (!cart || !cart.items) return 0;
    const itemId = generateItemId(category, item.name);
    const cartItem = cart.items.find((ci) => ci.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const addButtonHandler = (action, item, category) => {
    const itemId = generateItemId(category, item.name);
    const currentQuantity = getItemQuantity(category, item);

    if (action === "add") {
      if (currentQuantity === 0) {
        // Add new item to cart
        addToCart(item, category, 1);
      } else {
        // Update quantity
        updateQuantity(itemId, currentQuantity + 1);
      }
    } else if (action === "subtract") {
      if (currentQuantity > 1) {
        // Decrease quantity
        updateQuantity(itemId, currentQuantity - 1);
      } else {
        // Remove item from cart
        removeFromCart(itemId);
      }
    }
  };

  if (user === undefined) {
    return (
      <div className="loader">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <p className="profile-notfound text-center mt-10">
        Please login to view your profile.
      </p>
    );
  }

  if (!menu) {
    return (
      <div className="loader">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <div className="menu-page">
        <div className="menu-header">
          <h1>Menu</h1>
        </div>
        {menu?.categories.map((category, idx) => (
          <div key={idx} className="menu-category">
            <h2>{category.name}</h2>
            <div className="menu-items">
              {category.items.map((item, i) => (
                <div key={i} className="menu-item">
                  <img
                    src={item.image || menu.defaultImage}
                    alt={item.name}
                    onError={(e) => (e.target.src = menu.defaultImage)}
                  />
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p className="price">₹{item.price}</p>
                    <p className={item.isVeg ? "veg" : "non-veg"}>
                      {item.isVeg ? "Veg" : "Non-Veg"}
                    </p>
                  </div>
                  <div className="add-container">
                    <button className="add-btn">
                      {getItemQuantity(category.name, item) > 0 && (
                        <div
                          className="add-btn-subtract"
                          onClick={() => addButtonHandler("subtract", item, category.name)}
                        >
                          -
                        </div>
                      )}
                      <div
                        className={!getItemQuantity(category.name, item) ? "add-btn-text" : ""}
                        onClick={() => addButtonHandler("add", item, category.name)}
                      >
                        {getItemQuantity(category.name, item) || "Add"}
                      </div>
                      {getItemQuantity(category.name, item) > 0 && (
                        <div
                          className="add-btn-plus"
                          onClick={() => addButtonHandler("add", item, category.name)}
                        >
                          +
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
};
