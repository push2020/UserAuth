import { useState } from "react";
import "../AuthModal/AuthModal.scss";
import { apiService } from "../../services/apiservice.js";
import AppConstants from "../../constants/AppConstants.js";
import { validationService } from "../../services/validationservice.js";
import ToastMessage from "../ToastMessage/ToastMessage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export const AuthModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isToast, setIsToast] = useState(null);
  const [auth, setAuth] = useState({
    name: null,
    email: null,
    password: null,
  });

  const { name, email, password } = auth;
  const { isEmpty, isEmail, isName, isPassword } = validationService;
  console.log("auth state", auth);

  const handleLoginClick = (e) => {
    e.preventDefault();
    let data = null;
    if (isLogin) {
      data = { email: email, password: password };
    } else {
      data = { name: name, email: email, password: password };
    }
    const isValid = checkValidation(data);
    console.log("checkValidation", isValid);
    if (isValid) {
      if (isLogin) {
        const url = AppConstants.Api_Domain + "auth/login";
        const header = { "Content-Type": "application/json" };
        const body = JSON.stringify(data);
        apiService.postRequest(url, header, body, successHandler, errorHandler);
      } else {
        const url = AppConstants.Api_Domain + "auth/signup";
        const header = { "Content-Type": "application/json" };
        const body = JSON.stringify(data);
        apiService.postRequest(url, header, body, successHandler, errorHandler);
      }
    } else {
      setIsToast({ message: "Invalid Credentials.", success: false });
    }
  };

  const successHandler = (res) => {
    console.log("successs", res);
    if (isLogin) {
      AppConstants.Auth_Token = res.jwtToken;
      localStorage.setItem("userProfile", JSON.stringify(res));
      setIsToast(res);
      setTimeout(() => {
        login(res);
        onClose();
      }, 2000);
    } else {
      setIsToast(res);
      setIsLogin(true);
    }
  };

  const errorHandler = (error) => {
    console.log("errror", error);
    setIsToast(error);
  };

  const handleOnInputChange = (e) => {
    const key = e.target["name"];
    setAuth((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const checkValidation = (val) => {
    let res = false;
    for (const key in val) {
      switch (key) {
        case "name":
          res = isName.test(val[key]);
          break;
        case "email":
          res = isEmail.test(val[key]);
          break;
        case "password":
          res = isPassword.test(val[key]);
          break;
      }
    }
    return res;
  };

  const handleCloseToast = () => {
    setIsToast(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <h2>{isLogin ? "Login" : "Sign Up"}</h2>

        <form>
          {!isLogin && (
            <input
              name="name"
              type="text"
              placeholder="Full Name"
              required
              onChange={handleOnInputChange}
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            onChange={handleOnInputChange}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            onChange={handleOnInputChange}
          />

          <button
            type="submit"
            className="submit-btn"
            onClick={handleLoginClick}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </div>

      {isToast && (
        <ToastMessage
          title={isToast.success ? "Login Success" : "Login Failure"}
          body={isToast.message}
          onClose={handleCloseToast}
          type={!isToast.success ? "error" : ""}
        ></ToastMessage>
      )}
    </div>
  );
};
