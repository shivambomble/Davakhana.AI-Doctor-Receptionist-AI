// Example client code demonstrating API usage with fetch

const API_BASE = 'http://localhost:3001/api';

// Example 1: Send a chat message
async function sendChatMessage() {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'I would like to book an appointment with Dr. Sarah Johnson',
      conversationHistory: [],
      sessionData: {},
    }),
  });

  const data = await response.json();
  console.log('AI Response:', data.message);
  console.log('Action:', data.action);
  console.log('Data:', data.data);
  
  return data;
}

// Example 2: Get available slots
async function getAvailableSlots(doctorId, date) {
  const response = await fetch(
    `${API_BASE}/slots?doctor_id=${doctorId}&date=${date}`
  );

  const data = await response.json();
  console.log('Available slots:', data.slots);
  
  return data.slots;
}

// Example 3: Book an appointment directly
async function bookAppointment() {
  const response = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientName: 'John Doe',
      patientEmail: 'john.doe@example.com',
      patientPhone: '+1-555-0123',
      doctorId: 'doctor-uuid-here',
      date: '2025-11-20',
      time: '14:00',
      notes: 'First visit',
    }),
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Appointment booked successfully!');
    console.log('Appointment ID:', data.appointment.id);
  } else {
    console.error('Booking failed:', data.errors);
  }
  
  return data;
}

// Example 4: Get list of doctors
async function getDoctors() {
  const response = await fetch(`${API_BASE}/doctors`);
  const doctors = await response.json();
  
  console.log('Available doctors:');
  doctors.forEach(doctor => {
    console.log(`- ${doctor.name} (${doctor.specialization}) - $${doctor.consultation_fee}`);
  });
  
  return doctors;
}

// Example 5: Get clinic information
async function getClinicInfo() {
  const response = await fetch(`${API_BASE}/clinic-info`);
  const info = await response.json();
  
  console.log('Clinic:', info.name);
  console.log('Address:', info.address);
  console.log('Phone:', info.phone);
  console.log('Hours:', info.opening_hours);
  
  return info;
}

// Example 6: Cancel an appointment
async function cancelAppointment(appointmentId, patientEmail) {
  const response = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientEmail,
    }),
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Appointment cancelled successfully');
  } else {
    console.error('Cancellation failed:', data.errors);
  }
  
  return data;
}

// Example 7: Full conversation flow
async function conversationFlow() {
  console.log('=== Starting Conversation Flow ===\n');
  
  // Step 1: Initial greeting
  let response = await sendChatMessage();
  let history = response.conversationHistory;
  
  // Step 2: Ask about doctors
  response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What doctors are available?',
      conversationHistory: history,
    }),
  }).then(r => r.json());
  
  console.log('AI:', response.message);
  history = response.conversationHistory;
  
  // Step 3: Check availability
  response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Can I see Dr. Sarah Johnson next Monday?',
      conversationHistory: history,
    }),
  }).then(r => r.json());
  
  console.log('AI:', response.message);
  
  if (response.actionResult?.slots) {
    console.log('Available slots:', response.actionResult.slots);
  }
}

// Run examples (uncomment to test)
// sendChatMessage();
// getDoctors();
// getClinicInfo();
// conversationFlow();

export {
  sendChatMessage,
  getAvailableSlots,
  bookAppointment,
  getDoctors,
  getClinicInfo,
  cancelAppointment,
  conversationFlow,
};
