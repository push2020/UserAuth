import { BrowserRouter } from "react-router-dom";
import "./Global.css";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import { Header } from "./components/Header/Header.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <Header />
          <AppRoutes />
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
