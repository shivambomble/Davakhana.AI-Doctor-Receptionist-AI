import React from 'react';

function ChatMessage({ message }) {
  const { role, content, actionResult, timestamp, error } = message;

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`message ${role} ${error ? 'error' : ''}`}>
      <div className="message-content">
        <div className="message-text">{content}</div>
        
        {actionResult?.success && actionResult.appointment && (
          <div className="appointment-confirmation">
            <strong>✓ Appointment Confirmed</strong>
            <p>Doctor: {actionResult.appointment.doctor}</p>
            <p>Date: {actionResult.appointment.date}</p>
            <p>Time: {actionResult.appointment.time}</p>
            <p className="confirmation-note">
              A confirmation email has been sent to {actionResult.appointment.patientEmail}
            </p>
          </div>
        )}

        {actionResult?.success === false && actionResult.errors && (
          <div className="error-message">
            <strong>⚠ Error</strong>
            <ul>
              {actionResult.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="message-time">{formatTime(timestamp)}</div>
    </div>
  );
}

export default ChatMessage;
