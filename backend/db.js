// Supabase database client
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import fetch from 'node-fetch';
import { config } from './config.js';

// Create HTTPS agent that accepts self-signed certificates (dev only)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Custom fetch with HTTPS agent
const customFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    agent: url.startsWith('https') ? httpsAgent : undefined,
  });
};

// Service role client for backend operations (bypasses RLS)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: customFetch,
    },
  }
);

// Database service layer
export const db = {
  // Get clinic information
  async getClinicInfo() {
    const { data, error } = await supabase
      .from('clinic_info')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all doctors
  async getDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Get doctor by ID
  async getDoctorById(doctorId) {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get available slots for a doctor on a date
  async getAvailableSlots(doctorId, date) {
    const { data, error } = await supabase
      .rpc('get_available_slots', {
        p_doctor_id: doctorId,
        p_date: date,
      });
    
    if (error) throw error;
    return data.filter(slot => slot.is_available);
  },

  // Book appointment
  async bookAppointment(patientName, patientEmail, patientPhone, doctorId, appointmentDate, startTime, notes = null) {
    const { data, error } = await supabase
      .rpc('book_appointment', {
        p_patient_name: patientName,
        p_patient_email: patientEmail,
        p_patient_phone: patientPhone,
        p_doctor_id: doctorId,
        p_appointment_date: appointmentDate,
        p_start_time: startTime,
        p_notes: notes,
      });
    
    if (error) throw error;
    return data;
  },

  // Cancel appointment
  async cancelAppointment(appointmentId, patientEmail) {
    const { data, error } = await supabase
      .rpc('cancel_appointment', {
        p_appointment_id: appointmentId,
        p_patient_email: patientEmail,
      });
    
    if (error) throw error;
    return data;
  },

  // Get patient appointments
  async getPatientAppointments(patientEmail) {
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('email', patientEmail)
      .single();
    
    if (!patient) return [];

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        doctor_id,
        patient_id,
        doctor:doctors(name, specialization)
      `)
      .eq('patient_id', patient.id)
      .eq('status', 'scheduled')
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },
};
