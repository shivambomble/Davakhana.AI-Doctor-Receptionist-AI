// Email service for appointment notifications
import nodemailer from 'nodemailer';
import { config } from './config.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  // Send appointment confirmation email
  async sendAppointmentConfirmation(appointmentData) {
    const { patientName, patientEmail, doctorName, date, time, clinicName, clinicPhone } = appointmentData;

    const mailOptions = {
      from: `"${clinicName}" <${config.email.from}>`,
      to: patientEmail,
      subject: `Appointment Confirmation - ${clinicName}`,
      html: this.getConfirmationEmailTemplate(appointmentData),
      text: this.getConfirmationEmailText(appointmentData),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Confirmation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send appointment cancellation email
  async sendAppointmentCancellation(appointmentData) {
    const { patientName, patientEmail, doctorName, date, time, clinicName } = appointmentData;

    const mailOptions = {
      from: `"${clinicName}" <${config.email.from}>`,
      to: patientEmail,
      subject: `Appointment Cancelled - ${clinicName}`,
      html: this.getCancellationEmailTemplate(appointmentData),
      text: `Dear ${patientName},\n\nYour appointment with ${doctorName} on ${date} at ${time} has been cancelled.\n\nIf you need to reschedule, please contact us.\n\nBest regards,\n${clinicName}`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Cancellation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send appointment reschedule email
  async sendAppointmentReschedule(appointmentData) {
    const { patientName, patientEmail, doctorName, oldDate, oldTime, newDate, newTime, clinicName } = appointmentData;

    const mailOptions = {
      from: `"${clinicName}" <${config.email.from}>`,
      to: patientEmail,
      subject: `Appointment Rescheduled - ${clinicName}`,
      html: this.getRescheduleEmailTemplate(appointmentData),
      text: `Dear ${patientName},\n\nYour appointment has been rescheduled.\n\nPrevious: ${oldDate} at ${oldTime}\nNew: ${newDate} at ${newTime}\n\nDoctor: ${doctorName}\n\nBest regards,\n${clinicName}`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Reschedule email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending reschedule email:', error);
      return { success: false, error: error.message };
    }
  }

  // HTML template for confirmation email
  getConfirmationEmailTemplate(data) {
    const { patientName, doctorName, specialization, date, time, clinicName, clinicAddress, clinicPhone, fee } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Appointment Confirmed</h1>
            <p>Your appointment has been successfully scheduled</p>
          </div>
          <div class="content">
            <p>Dear ${patientName},</p>
            <p>Thank you for booking an appointment with us. Here are your appointment details:</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">Doctor:</span>
                <span>${doctorName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Specialization:</span>
                <span>${specialization}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${time}</span>
              </div>
              ${fee ? `<div class="detail-row">
                <span class="detail-label">Consultation Fee:</span>
                <span>$${fee}</span>
              </div>` : ''}
            </div>

            <h3>Clinic Information:</h3>
            <p>
              <strong>${clinicName}</strong><br>
              ${clinicAddress || ''}<br>
              Phone: ${clinicPhone || ''}
            </p>

            <p><strong>Important:</strong></p>
            <ul>
              <li>Please arrive 10 minutes before your appointment time</li>
              <li>Bring your ID and insurance card (if applicable)</li>
              <li>If you need to cancel or reschedule, please contact us at least 24 hours in advance</li>
            </ul>

            <center>
              <a href="#" class="button">Add to Calendar</a>
            </center>
          </div>
          <div class="footer">
            <p>This is an automated message from ${clinicName}. Please do not reply to this email.</p>
            <p>If you have any questions, please contact us at ${clinicPhone}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Plain text version
  getConfirmationEmailText(data) {
    const { patientName, doctorName, specialization, date, time, clinicName, clinicAddress, clinicPhone, fee } = data;
    
    return `
Dear ${patientName},

Your appointment has been confirmed!

APPOINTMENT DETAILS:
Doctor: ${doctorName}
Specialization: ${specialization}
Date: ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${time}
${fee ? `Consultation Fee: $${fee}` : ''}

CLINIC INFORMATION:
${clinicName}
${clinicAddress || ''}
Phone: ${clinicPhone || ''}

IMPORTANT REMINDERS:
- Please arrive 10 minutes before your appointment time
- Bring your ID and insurance card (if applicable)
- If you need to cancel or reschedule, please contact us at least 24 hours in advance

Best regards,
${clinicName}
    `;
  }

  // Cancellation email template
  getCancellationEmailTemplate(data) {
    const { patientName, doctorName, date, time, clinicName, clinicPhone } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Cancelled</h1>
          </div>
          <div class="content">
            <p>Dear ${patientName},</p>
            <p>Your appointment has been cancelled as requested.</p>
            
            <div class="appointment-details">
              <p><strong>Cancelled Appointment:</strong></p>
              <p>Doctor: ${doctorName}<br>
              Date: ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
              Time: ${time}</p>
            </div>

            <p>If you would like to reschedule, please contact us at ${clinicPhone} or book online.</p>
          </div>
          <div class="footer">
            <p>${clinicName}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Reschedule email template
  getRescheduleEmailTemplate(data) {
    const { patientName, doctorName, oldDate, oldTime, newDate, newTime, clinicName } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .old-appointment { text-decoration: line-through; color: #999; }
          .new-appointment { color: #667eea; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Appointment Rescheduled</h1>
          </div>
          <div class="content">
            <p>Dear ${patientName},</p>
            <p>Your appointment has been successfully rescheduled.</p>
            
            <div class="appointment-details">
              <p class="old-appointment">Previous: ${new Date(oldDate).toLocaleDateString()} at ${oldTime}</p>
              <p class="new-appointment">New: ${new Date(newDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${newTime}</p>
              <p>Doctor: ${doctorName}</p>
            </div>

            <p>Please arrive 10 minutes before your appointment time.</p>
          </div>
          <div class="footer">
            <p>${clinicName}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
