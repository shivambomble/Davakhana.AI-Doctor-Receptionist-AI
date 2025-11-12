// API client for backend communication
const API_BASE = '/api';

export const chatAPI = {
  // Send message to chat endpoint
  async sendMessage(message, conversationHistory = [], sessionData = {}) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        sessionData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },

  // Get available slots
  async getSlots(doctorId, date) {
    const response = await fetch(
      `${API_BASE}/slots?doctor_id=${doctorId}&date=${date}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch slots');
    }

    return response.json();
  },

  // Book appointment
  async bookAppointment(bookingData) {
    const response = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error('Failed to book appointment');
    }

    return response.json();
  },

  // Get doctors
  async getDoctors() {
    const response = await fetch(`${API_BASE}/doctors`);

    if (!response.ok) {
      throw new Error('Failed to fetch doctors');
    }

    return response.json();
  },

  // Get clinic info
  async getClinicInfo() {
    const response = await fetch(`${API_BASE}/clinic-info`);

    if (!response.ok) {
      throw new Error('Failed to fetch clinic info');
    }

    return response.json();
  },
};
