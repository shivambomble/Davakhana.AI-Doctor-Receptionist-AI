import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import SlotPicker from './components/SlotPicker';
import DatePicker from './components/DatePicker';
import AppointmentSelector from './components/AppointmentSelector';
import EnhancedPromptBox from './components/EnhancedPromptBox';
import TypingIndicator from './components/TypingIndicator';
import ConnectionStatus from './components/ConnectionStatus';
import QuickActions from './components/QuickActions';
import WelcomeScreen from './components/WelcomeScreen';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAppointmentSelector, setShowAppointmentSelector] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentAction, setAppointmentAction] = useState('reschedule');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
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

  // Initial greeting (only after welcome screen)
  const initializeChat = () => {
    const greeting = "Hello! I'm your virtual receptionist. How can I help you today?";
    
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
        speak(greeting);
      }, 500);
    }
  };

  const handleGetStarted = () => {
    setShowWelcome(false);
    initializeChat();
  };

  const handleQuickAction = (message) => {
    setShowQuickActions(false);
    handleSend(message);
  };

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

      // Handle slot picker display - show after AI finishes speaking
      if (response.action === 'check_availability' && response.actionResult?.slots) {
        setSlotPickerData({
          slots: response.actionResult.slots,
          doctorId: response.data?.doctor_id,
          date: response.data?.date,
        });
        // Delay showing slot picker until after message is displayed
        setTimeout(() => setShowSlotPicker(true), 800);
      }

      // Show appointment selector for reschedule/cancel if patient email is provided
      console.log('Checking appointment selector trigger:', {
        action: response.action,
        hasEmail: !!response.data?.patient_email,
        hasSelectedAppointment: !!sessionData.selectedAppointmentId
      });
      
      if ((response.action === 'reschedule_appointment' || response.action === 'cancel_appointment') && 
          response.data?.patient_email && !sessionData.selectedAppointmentId) {
        console.log('Triggering appointment selector for:', response.data.patient_email);
        fetchAndShowAppointments(response.data.patient_email, response.action);
      }

      // Show date picker if AI is asking for a date
      if (response.action === 'collect_patient_info' && 
          response.data?.missing_fields?.includes('date')) {
        setTimeout(() => setShowDatePicker(true), 500);
      }
      
      // Also show date picker if message mentions date format or asks for date
      // BUT only if we're in reschedule mode and have selected an appointment
      if (response.message && 
          (response.message.includes('YYYY-MM-DD') || 
           response.message.includes('date you prefer') ||
           response.message.includes('which date') ||
           response.message.includes('what date') ||
           response.message.includes('select a new date') ||
           response.message.includes('please select a new date'))) {
        console.log('Date picker trigger detected');
        setTimeout(() => setShowDatePicker(true), 500);
      }
      
      // For reschedule: after date is selected, show time slots
      // Check if missing_fields includes 'new_time' or 'time'
      if ((response.action === 'clarification_needed' || response.action === 'collect_patient_info') &&
          response.data?.missing_fields?.some(field => field === 'new_time' || field === 'time')) {
        console.log('Time selection needed, fetching slots');
        
        // Get the date from response data
        const selectedDate = response.data?.new_date || response.data?.date;
        const doctorId = response.data?.doctor_id || sessionData.selectedAppointmentDoctorId;
        
        console.log('Fetching slots for:', { doctorId, selectedDate });
        
        if (selectedDate && doctorId) {
          setTimeout(async () => {
            try {
              const slotsResponse = await chatAPI.getSlots(doctorId, selectedDate);
              console.log('Slots fetched:', slotsResponse);
              
              if (slotsResponse.slots && slotsResponse.slots.length > 0) {
                setSlotPickerData({
                  slots: slotsResponse.slots,
                  doctorId: doctorId,
                  date: selectedDate,
                });
                setShowSlotPicker(true);
              } else {
                console.log('No slots available for this date');
              }
            } catch (error) {
              console.error('Error fetching slots:', error);
            }
          }, 500);
        } else {
          console.log('Missing doctorId or selectedDate:', { doctorId, selectedDate });
        }
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

      // Speak the response if voice is enabled (check voiceEnabled state)
      if (isVoiceSupported && voiceEnabled && response.message) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          if (voiceEnabled) {
            speak(response.message);
          }
        }, 100);
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
    const message = `I'd like to book the ${slot.time} slot`;
    handleSend(message);
  };

  const handleDateSelect = (date) => {
    setShowDatePicker(false);
    // Date is already in YYYY-MM-DD format from DatePicker
    handleSend(date);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fetch and show appointments for reschedule/cancel
  const fetchAndShowAppointments = async (email, action) => {
    try {
      console.log('Fetching appointments for:', email);
      const response = await chatAPI.getAppointments(email);
      console.log('Appointments fetched:', response);
      
      if (response.appointments && response.appointments.length > 0) {
        setAppointments(response.appointments);
        setAppointmentAction(action);
        setShowAppointmentSelector(true);
      } else {
        // No appointments found
        handleSend('I don\'t have any appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      handleSend('Error fetching my appointments');
    }
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointment) => {
    console.log('Appointment selected:', appointment);
    setShowAppointmentSelector(false);
    
    // Store the selected appointment details in session data
    setSessionData(prev => ({
      ...prev,
      selectedAppointmentId: appointment.id,
      selectedAppointmentDoctorId: appointment.doctor_id,
      selectedAppointmentDate: appointment.appointment_date,
      selectedAppointmentTime: appointment.start_time,
    }));
    
    // Send confirmation message
    const message = `I want to ${appointmentAction === 'cancel_appointment' ? 'cancel' : 'reschedule'} my appointment with ${appointment.doctor?.name || 'the doctor'} on ${new Date(appointment.appointment_date).toLocaleDateString()}`;
    handleSend(message);
  };

  // Hide quick actions after first message
  useEffect(() => {
    if (messages.length > 1) {
      setShowQuickActions(false);
    }
  }, [messages]);

  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="app">
      <ConnectionStatus />
      
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo-section">
            <img src="/Logo.png" alt="Davakhana.AI" className="header-logo" />
            <div>
              <h1>Davakhana.AI</h1>
              <p>Virtual Assistant</p>
            </div>
          </div>
          {isVoiceSupported && (
            <button 
              className={`voice-toggle ${voiceEnabled ? 'enabled' : 'muted'}`}
              onClick={() => {
                const newVoiceState = !voiceEnabled;
                setVoiceEnabled(newVoiceState);
                // If disabling voice, stop any ongoing speech immediately
                if (!newVoiceState) {
                  stopSpeaking();
                }
              }}
              title={voiceEnabled ? 'Mute voice assistant' : 'Enable voice assistant'}
            >
              {voiceEnabled ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="chat-container">
        {showQuickActions && messages.length <= 1 && (
          <QuickActions onActionClick={handleQuickAction} disabled={loading} />
        )}
        
        <div className="messages">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {showSlotPicker && slotPickerData && (
          <SlotPicker
            slots={slotPickerData.slots}
            onSelect={handleSlotSelect}
            onClose={() => setShowSlotPicker(false)}
          />
        )}

        {showDatePicker && (
          <DatePicker
            onSelect={handleDateSelect}
            onClose={() => setShowDatePicker(false)}
            minDate={new Date().toISOString().split('T')[0]}
          />
        )}

        {showAppointmentSelector && (
          <AppointmentSelector
            appointments={appointments}
            onSelect={handleAppointmentSelect}
            onClose={() => setShowAppointmentSelector(false)}
            action={appointmentAction}
          />
        )}

        <EnhancedPromptBox
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onVoiceStart={startListening}
          onVoiceStop={stopListening}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isLoading={loading}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export default App;
