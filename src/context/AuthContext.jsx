import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Cambiado a true para inicialización
  const [error, setError] = useState(null);

  // Inicializar usuario desde localStorage al cargar la aplicación
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('authToken');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.login(credentials);
      
      if (response.access_token) {
        const userData = {
          id: response.user.id,
          nombre: response.user.nombre,
          usuario: response.user.usuario,
          rol: response.user.rol
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', response.access_token);
        
        return { success: true, user: userData };
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos';
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = `Error del servidor: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    authService.logout();
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
