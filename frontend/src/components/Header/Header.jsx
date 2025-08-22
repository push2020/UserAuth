import { Link, useNavigate } from "react-router-dom";
import "../Header/Header.scss";
import { useModal } from "../../context/ModalContext.jsx";
import { AuthModal } from "../AuthModal/AuthModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useState } from "react";
import { Prompt } from "../Prompt/Prompt.jsx";
import OutSideClick from "../../hooks/useOutSideClick.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export const Header = () => {
  const navigate = useNavigate();
  const { isModalOpen, openModal, closeModal } = useModal();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [isProfile, setIsProfile] = useState(false);

  const handleProfileClick = () => {
    setIsProfile(true);
  };

  const handleLogoutClick = () => {
    setIsProfile(false);
    showToast({ title: "Signed Out", body: "Signed Out Successfully." });
    setTimeout(() => {
      logout();
    }, 3000);
  };

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
          <div className="profile">
            <OutSideClick
              onOutsideClick={() => {
                setIsProfile(false);
              }}
            >
              <div className="cta-btn" onClick={handleProfileClick}>
                <span>
                  <img
                    className="cta-user-logo"
                    src={user.image || "avatar.png"}
                  ></img>
                </span>
                <span className="cta-user">{user.name}</span>
              </div>
              {isProfile && (
                <Prompt>
                  <div className="profile-list">
                    <div
                      className="profile-list-ls"
                      onClick={() => {
                        setIsProfile(false);
                        navigate("/profile");
                      }}
                    >
                      Profile
                    </div>
                    <div
                      className="profile-list-ls"
                      onClick={handleLogoutClick}
                    >
                      LogOut
                    </div>
                  </div>
                </Prompt>
              )}
            </OutSideClick>
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
