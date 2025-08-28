import React, { useState, useEffect } from 'react';
// import turnosService from '../services/api'
import { turnosService, serviciosService } from '../services/api'
import '../styles/BookingSection.css';


// ========================
// Componente del Calendario
// ========================
function CalendarPicker({ selectedDate, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []

    // Días del mes anterior
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      })
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }

    // Días del mes siguiente
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }

    return days
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const isPast = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }


  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className="calendar-container-agendar">
      <div className="calendar-header-agendar">
        <button onClick={prevMonth} className="month-nav-btn-agendar">‹</button>
        <h4>{monthNames[currentMonth.getMonth()]}</h4>
        <button onClick={nextMonth} className="month-nav-btn-agendar">›</button>
      </div>

      <div className="calendar-weekdays-agendar">
        <span>Do</span><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span>
      </div>

      <div className="calendar-grid-agendar">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => day.isCurrentMonth && !isPast(day.date) && onDateSelect(day.date)}
            className={`calendar-day-agendar ${!day.isCurrentMonth ? 'other-month-agendar' : ''} ${isToday(day.date) ? 'today-agendar' : ''} ${isSelected(day.date) ? 'selected-agendar' : ''} ${isPast(day.date) ? 'past-agendar' : ''}`}
            disabled={!day.isCurrentMonth || isPast(day.date)}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

