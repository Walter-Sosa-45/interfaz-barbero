import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, X, Unlock } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { turnosService, bloqueosService } from '../services/api';
import '../styles/MonthlyCalendar.css';

const MonthlyCalendar = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [turnos, setTurnos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateTurnos, setSelectedDateTurnos] = useState([]);
  const [selectedDateBloqueos, setSelectedDateBloqueos] = useState([]);

  // Estados de disponibilidad
  const DISPONIBILIDAD = {
    SIN_TURNOS: 'sin-turnos',
    CON_TURNOS_DISPONIBLE: 'con-turnos-disponible',
    COMPLETO: 'completo',
    BLOQUEO_PARCIAL: 'bloqueo-parcial',
    TODO_DIA_BLOQUEADO: 'todo-dia-bloqueado'
  };

  useEffect(() => {
    cargarTurnosDelMes();
    cargarBloqueosDelMes();
  }, [currentDate]);

  const cargarTurnosDelMes = async () => {
    try {
      setLoading(true);
      const fechaInicio = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const fechaFin = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      const response = await turnosService.getTurnos({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      
      setTurnos(response.turnos || []);
    } catch (error) {
      console.error('Error al cargar turnos del mes:', error);
    } finally {

      setTimeout(() =>setLoading(false), 1000);
    }
 };

  const cargarBloqueosDelMes = async () => {
    try {
      const fechaInicio = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const fechaFin = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const response = await bloqueosService.listarBloqueos({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      setBloqueos(response);
    } catch (error) {
      console.error('Error al cargar bloqueos del mes:', error);
    }
  };

  const obtenerDisponibilidadFecha = (fecha) => {
    const bloqueosDia = bloqueos.filter(b => isSameDay(parseISO(b.fecha), fecha));
    
    // Bloqueo total
    const bloqueoTodoDia = bloqueosDia.find(b => b.todo_dia);
    if (bloqueoTodoDia) {
      return { tipo: DISPONIBILIDAD.TODO_DIA_BLOQUEADO, todoDiaBloqueado: true, tieneBloqueoParcial: false };
    }
  
    // Bloqueos parciales
    const tieneBloqueoParcial = bloqueosDia.some(b => !b.todo_dia);
  
    // Turnos del día
    const turnosFecha = turnos.filter(turno => isSameDay(parseISO(turno.fecha), fecha));
    const totalHorarios = 26; // 13 horas * 2 slots por hora
  
    // Contar slots bloqueados por bloqueos parciales
    let slotsBloqueados = 0;
    for (const b of bloqueosDia) {
      if (!b.todo_dia && b.hora_inicio && b.hora_fin) {
        const [hiH, hiM] = b.hora_inicio.split(':').map(Number);
        const [hfH, hfM] = b.hora_fin.split(':').map(Number);
        const minutos = (hfH * 60 + hfM) - (hiH * 60 + hiM);
        slotsBloqueados += Math.max(0, Math.floor(minutos / 30));
      }
    }
  
    const totalDisponibles = Math.max(0, totalHorarios - slotsBloqueados);
  
    // Determinar tipo principal
    let tipo;
    if (turnosFecha.length >= totalDisponibles) {
      tipo = DISPONIBILIDAD.COMPLETO;
    } else if (turnosFecha.length === 0) {
      tipo = DISPONIBILIDAD.SIN_TURNOS;
    } else {
      tipo = DISPONIBILIDAD.CON_TURNOS_DISPONIBLE;
    }
  
    return { tipo, todoDiaBloqueado: false, tieneBloqueoParcial };
  };
  

  const isTurnoRestaurable = (turno) => {
    const turnoFecha = parseISO(`${turno.fecha}T${turno.hora_inicio}`);
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
      await cargarTurnosDelMes();
      if (selectedDate) {
        const fechaStr = format(selectedDate, 'yyyy-MM-dd');
        const { turnos } = await turnosService.getTurnosPorFecha(fechaStr);
        setSelectedDateTurnos(turnos || []);
      }

    } catch (error) {
      console.log("Error al restaurar turno:", error);
      alert("No se pudo restaurar el turno. Por favor, intenta nuevamente.");
    }
  }

  // const handleDateClick = async (fecha) => {
  //   setSelectedDate(fecha);
  //   try {
  //     const fechaStr = format(fecha, 'yyyy-MM-dd');
  //     const response = await turnosService.getTurnosPorFecha(fechaStr);
  //     setSelectedDateTurnos(response.turnos || []);
  //     const bloqueosResp = await bloqueosService.listarBloqueos({ fecha_inicio: fechaStr, fecha_fin: fechaStr });
  //     setSelectedDateBloqueos(bloqueosResp || []);
  //   } catch (error) {
  //     console.error('Error al cargar turnos de la fecha:', error);
  //     setSelectedDateTurnos([]);
  //     setSelectedDateBloqueos([]);
  //   }
  // };

  const handleDateClick = (fecha) => {
    setSelectedDate(fecha);
  
    // Filtrar turnos y bloqueos del mes ya cargados
    const turnosDelDia = turnos.filter(turno => isSameDay(parseISO(turno.fecha), fecha));
    const bloqueosDelDia = bloqueos.filter(b => isSameDay(parseISO(b.fecha), fecha));
  
    setSelectedDateTurnos(turnosDelDia);
    setSelectedDateBloqueos(bloqueosDelDia);
  };
  

  const cambiarMes = (direccion) => {
    setCurrentDate(prev => 
      direccion === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const generarDiasCalendario = () => {
    const inicioMes = startOfMonth(currentDate);
    const finMes = endOfMonth(currentDate);
    const inicioSemana = startOfWeek(inicioMes, { weekStartsOn: 1 }); // Lunes
    const finSemana = endOfWeek(finMes, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: inicioSemana, end: finSemana });
  };

  const formatearHora = (hora) => {
    if (!hora) return '';
    return hora.slice(0, 5);
  };

  const obtenerNombreCliente = (turno) => {
    return turno.cliente?.nombre || 'Cliente';
  };

  const obtenerTelefonoCliente = (turno) => {
    return turno.cliente?.telefono || 'Sin teléfono';
  };

  const eliminarBloqueo = async (bloqueoId) => {
    try {
      await bloqueosService.eliminarBloqueo(bloqueoId);
      // refrescar bloqueos del mes y del día seleccionado
      await cargarBloqueosDelMes();
      if (selectedDate) {
        const fechaStr = format(selectedDate, 'yyyy-MM-dd');
        const bloqueosResp = await bloqueosService.listarBloqueos({ fecha_inicio: fechaStr, fecha_fin: fechaStr });
        setSelectedDateBloqueos(bloqueosResp || []);
      }
    } catch (e) {
      console.error('Error al eliminar bloqueo:', e);
    }
  };

  const handleWhatsApp = (telefono) => {
    const mensaje = encodeURIComponent('Hola! Te confirmo tu turno en la barbería.');
    window.open(`https://wa.me/${telefono.replace(/\s/g, '')}?text=${mensaje}`, '_blank');
  };

  const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  return (
    <div className="monthly-calendar-overlay">
      <div className="monthly-calendar-container">
        {/* Header */}
        <div className="calendar-header">
          <div className="calendar-title">
            <Calendar size={24} />
            <h2>Vista de Turnos por mes</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Navegación del mes */}
        <div className="month-navigation">
          <button 
            className="nav-button" 
            onClick={() => cambiarMes('prev')}
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="current-month">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>
          <button 
            className="nav-button" 
            onClick={() => cambiarMes('next')}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Leyenda */}
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color sin-turnos-calendar"></div>
            <span>Sin turnos</span>
          </div>
          <div className="legend-item">
            <div className="legend-color con-turnos-disponible-calendar"></div>
            <span>Con turnos (disponible)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color completo-calendar"></div>
            <span>Completo/Bloqueado</span>
          </div>
          <div className="legend-item">
            <div className="legend-color todo-dia-bloqueado-calendar"></div>
            <span>Todo el día bloqueado</span>
          </div>
        </div>

        {/* Calendario */}
        <div className="calendar-grid">
          {/* Días de la semana */}
          <div className="calendar-weekdays">
            {diasSemana.map(dia => (
              <div key={dia} className="weekday">{dia}</div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="calendar-days">
            {loading ? (
              <div className="loading-calendar">Cargando...</div>
            ) : (
              generarDiasCalendario().map((fecha, index) => {
                const esMesActual = isSameMonth(fecha, currentDate);
                const disponibilidad = obtenerDisponibilidadFecha(fecha);
                const esHoy = isSameDay(fecha, new Date());
                
                return (
                  <button
                    key={index}
                    className={`calendar-day ${disponibilidad.tipo} ${
                      !esMesActual ? 'other-month' : ''
                    } ${esHoy ? 'today' : ''} ${
                      disponibilidad.todoDiaBloqueado ? 'todo-dia-bloqueado' : ''
                    } ${disponibilidad.tieneBloqueoParcial && !disponibilidad.todoDiaBloqueado ? 'bloqueo-parcial' : ''}`}
                                       
                    onClick={() => handleDateClick(fecha)}
                    disabled={!esMesActual}
                  >
                    {format(fecha, 'd')}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Modal de detalles del día seleccionado: turnos y bloqueos */}
        {selectedDate && (
          <div className="day-details-modal">
            <div className="day-details-content">
              <div className="day-details-header">
                <h3>Detalle del {format(selectedDate, 'EEEE dd \'de\' MMMM', { locale: es })}</h3>
                <button 
                  className="close-details" 
                  onClick={() => setSelectedDate(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Bloqueos del día */}
              <div className="bloqueos-day">
                <h4>Bloqueos</h4>
                {selectedDateBloqueos.length === 0 ? (
                  <p>No hay bloqueos para este día</p>
                ) : (
                  <div className="bloqueos-list-day">
                    {selectedDateBloqueos.map((b) => (
                      <div key={b.id} className="bloqueo-item-day">
                        <div className="bloqueo-time">
                          {b.todo_dia ? 'Todo el día' : `${formatearHora(b.hora_inicio)} - ${formatearHora(b.hora_fin)}`}
                        </div>
                        {b.motivo && <div className="bloqueo-motivo">{b.motivo}</div>}
                        <button className="unblock-button" onClick={() => eliminarBloqueo(b.id)}>
                          <Unlock size={14} /> Desbloquear
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Turnos del día */}
              <h4 style={{ marginTop: 12 }}>Turnos</h4>
              {selectedDateTurnos.length === 0 ? (
                <div className="no-turnos-day">
                  <p>No hay turnos programados para este día</p>
                </div>
              ) : (
                <div className="turnos-list-day">
                  {selectedDateTurnos.map((turno) => (
                    <div key={turno.id} className="turno-item-day">
                      <div className="turno-time">
                        <Clock size={16} />
                        {formatearHora(turno.hora_inicio)}
                      </div>
                      <div className="turno-client">
                        <User size={16} />
                        {obtenerNombreCliente(turno)}
                      </div>
                      <div className="turno-service">
                        {turno.servicio?.nombre}
                      </div>
                      <div className="turno-actions-calendar">
                        <span className={`turno-status ${turno.estado}`}>
                          {turno.estado}
                        </span>
                        <button
                         className="cancel-button" 
                         onClick={() => toggleTurno(turno)}
                         disabled={parseISO(`${turno.fecha}T${turno.hora_inicio}`) < new Date() && turno.estado !== 'cancelado'}
                         >
                          {isTurnoRestaurable(turno) ? 'restablecer' : 'cancelar'}                                                  
                         </button>
                        <button 
                          className="whatsapp-small"
                          onClick={() => handleWhatsApp(obtenerTelefonoCliente(turno))}
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyCalendar;
