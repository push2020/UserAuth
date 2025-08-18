import React, { useEffect, useState } from "react";
import "./ToastMessage.scss";
import { ic_cancel, ic_confirm, ic_progress } from "../../utils/iconSvg";

const ToastMessage = ({ title, body, onClose, type = "" }) => {
  const [visible, setVisible] = useState(true);
  let icon = ic_confirm;
  let iconColor = "green";
  switch (type) {
    case "error":
      icon = ic_cancel;
      iconColor = "red";
      break;

    case "progress":
      icon = ic_progress;
      iconColor = "orange";
      break;

    default:
      break;
  }

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    const closeTimer = setTimeout(() => {
      if (onClose) onClose();
    }, 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div className={`toastmessage ${!visible ? "toastmessage--hide" : ""}`}>
      <div className="toastmessage__container">
        <div className={`toastmessage__left ${iconColor}`}>{icon}</div>
        <div className="toastmessage__right">
          <span className="toastmessage__right-title">{title}</span>
          <span className="toastmessage__right-body">{body}</span>
        </div>
      </div>
    </div>
  );
};

export default ToastMessage;
