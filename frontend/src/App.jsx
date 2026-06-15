import { BrowserRouter } from "react-router-dom";
import "./Global.scss";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import { Header } from "./components/Header/Header.jsx";
import { ScrollToTop } from "./components/ScrollToTop/ScrollToTop.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { LocationProvider } from "./context/LocationContext.jsx";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ModalProvider>
          <ToastProvider>
            <LocationProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Header />
                <AppRoutes />
              </BrowserRouter>
            </LocationProvider>
          </ToastProvider>
        </ModalProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
