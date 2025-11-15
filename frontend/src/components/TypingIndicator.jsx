import React from 'react';

function TypingIndicator() {
  return (
    <div className="typing-indicator-container">
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">AI is thinking...</span>
    </div>
  );
}

export default TypingIndicator;
