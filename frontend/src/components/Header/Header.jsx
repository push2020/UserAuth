import { Link } from "react-router-dom";
import "../Header/Header.scss";
import { useModal } from "../../context/ModalContext.jsx";
import { AuthModal } from "../AuthModal/AuthModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ic_chevron_down } from "../../utils/iconSvg.jsx";

export const Header = () => {
  const { isModalOpen, openModal, closeModal } = useModal();
  const { user, logout } = useAuth();

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
        {user ? (
          <div className="cta-btn">
            <span>
              <img
                className="cta-user-logo"
                src={user.image || "user_logo.png"}
              ></img>
            </span>
            <span className="cta-user">{user.name}</span>
          </div>
        ) : (
          <div className="cta">
            <div className="cta-btn" onClick={openModal}>
              Sign In
            </div>
            <AuthModal isOpen={isModalOpen} onClose={closeModal} />
          </div>
        )}
      </div>
    </header>
  );
};
