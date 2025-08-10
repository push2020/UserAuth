import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import "./Global.css";
import { ModalContext } from "./utils/ModalContext.js";
import { useState } from "react";
import { AuthModal } from "./components/AuthModal/AuthModal.jsx";

function App() {
  const [isModalopen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <BrowserRouter>
        <AppRoutes />
        <AuthModal isOpen={isModalopen} onClose={closeModal}></AuthModal>
      </BrowserRouter>
    </ModalContext.Provider>
  );
}

export default App;
