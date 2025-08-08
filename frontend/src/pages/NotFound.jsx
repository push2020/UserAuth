import { Link } from "react-router-dom";
import "../styles/NotFound.scss";

export const NotFound = () => {
  return (
    <div className="notfound-container">
      <h1 className="notfound-title">404</h1>
      <p className="notfound-message">
        Oops! The page you’re looking for doesn’t exist.
      </p>
      <Link to="/" className="notfound-link">
        Go Back Home
      </Link>
    </div>
  );
};
