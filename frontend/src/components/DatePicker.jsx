import React, { useState } from 'react';

function DatePicker({ onSelect, onClose, minDate, maxDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const min = minDate ? new Date(minDate) : today;
  const max = maxDate ? new Date(maxDate) : new Date(today.getFullYear(), today.getMonth() + 3, 0);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day) => {
    // Create date at noon UTC to avoid timezone issues
    const selectedDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    const formattedDate = selectedDate.toISOString().split('T')[0];
    onSelect(formattedDate);
  };

  const isDateDisabled = (day) => {
    const date = new Date(year, month, day);
    return date < min || date > max;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="date-picker" onClick={(e) => e.stopPropagation()}>
        <div className="date-picker-header">
          <button onClick={handlePrevMonth} className="nav-btn">‹</button>
          <h3>{monthNames[month]} {year}</h3>
          <button onClick={handleNextMonth} className="nav-btn">›</button>
        </div>

        <div className="date-picker-days">
          {dayNames.map(day => (
            <div key={day} className="day-name">{day}</div>
          ))}
          
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="day-cell empty"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const disabled = isDateDisabled(day);
            const isToday = 
              day === today.getDate() && 
              month === today.getMonth() && 
              year === today.getFullYear();

            return (
              <button
                key={day}
                className={`day-cell ${disabled ? 'disabled' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => !disabled && handleDateClick(day)}
                disabled={disabled}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="date-picker-footer">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default DatePicker;
