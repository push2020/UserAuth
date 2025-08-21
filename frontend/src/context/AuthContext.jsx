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
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    setUser(null);
  };

  const getUserDetails = (id) => {
    const url = AppConstants.Api_Domain + `api/user/${id}`;
    const headers = { "content-type": "application/json" };
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
  };

  useState(() => {
    const user = JSON.parse(localStorage.getItem("userProfile"));

    if (user) {
      console.log("user Exist", user);
      AppConstants.Auth_Token = localStorage.getItem("authToken");
      getUserDetails(user.id);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
