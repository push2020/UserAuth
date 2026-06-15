import { Link } from "react-router-dom";
import "../styles/NotFound.scss";

// 404 route. Cinematic dark layout matching the rest of the app, with a single
// "Back home" primary CTA.
export const NotFound = () => {
  return (
    <div className="notfound">
      <div className="notfound-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="grid" />
      </div>

      <div className="notfound-inner">
        <p className="notfound-eyebrow">
          <span className="dot" />
          Lost crumb
        </p>
        <h1 className="notfound-title" aria-label="404">
          <span>4</span>
          <span className="notfound-zero">0</span>
          <span>4</span>
        </h1>
        <p className="notfound-message">
          The page you&apos;re looking for has been eaten — or never existed.
        </p>
        <Link to="/" className="notfound-link">
          <span>Back to home</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
