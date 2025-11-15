import React from 'react';

function QuickActions({ onActionClick, disabled }) {
  const actions = [
    { 
      id: 'book', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      label: 'Book Appointment', 
      message: 'I want to book an appointment' 
    },
    { 
      id: 'reschedule', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
      label: 'Reschedule', 
      message: 'I need to reschedule my appointment' 
    },
    { 
      id: 'cancel', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
      label: 'Cancel', 
      message: 'I want to cancel my appointment' 
    },
    { 
      id: 'doctors', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      label: 'View Doctors', 
      message: 'Show me available doctors' 
    },
    { 
      id: 'hours', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      label: 'Clinic Hours', 
      message: 'What are your clinic hours?' 
    },
    { 
      id: 'location', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
      label: 'Location', 
      message: 'Where is your clinic located?' 
    },
  ];

  return (
    <div className="quick-actions">
      <p className="quick-actions-title">Quick Actions</p>
      <div className="quick-actions-grid">
        {actions.map(action => (
          <button
            key={action.id}
            className="quick-action-btn"
            onClick={() => onActionClick(action.message)}
            disabled={disabled}
          >
            <div className="quick-action-icon">{action.icon}</div>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
