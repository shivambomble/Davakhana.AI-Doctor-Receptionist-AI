# API Documentation

Base URL: `http://localhost:3001/api` (development)

## Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

---

### Get Clinic Information

```
GET /api/clinic-info
```

**Response:**
```json
{
  "id": 1,
  "name": "HealthCare Clinic",
  "address": "123 Medical Plaza, Suite 100, City, State 12345",
  "phone": "+1-555-0100",
  "email": "info@healthcareclinic.com",
  "opening_hours": {
    "monday": "9:00 AM - 5:00 PM",
    "tuesday": "9:00 AM - 5:00 PM",
    "wednesday": "9:00 AM - 5:00 PM",
    "thursday": "9:00 AM - 5:00 PM",
    "friday": "9:00 AM - 5:00 PM",
    "saturday": "10:00 AM - 2:00 PM",
    "sunday": "Closed"
  }
}
```

---

### Get Doctors

```
GET /api/doctors
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Dr. Sarah Johnson",
    "specialization": "General Practitioner",
    "consultation_fee": 100.00
  }
]
```

---

### Get Available Slots

```
GET /api/slots?doctor_id={uuid}&date={YYYY-MM-DD}
```

**Parameters:**
- `doctor_id` (required): Doctor UUID
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "slots": [
    {
      "time": "09:00",
      "available": true
    },
    {
      "time": "09:30",
      "available": true
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Missing required parameters: doctor_id and date"
}
```

---

### Chat (Conversational Interface)

```
POST /api/chat
```

**Request Body:**
```json
{
  "message": "I want to book an appointment",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "{...}"
    }
  ],
  "sessionData": {
    "patientEmail": "john@example.com"
  }
}
```

**Response:**
```json
{
  "message": "I'd be happy to help you book an appointment. Which doctor would you like to see?",
  "action": "collect_patient_info",
  "data": {
    "missing_fields": ["doctor_id", "date", "time"]
  },
  "actionResult": null,
  "requiresConfirmation": false,
  "conversationHistory": [...]
}
```

**Action Types:**
- `greeting` - Initial welcome
- `provide_info` - General information
- `check_availability` - Show available slots
- `book_appointment` - Book appointment
- `cancel_appointment` - Cancel appointment
- `reschedule_appointment` - Reschedule
- `collect_patient_info` - Gather patient details
- `escalate_to_human` - Transfer to staff
- `clarification_needed` - Need more info

---

### Book Appointment

```
POST /api/appointments
```

**Request Body:**
```json
{
  "patientName": "John Doe",
  "patientEmail": "john.doe@example.com",
  "patientPhone": "+1-555-0123",
  "doctorId": "uuid",
  "date": "2025-11-20",
  "time": "14:00",
  "notes": "First visit"
}
```

**Success Response:**
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "doctor": "Dr. Sarah Johnson",
    "date": "2025-11-20",
    "time": "14:00",
    "patientEmail": "john.doe@example.com"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": [
    "Invalid email address",
    "Selected time slot is not available"
  ]
}
```

---

### Cancel Appointment

```
POST /api/appointments/{id}/cancel
```

**Request Body:**
```json
{
  "patientEmail": "john.doe@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": [
    "Appointment not found or cannot be cancelled"
  ]
}
```

---

### Get Patient Appointments

```
GET /api/appointments?email={email}
```

**Parameters:**
- `email` (required): Patient email address

**Response:**
```json
{
  "appointments": [
    {
      "id": "uuid",
      "appointment_date": "2025-11-20",
      "start_time": "14:00",
      "end_time": "14:30",
      "status": "scheduled",
      "notes": "First visit",
      "doctor": {
        "name": "Dr. Sarah Johnson",
        "specialization": "General Practitioner"
      }
    }
  ]
}
```

---

## Error Codes

- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Not implemented in development. For production:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Authentication

Currently no authentication required. For production:
- Implement JWT tokens
- Add API key authentication
- Use Supabase Auth for user sessions

## CORS

Development: All origins allowed
Production: Configure specific origins

## Validation Rules

**Email:**
- Must be valid email format
- Example: `user@example.com`

**Phone:**
- Format: `+1-555-0123` or `555-0123` or `(555) 012-3456`
- Must contain only digits, spaces, hyphens, parentheses, and optional +

**Date:**
- Format: `YYYY-MM-DD`
- Must be today or future date
- Cannot be more than 3 months in advance

**Time:**
- Format: `HH:MM` (24-hour)
- Example: `14:30`

**Name:**
- Minimum 2 characters
- No special validation

## LLM Response Schema

The chat endpoint returns structured responses from the LLM:

```typescript
{
  action: 'greeting' | 'provide_info' | 'check_availability' | 
          'book_appointment' | 'cancel_appointment' | 
          'reschedule_appointment' | 'collect_patient_info' | 
          'escalate_to_human' | 'clarification_needed',
  fulfillment_text: string,
  data?: Record<string, any>,
  requires_confirmation?: boolean
}
```

## Example Workflows

### Complete Booking Flow

1. **Initial greeting:**
```javascript
POST /api/chat
{ "message": "Hello" }
```

2. **Request appointment:**
```javascript
POST /api/chat
{ "message": "I want to book an appointment with Dr. Sarah Johnson" }
```

3. **Check availability:**
```javascript
POST /api/chat
{ "message": "What slots are available next Monday?" }
// Returns actionResult.slots
```

4. **Provide details and book:**
```javascript
POST /api/chat
{
  "message": "Book me for 2:00 PM. My name is John Doe, email john@example.com, phone 555-0123"
}
// Returns actionResult with booking confirmation
```

### Direct Booking (Bypass Chat)

```javascript
// 1. Get doctors
GET /api/doctors

// 2. Get slots
GET /api/slots?doctor_id={id}&date=2025-11-20

// 3. Book
POST /api/appointments
{
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientPhone": "555-0123",
  "doctorId": "{id}",
  "date": "2025-11-20",
  "time": "14:00"
}
```
