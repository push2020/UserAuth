import { Link } from "react-router-dom";
import { Footer } from "../components/Footer/Footer.jsx";
import "../styles/Home.scss";
import { useEffect } from "react";
import { apiService } from "../services/apiservice.js";
import AppConstants from "../constants/AppConstants.js";
import { useState } from "react";

export const Home = () => {
  const [homeState, setHomeState] = useState(null);

  useEffect(() => {
    const url = AppConstants.Api_Domain + "api/begin";
    const headers = {};
    apiService.getRequest(url, headers, successHandler, errorHandler);
  }, []);

  const successHandler = (res) => {
    if (res) setHomeState(res.data);
  };
  const errorHandler = (error) => {
    console.log("error in begin");
  };

  return (
    <>
      <div className="home-container">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-text">
            <h1>Delicious food, delivered to your door</h1>
            <p>
              Order from your favorite restaurants with lightning-fast delivery.
            </p>
            <Link to="/menu" className="hero-btn">
              Order Now
            </Link>
          </div>
          <div className="hero-image">
            <img
              src="/flavorful-tacos-with-guacamole-and-beer.webp"
              alt="Delicious food"
            />
          </div>
        </section>

        {/* Categories */}
        <section className="categories">
          <h2>Popular Categories</h2>
          <div className="category-list">
            {homeState?.popularDishes &&
              homeState?.popularDishes.map(({ key, name, url }) => (
                <Link to="/menu" className="category-card" key={key}>
                  <img src={url} alt="Pizza" />
                  <p>{name}</p>
                </Link>
              ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <span>1</span>
              <p>Browse the menu</p>
            </div>
            <div className="step">
              <span>2</span>
              <p>Place your order</p>
            </div>
            <div className="step">
              <span>3</span>
              <p>Get it delivered</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
};
