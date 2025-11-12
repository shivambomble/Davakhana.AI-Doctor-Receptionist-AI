-- Stored Procedures for Doctor Receptionist AI
-- Run this after schema.sql

-- Function to get available slots for a doctor on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_doctor_id UUID,
  p_date DATE
)
RETURNS TABLE (
  slot_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_schedule RECORD;
  v_slot_time TIME;
BEGIN
  -- Get day of week (0=Sunday, 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Get doctor's schedule for this day
  SELECT * INTO v_schedule
  FROM doctor_schedules ds
  WHERE ds.doctor_id = p_doctor_id 
    AND ds.day_of_week = v_day_of_week
    AND ds.is_available = true
  LIMIT 1;
  
  -- If no schedule, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Generate time slots
  v_slot_time := v_schedule.start_time;
  
  WHILE v_slot_time < v_schedule.end_time LOOP
    RETURN QUERY
    SELECT 
      v_slot_time AS slot_time,
      NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.doctor_id = p_doctor_id
          AND a.appointment_date = p_date
          AND a.start_time = v_slot_time
          AND a.status = 'scheduled'
      ) AS is_available;
    
    v_slot_time := v_slot_time + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to book appointment (with transaction safety)
CREATE OR REPLACE FUNCTION book_appointment(
  p_patient_name TEXT,
  p_patient_email TEXT,
  p_patient_phone TEXT,
  p_doctor_id UUID,
  p_appointment_date DATE,
  p_start_time TIME,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_patient_id UUID;
  v_appointment_id UUID;
  v_slot_duration INTEGER;
  v_end_time TIME;
  v_slot_available BOOLEAN;
BEGIN
  -- Get slot duration
  SELECT slot_duration_minutes INTO v_slot_duration
  FROM doctor_schedules
  WHERE doctor_id = p_doctor_id
  LIMIT 1;
  
  v_end_time := p_start_time + (v_slot_duration || ' minutes')::INTERVAL;
  
  -- Check if slot is available (with row lock)
  SELECT NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_appointment_date
      AND start_time = p_start_time
      AND status = 'scheduled'
    FOR UPDATE
  ) INTO v_slot_available;
  
  IF NOT v_slot_available THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Slot no longer available'
    );
  END IF;
  
  -- Upsert patient
  INSERT INTO patients (name, email, phone)
  VALUES (p_patient_name, p_patient_email, p_patient_phone)
  ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name, phone = EXCLUDED.phone
  RETURNING id INTO v_patient_id;
  
  -- Create appointment
  INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, notes)
  VALUES (v_patient_id, p_doctor_id, p_appointment_date, p_start_time, v_end_time, p_notes)
  RETURNING id INTO v_appointment_id;
  
  RETURN json_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'patient_id', v_patient_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel appointment
CREATE OR REPLACE FUNCTION cancel_appointment(
  p_appointment_id UUID,
  p_patient_email TEXT
)
RETURNS JSON AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE appointments
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_appointment_id
    AND patient_id IN (SELECT id FROM patients WHERE email = p_patient_email)
    AND status = 'scheduled'
    AND appointment_date >= CURRENT_DATE;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Appointment not found or cannot be cancelled'
    );
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_slots TO anon, authenticated;
GRANT EXECUTE ON FUNCTION book_appointment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_appointment TO anon, authenticated;
