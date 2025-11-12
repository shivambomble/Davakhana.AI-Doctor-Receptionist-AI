-- Doctor Receptionist AI - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  consultation_fee DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, start_time)
);

-- Doctor schedules (availability)
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinic info (singleton table)
CREATE TABLE clinic_info (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  opening_hours JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);

-- Row Level Security Policies
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_info ENABLE ROW LEVEL SECURITY;

-- Public read access for doctors and schedules
CREATE POLICY "Public read doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public read schedules" ON doctor_schedules FOR SELECT USING (true);
CREATE POLICY "Public read clinic info" ON clinic_info FOR SELECT USING (true);

-- Patients can only see their own data
CREATE POLICY "Users view own patient data" ON patients FOR SELECT 
  USING (auth.uid()::text = id::text);

-- Patients can only see their own appointments
CREATE POLICY "Users view own appointments" ON appointments FOR SELECT 
  USING (auth.uid()::text = patient_id::text);

-- Service role can do everything (backend uses service key)
CREATE POLICY "Service role full access patients" ON patients FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access appointments" ON appointments FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- Insert sample data
INSERT INTO clinic_info (name, address, phone, email, opening_hours) VALUES (
  'HealthCare Clinic',
  '123 Medical Plaza, Suite 100, City, State 12345',
  '+1-555-0100',
  'info@healthcareclinic.com',
  '{"monday": "9:00 AM - 5:00 PM", "tuesday": "9:00 AM - 5:00 PM", "wednesday": "9:00 AM - 5:00 PM", "thursday": "9:00 AM - 5:00 PM", "friday": "9:00 AM - 5:00 PM", "saturday": "10:00 AM - 2:00 PM", "sunday": "Closed"}'::jsonb
);

INSERT INTO doctors (name, specialization, consultation_fee) VALUES
  ('Dr. Sarah Johnson', 'General Practitioner', 100.00),
  ('Dr. Michael Chen', 'Cardiologist', 150.00),
  ('Dr. Emily Rodriguez', 'Pediatrician', 120.00);

-- Sample schedules (Dr. Sarah Johnson - weekdays 9-5)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT id, day, '09:00'::time, '17:00'::time, 30
FROM doctors, generate_series(1, 5) AS day
WHERE name = 'Dr. Sarah Johnson';
