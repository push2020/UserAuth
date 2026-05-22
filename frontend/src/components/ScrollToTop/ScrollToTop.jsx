import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Resets the window scroll position to the top whenever the route's pathname
// changes. Hash changes (in-page anchors like `#section`) are intentionally
// ignored so existing anchor-link behaviour is preserved.
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
