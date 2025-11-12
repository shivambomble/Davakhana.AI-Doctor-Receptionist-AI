// LLM adapter for OpenRouter
import https from 'https';
import { config } from './config.js';
import { z } from 'zod';

// HTTPS agent for SSL (dev only)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Action schema for structured LLM responses
const ActionSchema = z.object({
  action: z.enum([
    'greeting',
    'provide_info',
    'check_availability',
    'book_appointment',
    'cancel_appointment',
    'reschedule_appointment',
    'collect_patient_info',
    'escalate_to_human',
    'clarification_needed',
  ]),
  fulfillment_text: z.string(),
  data: z.record(z.any()).optional(),
  requires_confirmation: z.boolean().optional(),
});

export class LLMService {
  constructor() {
    this.apiKey = config.groq.apiKey;
    this.model = config.groq.model;
    this.baseUrl = config.groq.baseUrl;
  }

  // Generate response from LLM with structured output
  async generateResponse(conversationHistory, context = {}) {
    const systemPrompt = this.buildSystemPrompt(context);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
        agent: httpsAgent,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Groq API error response:', errorBody);
        throw new Error(`Groq API error: ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse and validate structured response
      return this.parseStructuredResponse(content);
    } catch (error) {
      console.error('LLM generation error:', error);
      
      // If timeout or network error, return a fallback response
      if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('fetch failed')) {
        console.log('LLM timeout - returning fallback response');
        return {
          action: 'clarification_needed',
          fulfillment_text: "I'm having trouble connecting right now. Could you please rephrase your request? Or you can call us directly at our clinic.",
          data: {},
        };
      }
      
      throw error;
    }
  }

  // Build system prompt with context
  buildSystemPrompt(context) {
    const { clinicInfo, doctors } = context;
    
    return `You are an AI receptionist for ${clinicInfo?.name || 'our clinic'}. Your role is to assist patients professionally and efficiently.

CLINIC INFORMATION:
${clinicInfo ? `
- Address: ${clinicInfo.address}
- Phone: ${clinicInfo.phone}
- Email: ${clinicInfo.email}
- Hours: ${JSON.stringify(clinicInfo.opening_hours, null, 2)}
` : 'Not available'}

AVAILABLE DOCTORS:
${doctors?.map(d => `- ${d.name} (${d.specialization}) - Fee: $${d.consultation_fee} [ID: ${d.id}]`).join('\n') || 'Not available'}

IMPORTANT: When booking appointments, you MUST use the doctor's ID (UUID) in the "doctor_id" field, NOT the doctor's name.

CAPABILITIES:
1. Greet patients warmly and professionally
2. Answer questions about clinic hours, location, fees, and services
3. Check doctor availability and schedules
4. Book, reschedule, or cancel appointments
5. Collect and validate patient information (name, email, phone)
6. Escalate complex medical questions or complaints to human staff

RESPONSE FORMAT:
You MUST respond with a JSON object containing:
{
  "action": "<action_type>",
  "fulfillment_text": "<friendly response to patient>",
  "data": {<optional structured data>},
  "requires_confirmation": <true/false>
}

ACTIONS:
- "greeting": Initial welcome message
- "provide_info": Answer general questions (hours, fees, location)
- "check_availability": Patient wants to see available slots
- "book_appointment": Patient wants to book (collect: doctor, date, time, patient details)
- "cancel_appointment": Patient wants to cancel (need: appointment ID or patient email)
- "reschedule_appointment": Patient wants to reschedule
- "collect_patient_info": Need to gather patient details (name, email, phone)
- "escalate_to_human": Complex issue requiring human staff
- "clarification_needed": Need more information from patient

DATA FIELD EXAMPLES:
- For "check_availability": {"doctor_id": "f6705bd1-1b55-44bc-b11a-4af7d45d13db", "date": "2025-11-20"}
- For "book_appointment": {"doctor_id": "f6705bd1-1b55-44bc-b11a-4af7d45d13db", "date": "2025-11-20", "time": "14:00", "patient_name": "John Doe", "patient_email": "john@example.com", "patient_phone": "+1-555-0123"}
- For "reschedule_appointment": {"patient_email": "john@example.com", "new_date": "2025-11-21", "new_time": "15:00"}
- For "cancel_appointment": {"appointment_id": "uuid", "patient_email": "john@example.com"}
- For "collect_patient_info": {"missing_fields": ["name", "email", "phone"]}

CRITICAL: The "doctor_id" field MUST be the UUID from the doctor list above (e.g., "${doctors?.[0]?.id || 'uuid-here'}"), NOT the doctor's name!

For rescheduling: 
1. Ask the patient for their email
2. Ask for the new date and time they want
3. Once you have email, new_date, and new_time, use action "reschedule_appointment"
4. You don't need the appointment_id - the system will find it automatically from the email

CRITICAL DATE/TIME FORMAT RULES:
- ALWAYS use YYYY-MM-DD format for dates (e.g., "2025-11-21" NOT "Thursday" or "Nov 21")
- ALWAYS use HH:MM 24-hour format for times (e.g., "14:00" NOT "2:00 PM" or "10:00 AM")
- When user says "Thursday", calculate the actual date in YYYY-MM-DD format
- When user says "10:00 AM", convert to 24-hour format "10:00"
- When user says "2:00 PM", convert to 24-hour format "14:00"
- Current date for reference: ${new Date().toISOString().split('T')[0]}

IMPORTANT RULES:
1. Always be warm, professional, and empathetic
2. Never provide medical advice - escalate medical questions
3. Validate email format and phone numbers
4. Confirm appointment details before booking
5. For booking, ensure you have: doctor, date, time, patient name, email, phone
6. If patient mentions symptoms or medical concerns, acknowledge and suggest booking with appropriate specialist
7. ALWAYS respond with valid JSON only, no additional text
8. Use "requires_confirmation": true when booking/cancelling/rescheduling to get explicit patient confirmation
9. NEVER make up or hallucinate available time slots - only use action "check_availability" to get real slots
10. If checking availability returns no slots, inform the patient that the doctor is not available on that date and suggest trying another date
11. NEVER say an appointment is booked/rescheduled/cancelled until AFTER the action completes - say you're "processing" or "checking" instead
12. When user says "4 PM" or "4:00 PM", convert to 24-hour format "16:00" NOT "04:00"

PRIVACY & SECURITY:
- Never log or store sensitive patient information unnecessarily
- Treat all patient data as Protected Health Information (PHI)
- Be mindful of data minimization principles`;
  }

  // Parse and validate LLM response
  parseStructuredResponse(content) {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonStr);
      
      // Validate against schema
      const validated = ActionSchema.parse(parsed);
      
      return validated;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Raw content:', content);
      
      // Fallback response
      return {
        action: 'clarification_needed',
        fulfillment_text: "I apologize, but I'm having trouble processing that. Could you please rephrase your request?",
        data: {},
      };
    }
  }
}

export const llmService = new LLMService();
