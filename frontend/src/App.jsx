import { BrowserRouter } from "react-router-dom";
import "./Global.scss";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import { Header } from "./components/Header/Header.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <ToastProvider>
          <BrowserRouter>
            <Header />
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