// ========================
// Componente Selector de Horarios
// ========================
function TimeSelector({ selectedDate, selectedTime, onTimeSelect }) {
  const [horariosDisponibles, setHorariosDisponibles] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedDate) {
      const cargarHorarios = async () => {
        setLoading(true)
        setError('')
        try {
          // Validar que la fecha no sea pasada
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (selectedDate < today) {
            setError('No se pueden agendar turnos para fechas pasadas')
            setHorariosDisponibles([])
            return
          }

          const fechaStr = selectedDate.toISOString().split('T')[0]
          const data = await turnosService.getHorariosDisponibles(fechaStr)
          setHorariosDisponibles(data.horarios_disponibles || [])
          setBloqueos(data.bloqueos || [])
        } catch (error) {
          console.error('Error al cargar horarios:', error)
          setError('Error al cargar horarios disponibles')
          setHorariosDisponibles([])
          setBloqueos([])
        } finally {
          setLoading(false)
        }
      }
      cargarHorarios()
    }
  }, [selectedDate])

  const agruparHorarios = (horarios) => {
    const grupos = { 'Mañana': [], 'Tarde': [], 'Noche': [] }
    horarios.forEach(horario => {
      const hora = parseInt(horario.split(':')[0])
      if (hora < 12) grupos['Mañana'].push(horario)
      else if (hora < 20) grupos['Tarde'].push(horario)
      else grupos['Noche'].push(horario)
    })
    return grupos
  }

  if (loading) return <div className="time-selector-agendar"><div className="loading-message-agendar">Cargando horarios disponibles...</div></div>
  if (error) return <div className="time-selector-agendar"><div className="error-message-agendar">{error}</div></div>

  const horariosAgrupados = agruparHorarios(horariosDisponibles)
  const hayBloqueoTodoDia = bloqueos.some(b => b.todo_dia)
  const mensajesBloqueo = (() => {
    if (bloqueos.length === 0) return []
    return bloqueos.map(b => {
      if (b.todo_dia) {
        return `Día bloqueado${b.motivo ? `: ${b.motivo}` : ''}`
      }
      const rango = `${b.hora_inicio || ''}${b.hora_inicio && b.hora_fin ? ' - ' : ''}${b.hora_fin || ''}`
      return `Bloqueo ${rango}${b.motivo ? `: ${b.motivo}` : ''}`
    })
  })()

  return (
    <div className="time-selector-agendar">
      {mensajesBloqueo.length > 0 && (
        <div className="info-message-agendar" style={{ marginBottom: 10 }}>
          {mensajesBloqueo.map((m, i) => (
            <div key={i}>{m}</div>
          ))}
        </div>
      )}

      {hayBloqueoTodoDia ? (
        <div className="error-message-agendar">No hay horarios disponibles por bloqueo de todo el día.</div>
      ) : (
        Object.entries(horariosAgrupados).map(([period, times]) => {
          if (times.length === 0) return null
          return (
            <div key={period} className="time-period-agendar">
              <h4>{period}</h4>
              <div className="time-buttons-agendar">
                {times.map((time) => (
                  <button
                    key={time}
                    onClick={() => onTimeSelect(time)}
                    className={`time-btn-agendar ${selectedTime === time ? 'selected-agendar' : ''}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ========================
// Componente Principal
// ========================
function BookingSection({ isVisible, onClose }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '', lastName: '', phone: '', date: '', time: '', service: ''
  })
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }))
  }
  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    setFormData(prev => ({ ...prev, time }))
  }
  const nextStep = () => currentStep < 3 && setCurrentStep(currentStep + 1)
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Validación adicional en el frontend
      const fechaTurno = new Date(formData.date + 'T' + formData.time)
      const ahora = new Date()
      
      // Verificar que la fecha y hora no sean pasadas
      if (fechaTurno <= ahora) {
        setError('No se pueden agendar turnos para fechas u horarios pasados')
        setLoading(false)
        return
      }
      
      // Verificar que haya al menos 30 minutos de anticipación
      const tiempoMinimo = new Date(ahora.getTime() + 30 * 60 * 1000) // 30 minutos
      if (fechaTurno <= tiempoMinimo) {
        setError('Se requiere al menos 30 minutos de anticipación para agendar un turno')
        setLoading(false)
        return
      }

      const turnoData = {
        nombre: formData.name,
        apellido: formData.lastName,
        telefono: formData.phone,
        servicio: formData.service,
        fecha: formData.date,
        hora: formData.time
      }
      console.log('Enviando datos del turno:', turnoData)
      const resultado = await turnosService.createTurno(turnoData)
      console.log('Respuesta del servidor:', resultado)
      alert(`Turno agendado exitosamente!`)
      setFormData({ name: '', lastName: '', phone: '', date: '', time: '', service: '' })
      setSelectedDate(null)
      setSelectedTime('')
      setCurrentStep(1)
      onClose()
    } catch (error) {
      console.error('Error completo al crear turno:', error)
      const errorMessage = error.message || 'Error al agendar el turno'
      setError(errorMessage)
      alert(`Error: ${errorMessage}`)
    } finally { setLoading(false) }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return selectedDate !== null
      case 2: return selectedTime !== ''
      case 3: return formData.name && formData.lastName && formData.phone
      default: return false
    }
  }

  useEffect(() => {
    if (isVisible) {
      const cargarServicios = async () => {
        try {
          console.log('Cargando servicios...')
          const serviciosData = await serviciosService.getServicios()
          console.log('Servicios cargados:', serviciosData)
          setServicios(serviciosData)
        } catch (error) {
          console.error('Error al cargar servicios:', error)
          // Servicios de respaldo en caso de error
          setServicios([
            { id: 1, nombre: 'Corte de cabello', duracion_min: 30, precio: 2500 },
            { id: 2, nombre: 'Arreglo de barba', duracion_min: 20, precio: 1500 },
            { id: 3, nombre: 'Corte + Barba', duracion_min: 45, precio: 3500 },
            { id: 4, nombre: 'Tinte', duracion_min: 60, precio: 5000 },
            { id: 5, nombre: 'Peinado', duracion_min: 30, precio: 2000 }
          ])
        }
      }
      cargarServicios()
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="booking-overlay-agendar">
      <div className="booking-modal-agendar">
        {/* Header */}
        <div className="booking-header-agendar">
          <h2>Agendar Turno</h2>
          <button onClick={onClose} className="close-btn-agendar" aria-label="Cerrar">×</button>
        </div>

        {/* Step Content */}
        <div className="step-content-agendar">
          {currentStep === 1 && <CalendarPicker selectedDate={selectedDate} onDateSelect={handleDateSelect} />}
          {currentStep === 2 && <TimeSelector selectedDate={selectedDate} selectedTime={selectedTime} onTimeSelect={handleTimeSelect} />}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="booking-form-agendar">
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nombre" required />
              <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Apellido" required />
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Teléfono" required />
              <select name="service" value={formData.service} onChange={handleInputChange} required>
                <option value="">Seleccione un servicio</option>
                {servicios.map(s => <option key={s.id} value={s.nombre}>{s.nombre} - ${(s.precio / 100).toFixed(2)}</option>)}
              </select>
              {error && <div className="form-error-agendar">{error}</div>}
            </form>
          )}
        </div>

        {/* Navigation */}
        <div className="step-navigation-agendar">
          {currentStep > 1 && <button onClick={prevStep}>Regresar</button>}
          {currentStep < 3 ? 
            <button onClick={nextStep} disabled={!isStepValid()}>Siguiente</button> : 
            <button onClick={handleSubmit} disabled={!isStepValid() || loading}>{loading ? 'Agendando...' : 'Agendar'}</button>
          }
        </div>
      </div>
    </div>
  )
}

export default BookingSection
