// utils/turno.js
import { turnosService } from '../services/api';

/**
 * Verifica si hay turnos pendientes para una fecha o rango horario.
 * @param {string} fecha - Fecha a verificar en formato YYYY-MM-DD
 * @param {string} [horaInicio] - Hora de inicio (opcional, solo para bloqueos parciales)
 * @param {string} [horaFin] - Hora de fin (opcional, solo para bloqueos parciales)
 * @returns {Promise<boolean>} - true si hay turnos pendientes, false si no
 */
export const hayTurnosPendientes = async (fecha, horaInicio = null, horaFin = null) => {
  try {
    const response = await turnosService.verificarDisponibilidad(fecha, horaInicio, horaFin);

    // response es un objeto { horarios_disponibles: [], bloqueos: [] }
    const bloqueos = Array.isArray(response.bloqueos) ? response.bloqueos : [];

    // Filtramos los bloqueos que afecten todo el día o tengan rango horario
    const pendientes = bloqueos.filter(b => b.todo_dia || (b.hora_inicio && b.hora_fin));

    return pendientes.length > 0;
  } catch (err) {
    console.error('Error verificando turnos pendientes:', err);
    return false;
  }
};
