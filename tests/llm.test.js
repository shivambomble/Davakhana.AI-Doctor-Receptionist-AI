// Tests for LLM service
import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock environment
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.JWT_SECRET = 'test-jwt-secret';

const { LLMService } = await import('../backend/llm.js');

describe('LLMService', () => {
  let llmService;

  it('should initialize with config', () => {
    llmService = new LLMService();
    assert.ok(llmService);
    assert.ok(llmService.apiKey);
    assert.ok(llmService.model);
  });

  describe('parseStructuredResponse', () => {
    it('should parse valid JSON response', () => {
      const validJson = JSON.stringify({
        action: 'greeting',
        fulfillment_text: 'Hello! How can I help you?',
        data: {},
      });

      const result = llmService.parseStructuredResponse(validJson);
      
      assert.strictEqual(result.action, 'greeting');
      assert.strictEqual(result.fulfillment_text, 'Hello! How can I help you?');
    });

    it('should parse JSON in markdown code blocks', () => {
      const markdownJson = '```json\n{"action":"greeting","fulfillment_text":"Hello!"}\n```';

      const result = llmService.parseStructuredResponse(markdownJson);
      
      assert.strictEqual(result.action, 'greeting');
      assert.strictEqual(result.fulfillment_text, 'Hello!');
    });

    it('should return fallback for invalid JSON', () => {
      const invalidJson = 'This is not JSON';

      const result = llmService.parseStructuredResponse(invalidJson);
      
      assert.strictEqual(result.action, 'clarification_needed');
      assert.ok(result.fulfillment_text.includes('trouble processing'));
    });

    it('should validate action types', () => {
      const invalidAction = JSON.stringify({
        action: 'invalid_action',
        fulfillment_text: 'Test',
      });

      const result = llmService.parseStructuredResponse(invalidAction);
      
      // Should fallback due to invalid action
      assert.strictEqual(result.action, 'clarification_needed');
    });
  });

  describe('buildSystemPrompt', () => {
    it('should build prompt with clinic context', () => {
      const context = {
        clinicInfo: {
          name: 'Test Clinic',
          address: '123 Test St',
          phone: '555-0100',
          email: 'test@clinic.com',
          opening_hours: { monday: '9-5' },
        },
        doctors: [
          { name: 'Dr. Test', specialization: 'GP', consultation_fee: 100 },
        ],
      };

      const prompt = llmService.buildSystemPrompt(context);
      
      assert.ok(prompt.includes('Test Clinic'));
      assert.ok(prompt.includes('Dr. Test'));
      assert.ok(prompt.includes('123 Test St'));
      assert.ok(prompt.includes('JSON object'));
    });
  });
});

console.log('✓ All LLM service tests passed');
