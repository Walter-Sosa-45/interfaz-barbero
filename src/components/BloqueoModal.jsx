import React, { useMemo, useState, useEffect } from 'react';
import { X, Lock, Calendar, Clock, MessageSquare, Unlock } from 'lucide-react';
import { bloqueosService } from '../services/api';
import { validateText } from '../utils/validations';
import { isFormValid } from '../utils/formValidations';
import { hayTurnosPendientes } from '../utils/turno';
import '../styles/BloqueoModal.css';

const generarHorarios = () => {
  const horarios = [];
  let hora = 9;
  let minuto = 0;
  while (hora < 22 || (hora === 22 && minuto === 0)) {
    const hh = String(hora).padStart(2, '0');
    const mm = String(minuto).padStart(2, '0');
    horarios.push(`${hh}:${mm}`);
    minuto += 30;
    if (minuto >= 60) {
      minuto = 0;
      hora += 1;
    }
  }
  return horarios;
};


const getToday = () => new Date().toISOString().slice(0, 10);
const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

const BloqueoModal = ({ show, onClose, onCreated }) => {
  const horarios = useMemo(() => generarHorarios(), []);
  
  const today = getToday();
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    todo_dia: true,
    hora_inicio: '09:00',
    hora_fin: '12:00',
    motivo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bloqueosExistentes, setBloqueosExistentes] = useState([]);
  const [verificandoBloqueos, setVerificandoBloqueos] = useState(false);

  
  const horariosDisponibles = useMemo(() => {
    if (form.fecha === today){
      return horarios.filter(h => h >= currentTime); // Solo horarios futuros
    }
    return horarios;
  }, [form.fecha, today, currentTime, horarios]);

  const [formErrors, setFormErrors] = useState({ motivo: "" });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    if (name === "motivo") {
      const errorMsg = validateText(value, 100);
      setFormErrors((prev) => ({ ...prev, motivo: errorMsg }));
    }

    if (error) setError('');
    
    // Si cambió la fecha, verificar bloqueos existentes
    if (name === 'fecha') {
      verificarBloqueosExistentes(value);
    }
  };

  const verificarBloqueosExistentes = async (fecha) => {
    try {
      setVerificandoBloqueos(true);
      const response = await bloqueosService.verificarBloqueosFecha(fecha);
      setBloqueosExistentes(response.bloqueos || []);
    } catch (err) {
      console.error('Error al verificar bloqueos:', err);
      setBloqueosExistentes([]);
    } finally {
      setVerificandoBloqueos(false);
    }
  };

  const handleDesbloquear = async (bloqueoId) => {
    try {
      setLoading(true);
      await bloqueosService.eliminarBloqueo(bloqueoId);
      // Recargar bloqueos existentes
      await verificarBloqueosExistentes(form.fecha);
      if (onCreated) onCreated();
    } catch (err) {
      setError('Error al eliminar el bloqueo');
    } finally {
      setLoading(false);
    }
  };

  // Intervalo de la hora actual (se monta un vez)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);

    return () => clearInterval(timer); //Limpieza
  },[]);

  useEffect(() => {
  const verificarTurnos = async () => {
    if (!form.fecha) return;

    try {
      const tienePendientes = await hayTurnosPendientes(
        form.fecha,
        form.todo_dia ? null : form.hora_inicio,
        form.todo_dia ? null : form.hora_fin
      );

      if (tienePendientes) {
        setError('⚠️ Hay turnos pendientes en la fecha o rango horario seleccionado. Deben cancelarse antes de bloquear.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error verificando turnos pendientes:', err);
    }
  };

  verificarTurnos();
  }, [form.fecha, form.hora_inicio, form.hora_fin, form.todo_dia]);

  // Logica de validacion al cambiar la fecha
  useEffect(() => {
    // Cada vez que cambia la fecha se aplica la logica
    if (form.fecha){
      if (form.fecha < today) {
        // fecha pasada -> Bloqueo
        setError ("No se pueden crear bloqueos en fechas pasadas");
      }else if (form.fecha === today) {
        // Solo Bloqueos parciales, imposible todo el dia
        setForm((prev) => ({
          ...prev,
          todo_dia: false,
        }));
      } else {
        // futuro -> perimitar ambos
        // No se forza nada, el barbero puede elegir  
        setError(""); // liempiar el error si lo había
      }
    }

    verificarBloqueosExistentes(form.fecha);
  }, [form.fecha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Verificar si ya hay bloqueos para esta fecha
      if (bloqueosExistentes.length > 0) {
        // Verificar si hay un bloqueo de todo el día
        const bloqueoTodoDia = bloqueosExistentes.find(b => b.todo_dia);
        if (bloqueoTodoDia) {
          setError('Esta fecha ya está completamente bloqueada. No se pueden crear bloqueos adicionales.');
          setLoading(false);
          return;
        }
        
        // Si hay bloqueos parciales, verificar que no se superpongan
        if (!form.todo_dia) {
          const horaInicio = form.hora_inicio;
          const horaFin = form.hora_fin;
          
          for (const bloqueo of bloqueosExistentes) {
            if (!bloqueo.todo_dia && bloqueo.hora_inicio && bloqueo.hora_fin) {
              // Verificar superposición de horarios
              if (
                (horaInicio < bloqueo.hora_fin && horaFin > bloqueo.hora_inicio) ||
                (bloqueo.hora_inicio < horaFin && bloqueo.hora_fin > horaInicio)
              ) {
                setError('El horario seleccionado se superpone con un bloqueo existente.');
                setLoading(false);
                return;
              }
            }
          }
        }
      }

      if (!form.todo_dia) {
        if (!form.hora_inicio || !form.hora_fin) {
          setError('Seleccione un rango horario');
          setLoading(false);
          return;
        }
        if (form.hora_fin <= form.hora_inicio) {
          setError('La hora fin debe ser posterior a la hora inicio');
          setLoading(false);
          return;
        }
      }

      const payload = {
        fecha: form.fecha,
        todo_dia: form.todo_dia,
        hora_inicio: form.todo_dia ? null : form.hora_inicio,
        hora_fin: form.todo_dia ? null : form.hora_fin,
        motivo: form.motivo || undefined,
      };

      await bloqueosService.crearBloqueo(payload);
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al crear bloqueo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bloqueo-modal-overlay">
      <div className="bloqueo-modal-container">
        <div className="bloqueo-modal-header">
          <div className="title">
            <Lock size={22} />
            <h2>Bloquear agenda</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <form className="bloqueo-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group-bloqueo">
              <label>
                <Calendar size={16} />
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group-bloqueo checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="todo_dia"
                  checked={form.todo_dia}
                  onChange={handleChange}
                  disabled={form.fecha === today} // Hoy no se puede bloquear todo el día
                />
                <Lock size={16} />
                Bloquear todo el día
              </label>
            </div>
          </div>

          {/* Mostrar bloqueos existentes */}
          {verificandoBloqueos && (
            <div className="info-message">
              Verificando bloqueos existentes...
            </div>
          )}
          
          {bloqueosExistentes.length > 0 && (
            <div className="bloqueos-existentes">
              <div className="bloqueos-header">
                <Lock size={16} />
                <span>Esta fecha ya tiene bloqueos:</span>
              </div>
              {bloqueosExistentes.map((bloqueo) => (
                <div key={bloqueo.id} className={`bloqueo-item ${bloqueo.todo_dia ? 'todo-dia' : 'parcial'}`}>
                  <div className="bloqueo-info">
                    {bloqueo.todo_dia ? (
                      <span className="bloqueo-todo-dia">
                        🚫 <strong>Todo el día bloqueado</strong>
                      </span>
                    ) : (
                      <span className="bloqueo-horario">
                        🔒 <strong>{bloqueo.hora_inicio} - {bloqueo.hora_fin}</strong>
                      </span>
                    )}
                    {bloqueo.motivo && (
                      <span className="bloqueo-motivo">Motivo: {bloqueo.motivo}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="desbloquear-button"
                    onClick={() => handleDesbloquear(bloqueo.id)}
                    disabled={loading}
                  >
                    <Unlock size={14} />
                    Desbloquear
                  </button>
                </div>
              ))}
              {bloqueosExistentes.find(b => b.todo_dia) && (
                <div className="info-message warning">
                  ⚠️ No se pueden crear bloqueos adicionales cuando ya existe un bloqueo de todo el día.
                </div>
              )}
            </div>
          )}

          {!form.todo_dia && (
            <div className="form-row">
              <div className="form-group-bloqueo">
                <label>
                  <Clock size={16} />
                  Desde
                </label>
                <select name="hora_inicio" value={form.hora_inicio} onChange={handleChange}>
                  {horariosDisponibles.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="form-group-bloqueo">
                <label>
                  <Clock size={16} />
                  Hasta
                </label>
                <select name="hora_fin" value={form.hora_fin} onChange={handleChange}>
                  {horariosDisponibles.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-group-bloqueo">
            <label>
              <MessageSquare size={16} />
              Motivo (opcional)
            </label>
            <input
              type="text"
              name="motivo"
              placeholder="Ej. médico, mantenimiento, personal, etc."
              value={form.motivo}
              onChange={handleChange}
            />
            {formErrors.motivo && (
              <div className='error-messaje'>{ formErrors.motivo}</div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button 
            type="submit" 
            className="primary-button" 
            disabled= {
              !isFormValid(
                form, formErrors, 
                ["fecha", 
                  ...(form.todo_dia ? [] : ["hora_inicio", "hora_fin"]),
                ])
              }
            >
              {loading ? 'Guardando…' : 'Guardar bloqueo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BloqueoModal;
