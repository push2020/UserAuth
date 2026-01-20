import { use, useEffect, useState } from "react";
import "../styles/Menu.scss";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Footer } from "../components/Footer/Footer.jsx";
import Loader from "../components/Loader/Loader.jsx";

export const Menu = () => {
  const [menu, setMenu] = useState(null);
  const [items, setItems] = useState({});
  const { user } = useAuth();

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

  const addButtonHandler = (action, item) => {
    console.log("add button clickec", "item", item.name);
    const key = item._id;
    let count = items[key] || 0;

    setItems((prev) => ({
      ...prev,
      [key]: action === "subtract" ? count - 1 : count + 1,
    }));
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
                      {items[item._id] > 0 && (
                        <div
                          className="add-btn-subtract"
                          onClick={() => addButtonHandler("subtract", item)}
                        >
                          -
                        </div>
                      )}
                      <div
                        className={!items[item._id] ? "add-btn-text" : ""}
                        onClick={() => addButtonHandler("add", item)}
                      >
                        {items[item._id] ? items[item._id] : "Add"}
                      </div>
                      {items[item._id] > 0 && (
                        <div
                          className="add-btn-plus"
                          onClick={() => addButtonHandler("add", item)}
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
