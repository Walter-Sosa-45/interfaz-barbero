import axios from 'axios';
import { format } from 'date-fns';
import { config } from './config';

// Configurar axios con prefijo /api/v1
const api = axios.create({
  baseURL: `${config.API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: config.REQUEST_TIMEOUT,
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token agregado a request:', config.url);
    } else {
      console.log('⚠️ No hay token para request:', config.url);
    }
    console.log('📤 Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // Solo limpiar si no es un intento de login
      if (!error.config.url.includes('/auth/login')) {
        console.warn('Token expirado o inválido, limpiando sesión local');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Redirigir al login si es necesario
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (credentials) => {
    console.log('🔐 Intentando login en:', `${config.API_BASE_URL}/api/v1/auth/login`);
    console.log('📤 Credenciales:', { usuario: credentials.usuario, password: '***' });
    
    try {
      const response = await api.post('/auth/login', credentials);
      console.log('✅ Login exitoso:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ Error en login:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Headers:', error.response?.headers);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

// Servicios de turnos
export const turnosService = {
  getTurnos: async (params = {}) => {
    const response = await api.get('/turnos/', { params });
    return response.data;
  },

  getTurnosPorFecha: async (fecha) => {
    const response = await api.get(`/turnos/fecha/${fecha}`);
    return response.data;
  },

  getTurnosSemana: async (fecha) => {
    const response = await api.get(`/turnos/semana/${fecha}`);
    return response.data;
  },

  createTurno: async (turnoData) => {
    const response = await api.post('/turnos/', turnoData);
    return response.data;
  },

  updateTurno: async (id, turnoData) => {
    const response = await api.put(`/turnos/${id}`, turnoData);
    return response.data;
  },

  deleteTurno: async (id) => {
    const response = await api.delete(`/turnos/${id}`);
    return response.data;
  },

  cancelarTurno: async (id) => {
    const response = await api.put(`/turnos/cancelar/${id}`);
    return response.data;
  },

  completarTurno: async (id) => {
    const response = await api.put(`/turnos/completar/${id}`);
    return response.data;
  },

  turnoEnCurso: async (id) => {
    const response = await api.put(`/turnos/en-curso/${id}`);
    return response.data;
  },

  restaurarTurno: async (id) => {
    const response = await api.put(`/turnos/restaurar/${id}`);
    return response.data;
  },

  getEstadisticas: async (fechaInicio, fechaFin) => {
    const response = await api.get('/turnos/estadisticas', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
    return response.data;
  },

  getTurnosNoNotificados: async () => {
  const response = await api.get('/turnos/no-notificados'); // ruta exacta en FastAPI
  return response.data;
  },
  
  marcarTurnosLeidas: async () => {
    const response = await api.put('/notificaciones/marcar-leidas');
    return response.data;
  },

  getHorariosDisponibles: async (fecha) => {
    const response = await api.get('/turnos/disponibilidad', { params: { fecha } });
    return response.data;
  },

  verificarDisponibilidad: async (fecha, horaInicio, horaFin) => {
    const response = await api.get('/turnos/disponibilidad', {
      params: { fecha, hora_inicio: horaInicio, hora_fin: horaFin }
    });
    return response.data;
  }

};

// Servicios de bloqueos
export const bloqueosService = {
  crearBloqueo: async (data) => {
    const response = await api.post('/bloqueos/', data);
    return response.data;
  },
  listarBloqueos: async (params = {}) => {
    const response = await api.get('/bloqueos/', { params });
    return response.data;
  },
  eliminarBloqueo: async (id) => {
    const response = await api.delete(`/bloqueos/${id}`);
    return response.data;
  },
  verificarBloqueosFecha: async (fecha) => {
    const response = await api.get(`/bloqueos/fecha/${fecha}`);
    return response.data;
  },
};

// Servicios de usuarios
export const usuariosService = {
  getUsuarios: async (params = {}) => {
    const response = await api.get('/usuarios/', { params });
    return response.data;
  },

  getUsuario: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  createUsuario: async (usuarioData) => {
    const response = await api.post('/usuarios/', usuarioData);
    return response.data;
  },

  updateUsuario: async (id, usuarioData) => {
    const response = await api.put(`/usuarios/${id}`, usuarioData);
    return response.data;
  }
};

// Servicios de servicios
export const serviciosService = {
  getServicios: async (params = {}) => {
    const response = await api.get('/servicios/', { params });
    return response.data;
  },

  getServicio: async (id) => {
    const response = await api.get(`/servicios/${id}`);
    return response.data;
  },

  createServicio: async (servicioData) => {
    const response = await api.post('/servicios/', servicioData);
    return response.data;
  },

  updateServicio: async (id, servicioData) => {
    const response = await api.put(`/servicios/${id}`, servicioData);
    return response.data;
  }
  
};



export default api;
