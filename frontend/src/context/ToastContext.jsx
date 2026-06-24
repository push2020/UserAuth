import { useState } from "react";
import { useContext } from "react";
import { createContext } from "react";
import ToastMessage from "../components/ToastMessage/ToastMessage";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [isToast, setIsToast] = useState(false);

  const showToast = (data) => {
    setIsToast(data);
  };

  return (
    <ToastContext.Provider value={{ isToast, showToast }}>
      {children}
      {isToast && (
        <ToastMessage
          title={isToast.title}
          body={isToast.body}
          onClose={() => setIsToast(false)}
          type={isToast.type}
        ></ToastMessage>
      )}
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
