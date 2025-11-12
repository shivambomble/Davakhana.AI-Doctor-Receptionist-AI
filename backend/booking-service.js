// Booking service with business logic and validation
import { db } from './db.js';
import { z } from 'zod';

// Validation schemas
const EmailSchema = z.string().email();
const PhoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone format');
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM');

export class BookingService {
  // Validate patient information
  validatePatientInfo(name, email, phone) {
    const errors = [];

    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    try {
      EmailSchema.parse(email);
    } catch {
      errors.push('Invalid email address');
    }

    try {
      PhoneSchema.parse(phone);
    } catch {
      errors.push('Invalid phone number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Validate appointment date/time
  validateAppointmentDateTime(date, time) {
    const errors = [];

    try {
      DateSchema.parse(date);
      const appointmentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        errors.push('Cannot book appointments in the past');
      }

      // Check if date is too far in future (e.g., 3 months)
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      if (appointmentDate > maxDate) {
        errors.push('Cannot book appointments more than 3 months in advance');
      }
    } catch {
      errors.push('Invalid date format');
    }

    try {
      TimeSchema.parse(time);
    } catch {
      errors.push('Invalid time format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Get available slots for a doctor
  async getAvailableSlots(doctorId, date) {
    // Validate inputs
    const dateValidation = this.validateAppointmentDateTime(date, '09:00');
    if (!dateValidation.valid) {
      throw new Error(dateValidation.errors.join(', '));
    }

    const slots = await db.getAvailableSlots(doctorId, date);
    
    return slots.map(slot => ({
      time: slot.slot_time,
      available: true,
    }));
  }

  // Helper to convert 12-hour time to 24-hour format
  convertTo24Hour(time) {
    if (!time) return time;
    
    // Already in 24-hour format
    if (/^\d{2}:\d{2}$/.test(time)) return time;
    
    // Convert from 12-hour format (e.g., "10:00 AM" or "2:00 PM")
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return time;
  }

  // Book appointment with full validation
  async bookAppointment(bookingData) {
    let { patientName, patientEmail, patientPhone, doctorId, date, time, notes } = bookingData;
    
    // Convert time to 24-hour format if needed
    time = this.convertTo24Hour(time);

    // Validate patient info
    const patientValidation = this.validatePatientInfo(patientName, patientEmail, patientPhone);
    if (!patientValidation.valid) {
      return {
        success: false,
        errors: patientValidation.errors,
      };
    }

    // Validate date/time
    const dateTimeValidation = this.validateAppointmentDateTime(date, time);
    if (!dateTimeValidation.valid) {
      return {
        success: false,
        errors: dateTimeValidation.errors,
      };
    }

    // Verify doctor exists
    try {
      await db.getDoctorById(doctorId);
    } catch {
      return {
        success: false,
        errors: ['Invalid doctor selected'],
      };
    }

    // Check slot availability
    const availableSlots = await this.getAvailableSlots(doctorId, date);
    // Normalize time format for comparison (handle both "09:00" and "09:00:00")
    const normalizedTime = time.length === 5 ? time : time.substring(0, 5);
    const slotAvailable = availableSlots.some(slot => {
      const slotTime = typeof slot.time === 'string' ? slot.time.substring(0, 5) : slot.time;
      return slotTime === normalizedTime;
    });

    if (!slotAvailable) {
      console.log('Available slots:', availableSlots.map(s => s.time));
      console.log('Requested time:', time);
      return {
        success: false,
        errors: ['Selected time slot is not available'],
      };
    }

    // Book appointment (transaction handled in DB function)
    try {
      const result = await db.bookAppointment(
        patientName,
        patientEmail,
        patientPhone,
        doctorId,
        date,
        time,
        notes
      );

      if (!result.success) {
        return {
          success: false,
          errors: [result.error],
        };
      }

      // Get doctor info for confirmation
      const doctor = await db.getDoctorById(doctorId);

      return {
        success: true,
        appointment: {
          id: result.appointment_id,
          doctor: doctor.name,
          date,
          time,
          patientEmail,
        },
      };
    } catch (error) {
      console.error('Booking error:', error);
      return {
        success: false,
        errors: ['Failed to book appointment. Please try again.'],
      };
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId, patientEmail) {
    try {
      EmailSchema.parse(patientEmail);
    } catch {
      return {
        success: false,
        errors: ['Invalid email address'],
      };
    }

    try {
      const result = await db.cancelAppointment(appointmentId, patientEmail);
      
      if (!result.success) {
        return {
          success: false,
          errors: [result.error],
        };
      }

      return {
        success: true,
        message: 'Appointment cancelled successfully',
      };
    } catch (error) {
      console.error('Cancellation error:', error);
      return {
        success: false,
        errors: ['Failed to cancel appointment. Please try again.'],
      };
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(appointmentId, patientEmail, newDate, newTime) {
    try {
      EmailSchema.parse(patientEmail);
    } catch {
      return {
        success: false,
        errors: ['Invalid email address'],
      };
    }

    // Validate new date/time
    const newTimeConverted = this.convertTo24Hour(newTime);
    const dateTimeValidation = this.validateAppointmentDateTime(newDate, newTimeConverted);
    if (!dateTimeValidation.valid) {
      return {
        success: false,
        errors: dateTimeValidation.errors,
      };
    }

    try {
      // Get the existing appointment
      const appointments = await db.getPatientAppointments(patientEmail);
      const appointment = appointments.find(a => a.id === appointmentId);
      
      if (!appointment) {
        return {
          success: false,
          errors: ['Appointment not found'],
        };
      }

      // Check if new slot is available
      const availableSlots = await this.getAvailableSlots(appointment.doctor_id, newDate);
      const normalizedNewTime = newTimeConverted.length === 5 ? newTimeConverted : newTimeConverted.substring(0, 5);
      const slotAvailable = availableSlots.some(slot => {
        const slotTime = typeof slot.time === 'string' ? slot.time.substring(0, 5) : slot.time;
        return slotTime === normalizedNewTime;
      });

      if (!slotAvailable) {
        return {
          success: false,
          errors: ['Selected time slot is not available'],
        };
      }

      // Cancel old appointment and book new one
      const cancelResult = await db.cancelAppointment(appointmentId, patientEmail);
      if (!cancelResult.success) {
        return {
          success: false,
          errors: ['Failed to cancel existing appointment'],
        };
      }

      // Get patient info
      const patient = appointments[0];
      
      // Book new appointment
      const bookResult = await db.bookAppointment(
        patient.patient_name || 'Patient',
        patientEmail,
        patient.patient_phone || '',
        appointment.doctor_id,
        newDate,
        newTimeConverted,
        'Rescheduled appointment'
      );

      if (!bookResult.success) {
        return {
          success: false,
          errors: [bookResult.error || 'Failed to book new appointment'],
        };
      }

      const doctor = await db.getDoctorById(appointment.doctor_id);

      return {
        success: true,
        appointment: {
          id: bookResult.appointment_id,
          doctor: doctor.name,
          date: newDate,
          time: newTimeConverted,
          patientEmail,
        },
        message: 'Appointment rescheduled successfully',
      };
    } catch (error) {
      console.error('Reschedule error:', error);
      return {
        success: false,
        errors: ['Failed to reschedule appointment. Please try again.'],
      };
    }
  }

  // Get patient's upcoming appointments
  async getPatientAppointments(patientEmail) {
    try {
      EmailSchema.parse(patientEmail);
    } catch {
      throw new Error('Invalid email address');
    }

    return await db.getPatientAppointments(patientEmail);
  }
}

export const bookingService = new BookingService();
