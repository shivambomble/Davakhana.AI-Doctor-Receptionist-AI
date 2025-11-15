// Fastify server with API endpoints
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { db } from './db.js';
import { llmService } from './llm.js';
import { bookingService } from './booking-service.js';

const fastify = Fastify({
  logger: config.nodeEnv === 'development',
});

// Enable CORS
await fastify.register(cors, {
  origin: true,
});

// Root route
fastify.get('/', async () => {
  return {
    name: 'Doctor Receptionist AI API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      clinicInfo: '/api/clinic-info',
      doctors: '/api/doctors',
      slots: '/api/slots?doctor_id={id}&date={YYYY-MM-DD}',
      chat: 'POST /api/chat',
      appointments: 'POST /api/appointments',
    },
    documentation: 'See API.md for full documentation',
  };
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Get clinic info
fastify.get('/api/clinic-info', async () => {
  const info = await db.getClinicInfo();
  return info;
});

// Get all doctors
fastify.get('/api/doctors', async () => {
  const doctors = await db.getDoctors();
  return doctors;
});

// Get available slots
fastify.get('/api/slots', async (request, reply) => {
  const { doctor_id, date } = request.query;

  if (!doctor_id || !date) {
    return reply.code(400).send({
      error: 'Missing required parameters: doctor_id and date',
    });
  }

  try {
    const slots = await bookingService.getAvailableSlots(doctor_id, date);
    return { slots };
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
});

// Book appointment
fastify.post('/api/appointments', async (request, reply) => {
  const { patientName, patientEmail, patientPhone, doctorId, date, time, notes } = request.body;

  if (!patientName || !patientEmail || !patientPhone || !doctorId || !date || !time) {
    return reply.code(400).send({
      error: 'Missing required fields',
    });
  }

  const result = await bookingService.bookAppointment({
    patientName,
    patientEmail,
    patientPhone,
    doctorId,
    date,
    time,
    notes,
  });

  if (!result.success) {
    return reply.code(400).send({ errors: result.errors });
  }

  return result;
});

// Cancel appointment
fastify.post('/api/appointments/:id/cancel', async (request, reply) => {
  const { id } = request.params;
  const { patientEmail } = request.body;

  if (!patientEmail) {
    return reply.code(400).send({ error: 'Patient email required' });
  }

  const result = await bookingService.cancelAppointment(id, patientEmail);

  if (!result.success) {
    return reply.code(400).send({ errors: result.errors });
  }

  return result;
});

// Reschedule appointment
fastify.post('/api/appointments/:id/reschedule', async (request, reply) => {
  const { id } = request.params;
  const { patientEmail, newDate, newTime } = request.body;

  if (!patientEmail || !newDate || !newTime) {
    return reply.code(400).send({ error: 'Patient email, new date, and new time required' });
  }

  const result = await bookingService.rescheduleAppointment(id, patientEmail, newDate, newTime);

  if (!result.success) {
    return reply.code(400).send({ errors: result.errors });
  }

  return result;
});

// Get patient appointments
fastify.get('/api/appointments', async (request, reply) => {
  const { email } = request.query;

  if (!email) {
    return reply.code(400).send({ error: 'Email parameter required' });
  }

  try {
    const appointments = await bookingService.getPatientAppointments(email);
    return { appointments };
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
});

// Helper function to validate email
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Chat endpoint - main conversational interface
fastify.post('/api/chat', async (request, reply) => {
  const { message, conversationHistory = [], sessionData = {} } = request.body;

  if (!message) {
    return reply.code(400).send({ error: 'Message is required' });
  }

  try {
    // Get context for LLM
    const clinicInfo = await db.getClinicInfo();
    const doctors = await db.getDoctors();

    const context = {
      clinicInfo,
      doctors,
      sessionData,
    };

    // Build conversation history
    const history = [
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // Generate LLM response
    let llmResponse;
    try {
      llmResponse = await llmService.generateResponse(history, context);
    } catch (llmError) {
      console.error('LLM error, using fallback:', llmError.message);
      // Return a helpful fallback response
      return reply.code(200).send({
        message: "I'm having trouble processing your request right now. Here's what I can help you with:\n\n• Book an appointment - Please call us at " + (clinicInfo?.phone || '+1-555-0100') + "\n• Check availability - Visit our website\n• General questions - Email us at " + (clinicInfo?.email || 'info@clinic.com'),
        action: 'escalate_to_human',
        data: {},
        actionResult: null,
        requiresConfirmation: false,
        conversationHistory: history,
      });
    }

    // Execute action if needed
    let actionResult = null;
    
    if (llmResponse.action === 'check_availability' && llmResponse.data?.doctor_id && llmResponse.data?.date) {
      try {
        const slots = await bookingService.getAvailableSlots(
          llmResponse.data.doctor_id,
          llmResponse.data.date
        );
        actionResult = { slots };
        
        // If no slots available, regenerate response with this info
        if (slots.length === 0) {
          const noSlotsContext = {
            ...context,
            noSlotsAvailable: true,
            requestedDate: llmResponse.data.date,
          };
          
          const updatedHistory = [
            ...history,
            { role: 'assistant', content: JSON.stringify(llmResponse) },
            { role: 'system', content: `No slots are available for the requested date ${llmResponse.data.date}. The doctor may not work on this day or all slots are booked. Inform the patient and suggest checking another date.` },
          ];
          
          const updatedResponse = await llmService.generateResponse(updatedHistory, noSlotsContext);
          
          return {
            message: updatedResponse.fulfillment_text,
            action: updatedResponse.action,
            data: updatedResponse.data,
            actionResult: { slots: [] },
            requiresConfirmation: false,
            conversationHistory: [
              ...updatedHistory,
              { role: 'assistant', content: JSON.stringify(updatedResponse) },
            ],
          };
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        actionResult = { slots: [], error: error.message };
      }
    }

    if (llmResponse.action === 'book_appointment' && llmResponse.data) {
      const bookingData = llmResponse.data;
      
      // Validate email before booking
      if (!isValidEmail(bookingData.patient_email)) {
        // Return error response asking for valid email
        return {
          message: `I noticed the email address "${bookingData.patient_email || 'provided'}" doesn't seem to be valid. Email addresses must include an @ symbol (like: name@example.com). Could you please provide your email address again?`,
          action: 'collect_patient_info',
          data: { missing_fields: ['patient_email'] },
          actionResult: null,
          requiresConfirmation: false,
          conversationHistory: [
            ...history,
            { role: 'assistant', content: 'Email validation failed - requesting valid email' },
          ],
        };
      }
      
      if (bookingData.patient_name && bookingData.patient_email && bookingData.patient_phone &&
          bookingData.doctor_id && bookingData.date && bookingData.time) {
        const result = await bookingService.bookAppointment({
          patientName: bookingData.patient_name,
          patientEmail: bookingData.patient_email,
          patientPhone: bookingData.patient_phone,
          doctorId: bookingData.doctor_id,
          date: bookingData.date,
          time: bookingData.time,
          notes: bookingData.notes,
        });
        actionResult = result;
      }
    }

    if (llmResponse.action === 'reschedule_appointment' && llmResponse.data) {
      const rescheduleData = llmResponse.data;
      
      // Validate email before processing
      if (rescheduleData.patient_email && !isValidEmail(rescheduleData.patient_email)) {
        return {
          message: `I noticed the email address "${rescheduleData.patient_email}" doesn't seem to be valid. Email addresses must include an @ symbol (like: name@example.com). Could you please provide your email address again?`,
          action: 'collect_patient_info',
          data: { missing_fields: ['patient_email'] },
          actionResult: null,
          requiresConfirmation: false,
          conversationHistory: [
            ...history,
            { role: 'assistant', content: 'Email validation failed - requesting valid email' },
          ],
        };
      }
      
      // If no appointment_id provided, try to get the most recent appointment for this patient
      let appointmentId = rescheduleData.appointment_id;
      
      if (!appointmentId && rescheduleData.patient_email) {
        try {
          const appointments = await bookingService.getPatientAppointments(rescheduleData.patient_email);
          if (appointments.length > 0) {
            // Get the most recent upcoming appointment
            appointmentId = appointments[0].id;
          }
        } catch (error) {
          console.error('Error fetching patient appointments:', error);
        }
      }
      
      if (appointmentId && rescheduleData.patient_email && 
          rescheduleData.new_date && rescheduleData.new_time) {
        const result = await bookingService.rescheduleAppointment(
          appointmentId,
          rescheduleData.patient_email,
          rescheduleData.new_date,
          rescheduleData.new_time
        );
        actionResult = result;
      } else {
        actionResult = {
          success: false,
          errors: ['Missing required information for rescheduling. Please provide your email, new date, and new time.'],
        };
      }
    }

    if (llmResponse.action === 'cancel_appointment' && llmResponse.data) {
      const cancelData = llmResponse.data;
      
      // Validate email before processing
      if (cancelData.patient_email && !isValidEmail(cancelData.patient_email)) {
        return {
          message: `I noticed the email address "${cancelData.patient_email}" doesn't seem to be valid. Email addresses must include an @ symbol (like: name@example.com). Could you please provide your email address again?`,
          action: 'collect_patient_info',
          data: { missing_fields: ['patient_email'] },
          actionResult: null,
          requiresConfirmation: false,
          conversationHistory: [
            ...history,
            { role: 'assistant', content: 'Email validation failed - requesting valid email' },
          ],
        };
      }
      
      if (cancelData.appointment_id && cancelData.patient_email) {
        const result = await bookingService.cancelAppointment(
          cancelData.appointment_id,
          cancelData.patient_email
        );
        actionResult = result;
      }
    }

    // Return response
    return {
      message: llmResponse.fulfillment_text,
      action: llmResponse.action,
      data: llmResponse.data,
      actionResult,
      requiresConfirmation: llmResponse.requires_confirmation,
      conversationHistory: [
        ...history,
        { role: 'assistant', content: JSON.stringify(llmResponse) },
      ],
    };
  } catch (error) {
    console.error('Chat error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    return reply.code(500).send({
      error: 'Failed to process message',
      message: 'I apologize, but I encountered an error. Please try again or contact our staff directly.',
      debug: config.nodeEnv === 'development' ? error.message : undefined,
    });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
