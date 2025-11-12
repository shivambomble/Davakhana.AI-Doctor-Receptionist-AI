// Integration tests for booking service
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

// Mock environment for testing
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.JWT_SECRET = 'test-jwt-secret';

// Import after env setup
const { BookingService } = await import('../backend/booking-service.js');

describe('BookingService', () => {
  let bookingService;

  before(() => {
    bookingService = new BookingService();
  });

  describe('validatePatientInfo', () => {
    it('should validate correct patient information', () => {
      const result = bookingService.validatePatientInfo(
        'John Doe',
        'john@example.com',
        '+1-555-0100'
      );
      
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject invalid email', () => {
      const result = bookingService.validatePatientInfo(
        'John Doe',
        'invalid-email',
        '+1-555-0100'
      );
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('email')));
    });

    it('should reject short name', () => {
      const result = bookingService.validatePatientInfo(
        'J',
        'john@example.com',
        '+1-555-0100'
      );
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Name')));
    });

    it('should reject invalid phone', () => {
      const result = bookingService.validatePatientInfo(
        'John Doe',
        'john@example.com',
        'invalid-phone'
      );
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('phone')));
    });
  });

  describe('validateAppointmentDateTime', () => {
    it('should validate correct date and time', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      const result = bookingService.validateAppointmentDateTime(dateStr, '14:30');
      
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject past dates', () => {
      const pastDate = '2020-01-01';
      
      const result = bookingService.validateAppointmentDateTime(pastDate, '14:30');
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('past')));
    });

    it('should reject invalid date format', () => {
      const result = bookingService.validateAppointmentDateTime('01/01/2025', '14:30');
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('date format')));
    });

    it('should reject invalid time format', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      const result = bookingService.validateAppointmentDateTime(dateStr, '2:30 PM');
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('time format')));
    });

    it('should reject dates too far in future', () => {
      const farFuture = new Date();
      farFuture.setMonth(farFuture.getMonth() + 6);
      const dateStr = farFuture.toISOString().split('T')[0];
      
      const result = bookingService.validateAppointmentDateTime(dateStr, '14:30');
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('3 months')));
    });
  });
});

console.log('✓ All booking service tests passed');
