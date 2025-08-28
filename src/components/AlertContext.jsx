// AlertContext.jsx
import { createContext, useState, useContext } from "react";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [modal, setModal] = useState({ show: false, message: "", type: "alert", resolve: null });

  const alert = (message) =>
    new Promise((resolve) => setModal({ show: true, message, type: "alert", resolve }));

  const confirm = (message) =>
    new Promise((resolve) => setModal({ show: true, message, type: "confirm", resolve }));

  const prompt = (message, defaultValue = "") =>
    new Promise((resolve) =>
      setModal({ show: true, message, type: "prompt", defaultValue, resolve })
    );

  const handleClose = (result = null) => {
    if (modal.resolve) modal.resolve(result);
    setModal({ ...modal, show: false, message: "", resolve: null });
  };

  return (
    <AlertContext.Provider value={{ alert, confirm, prompt }}>
      {children}

      {modal.show && (
        <div className="modal">
          <div className="modal-content">
            <p>{modal.message}</p>
            {modal.type === "alert" && <button onClick={() => handleClose(true)}>OK</button>}

            {modal.type === "confirm" && (
              <>
                <button onClick={() => handleClose(true)}>Sí</button>
                <button onClick={() => handleClose(false)}>No</button>
              </>
            )}

            {modal.type === "prompt" && (
              <>
                <input
                  type="text"
                  defaultValue={modal.defaultValue}
                  onChange={(e) => (modal.value = e.target.value)}
                />
                <button onClick={() => handleClose(modal.value)}>Aceptar</button>
                <button onClick={() => handleClose(null)}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
