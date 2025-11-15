import React, { useState, useRef, useEffect } from 'react';

function EnhancedPromptBox({ 
  value, 
  onChange, 
  onSend, 
  onVoiceStart, 
  onVoiceStop,
  isListening, 
  isSpeaking,
  isLoading,
  disabled 
}) {
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(null);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  // Recording timer
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (selectedFiles) => {
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;

    const newFiles = [...files, ...imageFiles].slice(0, 4); // Max 4 images
    setFiles(newFiles);

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({
          ...prev,
          [file.name]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index) => {
    const fileToRemove = files[index];
    setFiles(files.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[fileToRemove.name];
      return newPreviews;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processFiles([file]);
          break;
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((value.trim() || files.length > 0) && !isLoading && !isListening) {
      onSend(value, files);
      setFiles([]);
      setFilePreviews({});
    }
  };

  const hasContent = value.trim() !== '' || files.length > 0;

  return (
    <div 
      className={`enhanced-prompt-box ${isDragging ? 'dragging' : ''} ${isListening ? 'recording' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File Previews */}
      {files.length > 0 && (
        <div className="file-previews">
          {files.map((file, index) => (
            <div key={index} className="file-preview-item">
              <img 
                src={filePreviews[file.name]} 
                alt={file.name}
                onClick={() => setShowImagePreview(filePreviews[file.name])}
              />
              <button 
                className="remove-file-btn"
                onClick={() => handleRemoveFile(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording Visualizer */}
      {isListening && (
        <div className="recording-visualizer">
          <div className="recording-indicator">
            <div className="recording-dot"></div>
            <span className="recording-time">{formatTime(recordingTime)}</span>
          </div>
          <div className="audio-bars">
            {[...Array(24)].map((_, i) => (
              <div 
                key={i} 
                className="audio-bar"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Textarea */}
      {!isListening && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isDragging ? "Drop images here..." : "Type your message or use voice..."}
          disabled={disabled || isLoading}
          rows={1}
        />
      )}

      {/* Actions */}
      <div className="prompt-actions">
        <div className="left-actions">
          {/* File Upload */}
          <button
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isListening || isLoading}
            title="Upload image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="right-actions">
          {/* Send/Voice Button */}
          <button
            className={`send-btn ${hasContent ? 'has-content' : ''} ${isListening ? 'recording' : ''} ${isSpeaking ? 'speaking' : ''}`}
            onClick={() => {
              if (isListening) {
                onVoiceStop();
              } else if (hasContent) {
                handleSend();
              } else {
                onVoiceStart();
              }
            }}
            disabled={isLoading && !hasContent}
            title={isListening ? 'Stop recording' : hasContent ? 'Send message' : 'Voice message'}
          >
            {isLoading ? (
              <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                <rect x="11" y="1" width="2" height="6" fill="currentColor" opacity="0.3"/>
                <rect x="11" y="17" width="2" height="6" fill="currentColor" opacity="0.3"/>
                <rect x="1" y="11" width="6" height="2" fill="currentColor" opacity="0.3"/>
                <rect x="17" y="11" width="6" height="2" fill="currentColor" opacity="0.3"/>
              </svg>
            ) : isListening ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8"/>
              </svg>
            ) : hasContent ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="image-preview-modal" onClick={() => setShowImagePreview(null)}>
          <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
            <img src={showImagePreview} alt="Preview" />
            <button className="close-preview" onClick={() => setShowImagePreview(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedPromptBox;
