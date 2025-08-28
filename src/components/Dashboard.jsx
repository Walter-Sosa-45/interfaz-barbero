import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, User, MessageCircle, Scissors, AlertCircle, Lock, Bell, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { turnosService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MonthlyCalendar from './MonthlyCalendar';
import BloqueoModal from './BloqueoModal';
import '../styles/Dashboard.css';
import NotificationPanel from './Notification';
import BookingSection from './BookingSection';

const Dashboard = () => {
  const { logout, user, loading: authLoading } = useAuth();
  const [expandedTurnos, setExpandedTurnos] = useState(new Set());
  const [turnos, setTurnos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  // const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);  // solo para el primer render
  const [refreshing, setRefreshing] = useState(false);         // para recargas silenciosas

  const [error, setError] = useState(null);
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const [showBookingSection, setShowBookingSection] = useState(false);
  const [showBloqueoModal, setShowBloqueoModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  
  const fechaActual = new Date();
  const diaSemana = format(fechaActual, 'EEEE', { locale: es });
  const diaMes = format(fechaActual, 'dd', { locale: es });
  const mes = format(fechaActual, 'MMMM', { locale: es });

  const [notifications, setNotifications] = useState([]);


  // Mostrar loading mientras se inicializa la autenticación
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading">Inicializando...</div>
      </div>
    );
  }

  // Verificar que el usuario esté autenticado
  if (!user) {
    return (
      <div className="error-container">
        <div className="error-message">No se pudo cargar la información del usuario. Por favor, inicia sesión nuevamente.</div>
        <button onClick={logout} className="logout-button">Cerrar Sesión</button>
      </div>
    );
  }

  const isTurnoRestaurable = (turno) => {
    const [year, month, day] = turno.fecha.split('-').map(Number);
    const [hour, minute] = turno.hora_inicio.split(':').map(Number);
    const turnoFecha = new Date(year, month - 1, day, hour, minute); // hora local
    return turno.estado === 'cancelado' && turnoFecha > new Date();
  };

  const toggleTurno = async(turno) => {
    try {
      if (turno.estado == 'cancelado') {
        await turnosService.restaurarTurno(turno.id);
        alert("Turno restaurado correctamente");
      } else {
        if (!window.confirm("¿Estás seguro de querer cancelar este turno?")) return;
        await turnosService.cancelarTurno(turno.id, "cancelado");
        alert("Turno cancelado correctamente");
      }

      // Refrescar la lista de turnos
      //   await cargarDatos(false);
      //   setTurnos(turnos || []);

    } catch (error) {
      console.log("Error al restaurar turno:", error);
      alert("No se pudo restaurar el turno. Por favor, intenta nuevamente.");
    }
  }

  useEffect(() => {  
    const cargarDatos = async (isInitial = false) => {
      try {
        if (isInitial) {
          setInitialLoading(true);
        } else {
          setRefreshing(true); // no muestra modal, solo actualiza en background
        }
        setError(null);
  
        const fechaHoy = format(new Date(), 'yyyy-MM-dd');
        const turnosDelDiaResponse = await turnosService.getTurnosPorFecha(fechaHoy);
        setTurnos(turnosDelDiaResponse.turnos || []);
  
        const notificacionesResponse = await turnosService.getTurnosNoNotificados();
        setNotifications(
          (notificacionesResponse || []).map(t => ({
            id: t.id,
            titulo: "Nuevo turno",
            cliente: t.cliente || "Cliente",
            fecha: t.fecha,
            hora: t.hora_inicio,
            servicio: t.servicio,
            leida: false
          }))
      );
    
  
    const fechaHoyStr = format(new Date(), 'yyyy-MM-dd');
    console.log(fechaHoyStr);
    const statsResponse = await turnosService.getEstadisticas(fechaHoyStr, fechaHoyStr);
  
    const estadisticasProcesadas = {
      total: statsResponse.estadisticas?.total_turnos || 0,
      pendientes: statsResponse.estadisticas?.pendientes || 0,
      completados: statsResponse.estadisticas?.completados || 0,
      enCurso: statsResponse.estadisticas?.confirmados || 0
    };
    setEstadisticas(estadisticasProcesadas);
    
    
  } catch (error) {
    console.error('❌ Error al cargar datos:', error);
    if (error.response?.status === 422) {
      setError('Error en el formato de fechas. Intenta recargar la página.');
    } else if (error.response?.status === 500) {
      setError('Error del servidor. Verifica que la base de datos esté inicializada.');
    } else if (error.code === 'ERR_NETWORK') {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
    } else {
      setError('Error al cargar los datos. Intenta recargar la página.');
    }
  } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setRefreshing(false);
      }
  }
  };      

   cargarDatos(true);
   const interval = setInterval(() => cargarDatos(false), 1 * 60 * 1000); // cada 1 min
    return () => clearInterval(interval);
  }, []);
  

  const handleWhatsApp = (telefono) => {
    const mensaje = encodeURIComponent('Hola! Te confirmo tu turno en la barbería.');
    window.open(`https://wa.me/${telefono.replace(/\s/g, '')}?text=${mensaje}`, '_blank');
  };

  const handleLogout = async () => {
    const respuesta = await window.confirm('¿Estás seguro de que quieres cerrar sesión?')
    if (respuesta) {
      logout();
    }
  };

  const handleNotifications = async () => {
  setShowNotifications(prev => !prev);
  console.log('🔔 Click en notificaciones');

  // if (!showNotifications && notifications.length > 0) {
  //   // Llamar al backend para marcar los turnos como notificados
  //   try {
  //     await turnosService.marcarTurnosLeidas();

  //     // Actualizar el estado local para que desaparezcan del badge
  //     setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
  //   } catch (error) {
  //     console.error('❌ Error al marcar turnos como notificados:', error);
  //   }
  // }
};


  const toggleTurnoExpansion = (turnoId) => {
    setExpandedTurnos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(turnoId)) {
        newSet.delete(turnoId);
      } else {
        newSet.add(turnoId);
      }
      return newSet;
    });
  };

  const formatearHora = (hora) => {
    if (!hora) return '';
    return hora.slice(0, 5); // HH:MM
  };

  const obtenerNombreCliente = (turno) => {
    return turno.cliente?.nombre || 'Cliente';
  };

  const obtenerTelefonoCliente = (turno) => {
    return turno.cliente?.telefono || 'Sin teléfono';
  };

  if (initialLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <AlertCircle size={48} color="#dc3545" />
          <h3>Error al cargar datos</h3>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="title-bock">
          <h1>Barber</h1>
          <div className="date">
            <Calendar />
            <span>{diaSemana} {diaMes} de {mes}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.nombre || 'Usuario'}</span>
          </div>
          <div className="notification-icon" onClick={handleNotifications}>
            <Bell size={30} />
            {notifications.filter(n => !n.leida).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => !n.leida).length}
              </span>
            )}
              {refreshing && (
                  <span className="refresh-spinner"></span>
              )}
          </div>
          <div className="logout-icon" onClick={handleLogout}>
            <LogOut size={30} />
          </div>
        </div>
      </header>

      {showNotifications && (
        <NotificationPanel 
          notifications={notifications.filter(n => !n.leida)} 
          onClose={async () => {
              setShowNotifications(false);

      // Llamar al backend para marcar turnos como leídos
          try {
            await turnosService.marcarTurnosLeidas();
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
          } catch (error) {
            console.error('❌ Error al marcar turnos como notificados:', error);
          }
         }} 

        />  
      )}


      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon"><Users size={24} /></div>
          <div className="number">{estadisticas.total || 0}</div>
          <div className="label">Total Turnos</div>
        </div>
        <div className="stat-card">
          <span className="status-dot orange"></span>
          <div className="pendiente">
            <div className="number">{estadisticas.pendientes || 0}</div>
            <div className="label">Pendientes</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="status-dot green"></span>
          <div className="number">{estadisticas.completados || 0}</div>
          <div className="label">Completados</div>
        </div>
        <div className="stat-card">
          <span className="status-dot blue"></span>
          <div className="number">{estadisticas.enCurso || 0}</div>
          <div className="label">En Curso</div>
        </div>
      </div>

      <section className="turnos-section">
        <div className="turnos-header">
          <h2><Scissors size={20}/> Turnos del Día</h2>
          <div className="panel-buttons">
              <button 
                className="buttons-panel"
                onClick={() => setShowBookingSection(true)}
              >
              turno
              </button>
              <button 
                 className="buttons-panel"
                 onClick={() => setShowMonthlyCalendar(true)}
               >
              ver más
              </button>
              <button
                className="buttons-panel"
                onClick={() => setShowBloqueoModal(true)}
                title="Bloquear agenda"
              >
                {/* <Lock size={16} /> */}
                bloquear
              </button>
          </div>
        </div>

        {turnos.length === 0 ? (
          <div className="no-turnos"><p>No hay turnos programados para hoy</p></div>
        ) : (
          <div className="turnos-list">
            {turnos.map((turno) => {
              const isExpanded = expandedTurnos.has(turno.id);
              return (
                <div 
                  key={turno.id} 
                  className={`turno-card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleTurnoExpansion(turno.id)}
                >
                  <div className="turno-header">
                    <div className="hora">
                      <Clock />
                      {formatearHora(turno.hora_inicio)}
                    </div>
                    <div className="turno-actions">
                    <span className={`turno-estado ${turno.estado}`}>{turno.estado}</span>
                    <button
                         className="cancel-button" 
                         onClick={() => toggleTurno(turno)}
                         disabled={!isTurnoRestaurable(turno) && turno.estado !== 'pendiente'}
                         >
                          {isTurnoRestaurable(turno) ? 'restablecer' : 'cancelar'}                                                  
                    </button>
                    </div>
                  </div>
                  <div className="cliente">
                    <User />
                    {obtenerNombreCliente(turno)}
                  </div>
                  <div className={`turno-expandible ${isExpanded ? 'show' : ''}`}>
                    <div className="telefono">Tel: {obtenerTelefonoCliente(turno)}</div>
                    <button 
                      className="whatsapp"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(obtenerTelefonoCliente(turno));
                      }}
                    >
                      <MessageCircle />
                      WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      
      {/* Agendar Turnos */}
      {showBookingSection && (
        <BookingSection 
        isVisible={setShowBookingSection}
        onClose={() => setShowBookingSection(false)}/>
      )}

      {/* Modal del calendario mensual */}
      {showMonthlyCalendar && (
        <MonthlyCalendar onClose={() => setShowMonthlyCalendar(false)} />
      )}

      {/* Modal de bloqueo */}
      {showBloqueoModal && (
        <BloqueoModal 
          onClose={() => setShowBloqueoModal(false)}
          onCreated={() => {
            // refrescar datos del día por si bloqueó hoy
            const fechaHoy = format(new Date(), 'yyyy-MM-dd');
            turnosService.getTurnosPorFecha(fechaHoy).then(r => setTurnos(r.turnos || []));
          }}
        />
      )}
    </div>
    );
}

export default Dashboard;
