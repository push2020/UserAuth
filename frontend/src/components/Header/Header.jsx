import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Header/Header.scss";
import { useModal } from "../../context/ModalContext.jsx";
import { AuthModal } from "../AuthModal/AuthModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { Prompt } from "../Prompt/Prompt.jsx";
import OutSideClick from "../../hooks/useOutSideClick.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Cart } from "../Cart/Cart.jsx";
import AppConstants from "../../constants/AppConstants.js";
import { cloudinaryAssets } from "../../constants/cloudinaryAssets.js";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const SCROLL_THRESHOLD = 30;
const LOGOUT_DELAY_MS = 2000;
const BADGE_PULSE_MS = 420;

// Resolves a user's stored avatar value into an absolute URL.
// Accepts the raw avatar string (which may be a full URL, a relative API path, or null/undefined).
// Returns either the absolute URL or the bundled fallback at /avatar.png.
const resolveAvatar = (avatar) => {
  if (!avatar) return "/avatar.png";
  if (avatar.startsWith("http")) return avatar;
  return (AppConstants.Api_Domain + avatar).replace(/\/\/$/, "/");
};

// Decides whether a nav link matches the current route. The "/" link only matches the exact root;
// any other prefix-match counts (e.g. "/menu" matches "/menu" and "/menu/123").
const isLinkActive = (linkPath, currentPath) => {
  if (linkPath === "/") return currentPath === "/";
  return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`);
};

// Inline SVG cart glyph. Decorative — caller supplies the accessible label.
const CartIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 3h2.2l2.2 12.2A2 2 0 0 0 9.4 17h8.4a2 2 0 0 0 1.96-1.6L21 8H6.6" />
    <circle cx="10" cy="20.5" r="1.5" />
    <circle cx="18" cy="20.5" r="1.5" />
  </svg>
);

// Small downward chevron used by the profile chip to signal "menu opens here".
const ChevronIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// Hamburger / close glyph for the mobile nav toggle. Picks the matching icon based on the open prop.
const MenuIcon = ({ isOpen }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    {isOpen ? (
      <>
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </>
    ) : (
      <>
        <path d="M3 7h18" />
        <path d="M3 12h18" />
        <path d="M3 17h18" />
      </>
    )}
  </svg>
);

// The user chip rendered in the header when a user is signed in. Shows avatar, name, and a chevron.
// Toggles the profile dropdown via the onClick handler; the parent owns the open/closed state.
const UserChip = ({ user, onClick, isOpen }) => (
  <button
    type="button"
    className={`user-chip${isOpen ? " is-active" : ""}`}
    onClick={onClick}
    aria-haspopup="menu"
    aria-expanded={isOpen}
  >
    <span className="user-chip-avatar">
      <img src={resolveAvatar(user.avatar)} alt="" />
    </span>
    <span className="user-chip-name">{user.name}</span>
    <span className={`user-chip-chevron${isOpen ? " is-flipped" : ""}`}>
      <ChevronIcon />
    </span>
  </button>
);

// Top-of-app sticky header. Owns the cart drawer trigger, the profile dropdown,
// the mobile nav drawer, and the scroll-aware visual state.
export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isModalOpen, openModal, closeModal } = useModal();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { showToast } = useToast();
  const [isProfile, setIsProfile] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [badgeBumped, setBadgeBumped] = useState(false);

  // Toggles the .is-scrolled class on the header once the page scrolls past SCROLL_THRESHOLD.
  useEffect(() => {
    // Updates the scrolled flag based on the current vertical scroll position.
    const handleScroll = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Closes the mobile nav drawer whenever the route changes so it doesn't linger between pages.
  useEffect(() => {
    setIsMobileOpen(false);
    setIsProfile(false);
  }, [location.pathname]);

  // Briefly toggles a .is-bump class on the cart badge whenever the cart count changes,
  // letting CSS run a small attention pulse animation.
  useEffect(() => {
    if (itemCount === 0) return undefined;
    setBadgeBumped(true);
    const id = setTimeout(() => setBadgeBumped(false), BADGE_PULSE_MS);
    return () => clearTimeout(id);
  }, [itemCount]);

  // Signs the user out after a short delay so the toast has time to be seen.
  const handleLogoutClick = () => {
    setIsProfile(false);
    showToast({ title: "Signed out", body: "You have been signed out." });
    setTimeout(logout, LOGOUT_DELAY_MS);
  };

  // Closes the dropdown and navigates to the profile page.
  const handleProfileNav = () => {
    setIsProfile(false);
    navigate("/profile");
  };

  const itemCountLabel = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  return (
    <header className={`header${isScrolled ? " is-scrolled" : ""}`}>
      <div className="header-container">
        <Link to="/" className="logo" aria-label="FoodExpress home">
          <img className="logo-icon" src={cloudinaryAssets.logo} alt="" />
          <span className="logo-text">FoodExpress</span>
        </Link>

        <nav
          className={`nav${isMobileOpen ? " is-open" : ""}`}
          aria-label="Primary"
        >
          <ul>
            {NAV_LINKS.map(({ to, label }) => {
              const active = isLinkActive(to, location.pathname);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`nav-link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{label}</span>
                    <span className="nav-underline" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="header-actions">
          {user && (
            <button
              type="button"
              className="cart-button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open cart, ${itemCountLabel}`}
            >
              <CartIcon />
              {itemCount > 0 && (
                <span
                  className={`cart-badge${badgeBumped ? " is-bump" : ""}`}
                  aria-hidden="true"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="profile">
              <OutSideClick onOutsideClick={() => setIsProfile(false)}>
                <UserChip
                  user={user}
                  onClick={() => setIsProfile((open) => !open)}
                  isOpen={isProfile}
                />
                {isProfile && (
                  <Prompt>
                    <div className="profile-menu" role="menu">
                      <button
                        type="button"
                        className="profile-menu-item"
                        onClick={handleProfileNav}
                        role="menuitem"
                      >
                        View profile
                      </button>
                      <button
                        type="button"
                        className="profile-menu-item is-destructive"
                        onClick={handleLogoutClick}
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </Prompt>
                )}
              </OutSideClick>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="sign-in-btn"
                onClick={openModal}
              >
                Sign in
              </button>
              <AuthModal isOpen={isModalOpen} onClose={closeModal} />
            </>
          )}

          <button
            type="button"
            className="menu-toggle"
            onClick={() => setIsMobileOpen((open) => !open)}
            aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileOpen}
          >
            <MenuIcon isOpen={isMobileOpen} />
          </button>
        </div>
      </div>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};
