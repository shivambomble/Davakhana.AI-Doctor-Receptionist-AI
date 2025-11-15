import React from 'react';

function AppointmentSelector({ appointments, onSelect, onClose, action = 'reschedule' }) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const actionText = action === 'cancel_appointment' ? 'cancel' : 'reschedule';
  const actionTitle = action === 'cancel_appointment' ? 'Cancel' : 'Reschedule';

  return (
    <div className="appointment-selector-overlay" onClick={onClose}>
      <div className="appointment-selector" onClick={(e) => e.stopPropagation()}>
        <div className="appointment-selector-header">
          <h3>Select Appointment to {actionTitle}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="appointments-list">
          {appointments.length === 0 ? (
            <p className="no-appointments">No upcoming appointments found</p>
          ) : (
            appointments.map((appointment) => (
              <button
                key={appointment.id}
                className="appointment-item"
                onClick={() => onSelect(appointment)}
              >
                <div className="appointment-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="appointment-details">
                  <div className="appointment-doctor">
                    <strong>{appointment.doctor?.name || 'Doctor'}</strong>
                    <span className="appointment-specialty">
                      {appointment.doctor?.specialization}
                    </span>
                  </div>
                  <div className="appointment-datetime">
                    <span className="appointment-date">
                      {formatDate(appointment.appointment_date)}
                    </span>
                    <span className="appointment-time">
                      {appointment.start_time}
                    </span>
                  </div>
                </div>
                <div className="appointment-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="appointment-selector-footer">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentSelector;
