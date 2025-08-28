import React from 'react';
import { useEffect } from 'react';
import { useAlert } from './components/AlertContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './components/AlertContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente principal de la aplicación
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  const { alert, confirm, prompt } = useAlert();

  useEffect(() => {
    window.alert = alert;       // reemplaza alert nativo
    window.confirm = confirm;   // reemplaza confirm nativo
    window.prompt = prompt;     // reemplaza prompt nativo
  }, [alert, confirm, prompt]);
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// App principal
function App() {
  return (
    <Router>
      <AuthProvider>
        <AlertProvider>
          <div className="App">
            <AppContent />
          </div>
        </AlertProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
