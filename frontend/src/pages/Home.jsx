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
            <img src="/images/hero-food.png" alt="Delicious food" />
          </div>
        </section>

        {/* Categories */}
        <section className="categories">
          <h2>Popular Categories</h2>
          <div className="category-list">
            <div className="category-card">
              <img src="/images/pizza.jpg" alt="Pizza" />
              <p>Pizza</p>
            </div>
            <div className="category-card">
              <img src="/images/burger.jpg" alt="Burger" />
              <p>Burgers</p>
            </div>
            <div className="category-card">
              <img src="/images/sushi.jpg" alt="Sushi" />
              <p>Sushi</p>
            </div>
            <div className="category-card">
              <img src="/images/indian.jpg" alt="Indian" />
              <p>Indian</p>
            </div>
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
