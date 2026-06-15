import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./ToastMessage.scss";
import { ic_cancel, ic_confirm, ic_progress } from "../../utils/iconSvg";

const VISIBLE_MS = 3000;
const FADE_MS = 500;

// Maps a toast type to its icon and visual variant class.
const variantFor = (type) => {
  switch (type) {
    case "error":
      return { icon: ic_cancel, variant: "is-error" };
    case "progress":
      return { icon: ic_progress, variant: "is-progress" };
    default:
      return { icon: ic_confirm, variant: "is-success" };
  }
};

// Floating notification rendered into document.body via portal so it isn't
// clipped by any ancestor with backdrop-filter or transform.
const ToastMessage = ({ title, body, onClose, type = "" }) => {
  const [visible, setVisible] = useState(true);
  const { icon, variant } = variantFor(type);

  // Fades the toast out after VISIBLE_MS and removes it after the fade settles.
  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    const closeTimer = window.setTimeout(
      () => onClose?.(),
      VISIBLE_MS + FADE_MS,
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(closeTimer);
    };
  }, [onClose]);

  const toast = (
    <div
      className={`toast ${variant}${visible ? "" : " is-hide"}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="toast-body">
        <span className="toast-title">{title}</span>
        {body && <span className="toast-text">{body}</span>}
      </div>
      <span className="toast-progress" aria-hidden="true" />
    </div>
  );

  return createPortal(toast, document.body);
};

export default ToastMessage;
