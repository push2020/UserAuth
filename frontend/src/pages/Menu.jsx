import { useEffect, useState } from "react";
import "../styles/Menu.scss";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";

export const Menu = () => {
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    const url = AppConstants.Api_Domain + "menu";
    const headers = {};
    apiService.getRequest(url, headers, menuSuccessHandler, menuErrorHandler);
  }, []);

  const menuSuccessHandler = (res) => {
    const { data } = res;
    console.log("categories", data);
    setMenu(data);
  };

  const menuErrorHandler = (error) => {
    console.log("menuErrorHandler", error);
  };

  if (!menu) return <p>Loading menu...</p>;

  return (
    <div className="menu-page">
      <div className="menu-header">
        <h1>Menu</h1>
      </div>
      {menu.categories.map((category, idx) => (
        <div key={idx} className="menu-category">
          <h2>{category.name}</h2>
          <div className="menu-items">
            {category.items.map((item, i) => (
              <div key={i} className="menu-item">
                <img src={item.image} alt={item.name} />
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p className="price">₹{item.price}</p>
                  <p className={item.isVeg ? "veg" : "non-veg"}>
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </p>
                </div>
                <button className="add-btn">Add</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
