import React from 'react';
import '../styles/Notification.css'; // CSS separado si querés

const NotificationPanel = ({ notifications, onClose }) => {
  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h4>Notificaciones</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      {notifications.length === 0 ? (
        <p className="no-notifications">No hay notificaciones</p>
      ) : (
        notifications.map(n => (
          <div key={n.id} className="notification-card">
            <strong>{n.titulo}</strong>
            <p>De: {n.cliente}</p>
            <p>Fecha: {n.fecha}</p>
            <p>Hora: {n.hora}</p>
            <p>Servicio: {n.servicio}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationPanel;
