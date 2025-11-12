import React from 'react';

function VoiceButton({ isListening, isSpeaking, onStartListening, onStopListening, onStopSpeaking, disabled }) {
  const handleClick = () => {
    if (isSpeaking) {
      onStopSpeaking();
    } else if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  return (
    <button
      className={`voice-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title={
        isSpeaking
          ? 'Stop speaking'
          : isListening
          ? 'Stop listening'
          : 'Start voice input'
      }
    >
      {isSpeaking ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 9h6v6H9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : isListening ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="8">
            <animate attributeName="r" from="8" to="10" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0.5" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="19" x2="12" y2="23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="23" x2="16" y2="23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

export default VoiceButton;
