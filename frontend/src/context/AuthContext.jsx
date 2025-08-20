import { useContext, createContext, use, useState } from "react";
import AppConstants from "../constants/AppConstants";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("userProfile");
    setUser(null);
  };

  useState(() => {
    const user = JSON.parse(localStorage.getItem("userProfile"));
    if (user) {
      console.log("user Exist", user);
      AppConstants.Auth_Token = user.jwtToken;
      login(user);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
