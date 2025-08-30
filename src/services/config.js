// Configuración de la aplicación
export const config = {
    // URL del backend sin el prefijo de versión
    // API_BASE_URL: import.meta.env.VITE_API_URL || 'https://servidor-gestion-turnos-prueba.onrender.com',
    API_BASE_URL: 'http://192.168.0.102:8000',
    
    // Intervalo de actualización automática (en milisegundos)
    AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutos
    
    // Configuración de paginación
    DEFAULT_PAGE_SIZE: 20,
    
    // Configuración de timeouts
    REQUEST_TIMEOUT: 10000, // 10 segundos
    
    // Configuración de reintentos
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 segundo
  };
  
  // Función para obtener la URL completa de un endpoint
  export const getApiUrl = (endpoint) => {
    // Agrega automáticamente el prefijo /api/v1
    return `${config.API_BASE_URL}/api/v1${endpoint}`;
  };
  
  // Función para formatear fechas
  export const formatDate = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      return date;
    }
    
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    // Si es un objeto date de la base de datos
    if (date.year && date.month && date.day) {
      return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    }
    
    return '';
  };
  
  // Función para formatear horas
  export const formatTime = (time) => {
    if (!time) return '';
    
    if (typeof time === 'string') {
      return time;
    }
    
    // Si es un objeto time de la base de datos
    if (time.hours !== undefined && time.minutes !== undefined) {
      return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
    }
    
    return '';
  };
  