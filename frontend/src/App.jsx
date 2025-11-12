import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import SlotPicker from './components/SlotPicker';
import VoiceButton from './components/VoiceButton';
import { chatAPI } from './api';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sessionData, setSessionData] = useState({});
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [slotPickerData, setSlotPickerData] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  
  const {
    isSupported: isVoiceSupported,
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceAssistant();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greeting = "Hello! I'm your virtual receptionist. How can I help you today? I can assist with:\n\n• Booking appointments\n• Checking doctor availability\n• Answering questions about our clinic\n• Rescheduling or canceling appointments";
    
    setMessages([
      {
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      },
    ]);
    
    // Speak greeting if voice is enabled
    if (isVoiceSupported && voiceEnabled) {
      setTimeout(() => {
        speak(greeting.replace(/•/g, '').replace(/\n/g, ' '));
      }, 500);
    }
  }, []);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !loading) {
      setInput(transcript);
      // Auto-send after a short delay, only if not already loading
      const timer = setTimeout(() => {
        if (!loading) {
          handleSend(transcript);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [transcript]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Stop any ongoing speech
    stopSpeaking();

    try {
      console.log('Sending message:', textToSend);
      const response = await chatAPI.sendMessage(textToSend, conversationHistory, sessionData);
      console.log('Received response:', response);

      // Update conversation history
      setConversationHistory(response.conversationHistory || []);

      // Handle slot picker display
      if (response.action === 'check_availability' && response.actionResult?.slots) {
        setSlotPickerData({
          slots: response.actionResult.slots,
          doctorId: response.data?.doctor_id,
          date: response.data?.date,
        });
        setShowSlotPicker(true);
      }

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        action: response.action,
        data: response.data,
        actionResult: response.actionResult,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response if voice is enabled
      if (isVoiceSupported && voiceEnabled && response.message) {
        speak(response.message);
      }

      // Update session data if needed
      if (response.data) {
        setSessionData(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Chat error:', error);
      console.error('Error details:', error.message, error.stack);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again or call us directly.',
          timestamp: new Date(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setShowSlotPicker(false);
    setInput(`I'd like to book the ${slot.time} slot`);
    // Auto-send the slot selection
    setTimeout(() => {
      const event = { target: { value: `I'd like to book the ${slot.time} slot` } };
      setInput(event.target.value);
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏥 Davakhana.AI</h1>
        <p>Virtual Assistant</p>
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showSlotPicker && slotPickerData && (
          <SlotPicker
            slots={slotPickerData.slots}
            onSelect={handleSlotSelect}
            onClose={() => setShowSlotPicker(false)}
          />
        )}

        <div className="input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
            rows="2"
            disabled={loading || isListening}
          />
          
          {isVoiceSupported && (
            <VoiceButton
              isListening={isListening}
              isSpeaking={isSpeaking}
              onStartListening={startListening}
              onStopListening={stopListening}
              onStopSpeaking={stopSpeaking}
              disabled={loading}
            />
          )}
          
          <button onClick={() => handleSend()} disabled={loading || !input.trim() || isListening}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
