import { useContext, createContext, useState } from "react";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    AppConstants.Auth_Token = "";
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const getUserDetails = (id) => {
    const url = AppConstants.Api_Domain + `api/user/${id}`;
    const headers = {
      "content-type": "application/json",
      authorization: AppConstants.Auth_Token,
    };
    apiService.getRequest(
      url,
      headers,
      getUserSuccessHandler,
      getUserErrorHandler
    );
  };

  const getUserSuccessHandler = (res) => {
    const { data } = res;
    login(data);
  };

  const getUserErrorHandler = (error) => {
    console.log("get user error", error);
    if (error) {
      const { code } = error;
      if (code === 419) {
        logout();
      }
    }
  };

  useState(() => {
    const user = JSON.parse(localStorage.getItem("userProfile"));

    if (user) {
      console.log("user Exist", user);
      AppConstants.Auth_Token = localStorage.getItem("authToken");
      getUserDetails(user._id);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
