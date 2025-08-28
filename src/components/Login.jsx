import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const { login, error, loading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    usuario: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      clearError();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('🔐 Intentando iniciar sesión con:', { usuario: formData.usuario, password: '***' });
      await login(formData);

      const token = localStorage.getItem('authToken');
      if (!token) {
      console.warn("⚠️ No hay token aún");
      return;
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      // El error ya se maneja en el contexto, pero podemos agregar más información aquí
    }
  };

  const testConnection = async () => {
    try {
      console.log('🧪 Probando conexión al backend...');
      const response = await fetch('http://192.168.0.102:8000/health');
      const data = await response.json();
      console.log('✅ Conexión exitosa:', data);
      alert(`Conexión exitosa: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      alert(`Error de conexión: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar Sesión</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usuario">Usuario</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                id="usuario"
                name="usuario"
                value={formData.usuario}
                onChange={handleChange}
                placeholder="Ingresa tu usuario"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
