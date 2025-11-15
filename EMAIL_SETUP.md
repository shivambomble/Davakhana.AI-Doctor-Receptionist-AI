# Email Notification Setup Guide

## Overview

The system sends automated email notifications for:
- ✅ Appointment confirmations
- 🔄 Appointment rescheduling
- ❌ Appointment cancellations

## Setup Instructions

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Davakhana AI"
   - Copy the 16-character password

3. **Update .env file**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # App password from step 2
   EMAIL_FROM=your-email@gmail.com
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Create SendGrid Account**
   - Sign up at https://sendgrid.com
   - Verify your email

2. **Create API Key**
   - Go to Settings > API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the API key

3. **Update .env file**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Option 3: AWS SES (Production)

1. **Setup AWS SES**
   - Go to AWS SES Console
   - Verify your domain or email
   - Get SMTP credentials

2. **Update .env file**
   ```env
   EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-ses-smtp-username
   EMAIL_PASSWORD=your-ses-smtp-password
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Option 4: Other SMTP Providers

**Mailgun:**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

**Outlook/Office365:**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

## Testing Email Configuration

After configuring, test by booking an appointment:

```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "Test Patient",
    "patientEmail": "your-test-email@gmail.com",
    "patientPhone": "+1-555-0123",
    "doctorId": "doctor-uuid-here",
    "date": "2025-11-20",
    "time": "10:00",
    "notes": "Test appointment"
  }'
```

Check your email inbox for the confirmation!

## Email Templates

The system includes beautiful HTML email templates with:
- 📧 Professional design with gradients
- 📱 Mobile-responsive layout
- 📅 Appointment details clearly displayed
- 🏥 Clinic information
- ⏰ Important reminders

## Troubleshooting

### Gmail "Less secure app" error
- Use App Password instead of regular password
- Enable 2-Factor Authentication first

### Emails going to spam
- Verify your domain with SPF/DKIM records
- Use a professional email service (SendGrid, AWS SES)
- Avoid spam trigger words in templates

### Connection timeout
- Check firewall settings
- Verify SMTP port is not blocked
- Try port 465 with `EMAIL_SECURE=true`

### Authentication failed
- Double-check username and password
- For Gmail, use App Password, not regular password
- Ensure no extra spaces in credentials

## Production Recommendations

1. **Use a dedicated email service** (SendGrid, AWS SES, Mailgun)
2. **Verify your domain** for better deliverability
3. **Set up SPF and DKIM** records
4. **Monitor email delivery** rates
5. **Implement retry logic** for failed emails
6. **Add unsubscribe links** (for marketing emails)
7. **Track email opens** (optional)

## Security Notes

- ⚠️ Never commit `.env` file with real credentials
- 🔒 Use App Passwords for Gmail, not account password
- 🔐 Rotate credentials regularly
- 📊 Monitor for suspicious activity
- 🚫 Don't log email passwords

## Email Delivery Status

The system logs email delivery status:
- ✅ Success: Email sent successfully
- ❌ Failed: Check backend logs for error details

Failed emails don't prevent appointment booking - the appointment is still created even if email fails.

## Customization

To customize email templates, edit `backend/email-service.js`:
- `getConfirmationEmailTemplate()` - Confirmation email
- `getCancellationEmailTemplate()` - Cancellation email
- `getRescheduleEmailTemplate()` - Reschedule email

## Support

For email-related issues:
1. Check backend logs for error messages
2. Verify SMTP credentials
3. Test with a simple email client first
4. Contact your email provider's support
