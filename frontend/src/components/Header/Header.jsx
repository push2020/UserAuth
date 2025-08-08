import { Link } from "react-router-dom";
import "../Header/Header.scss";

export const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <Link to="/">
            <img
              className="logo-icon"
              src="food_express.png"
              alt="FoodExpress"
            />
            <span>FoodExpress</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/menu">Menu</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </nav>

        {/* Call-to-Action Button */}
        <div className="cta">
          <Link to="/login" className="cta-btn">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
};
