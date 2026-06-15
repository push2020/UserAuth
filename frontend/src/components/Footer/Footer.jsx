import { Link } from "react-router-dom";
import "../Footer/Footer.scss";
import { cloudinaryAssets } from "../../constants/cloudinaryAssets.js";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

// Small inline SVG glyphs used in the "Reach us" column.
// Each icon is decorative — the surrounding link text provides the label.

// Envelope glyph for the email row.
const MailIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

// Phone handset glyph for the phone row.
const PhoneIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// Map-pin glyph for the address row.
const PinIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Site-wide footer with brand info, quick links, contact details, and a copyright bar.
export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-bg" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
      </div>

      <div className="footer-container">
        <div className="footer-section brand">
          <Link to="/" className="footer-logo" aria-label="FoodExpress home">
            <img src={cloudinaryAssets.logo} alt="" />
            <span>FoodExpress</span>
          </Link>
          <p>
            Delicious food delivered at lightning speed, right to your
            doorstep.
          </p>
        </div>

        <div className="footer-section">
          <h4>Explore</h4>
          <ul>
            {QUICK_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to}>
                  {label}
                  <span className="link-underline" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h4>Reach us</h4>
          <ul className="contact-list">
            <li>
              <a href="mailto:support@foodexpress.com">
                <span className="contact-icon" aria-hidden="true">
                  <MailIcon />
                </span>
                <span>support@foodexpress.com</span>
              </a>
            </li>
            <li>
              <a href="tel:+919876543210">
                <span className="contact-icon" aria-hidden="true">
                  <PhoneIcon />
                </span>
                <span>+91 98765 43210</span>
              </a>
            </li>
            <li>
              <span className="contact-static">
                <span className="contact-icon" aria-hidden="true">
                  <PinIcon />
                </span>
                <span>123 Food Street, Andheri West, Mumbai</span>
              </span>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Hours</h4>
          <p>Monday – Sunday</p>
          <p className="muted">9:00 AM – 11:00 PM</p>
          <p className="kitchen-status">
            <span className="status-dot" aria-hidden="true" />
            Kitchens open now
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} FoodExpress. All rights reserved.</p>
        <p className="muted">Crafted with care.</p>
      </div>
    </footer>
  );
};
