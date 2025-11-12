import React from 'react';

function SlotPicker({ slots, onSelect, onClose }) {
  return (
    <div className="slot-picker-overlay" onClick={onClose}>
      <div className="slot-picker" onClick={(e) => e.stopPropagation()}>
        <div className="slot-picker-header">
          <h3>Available Time Slots</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="slots-grid">
          {slots.length === 0 ? (
            <p className="no-slots">No available slots for this date</p>
          ) : (
            slots.map((slot, idx) => (
              <button
                key={idx}
                className="slot-button"
                onClick={() => onSelect(slot)}
              >
                {slot.time}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SlotPicker;
