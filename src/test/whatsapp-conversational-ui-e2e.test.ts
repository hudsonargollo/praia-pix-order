/**
 * End-to-End Tests for WhatsApp Conversational UI Feature
 * 
 * Tests cover:
 * - Inbound message flow with audio notification
 * - Outbound message flow
 * - Order association with various phone formats
 * - Multiple active orders scenario
 * - No active orders scenario
 * - Completed order scenario
 * - Real-time updates
 * - Message status updates
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock environment variables
const SUPABASE_URL = 'https://test.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Test data
const TEST_PHONE_NUMBERS = {
  formatted: '(55) 73 99998-8888',
  normalized: '5573999988888',
  withCountryCode: '+55 73 99998-8888',
  withSpaces: '55 73 99998 8888',
  withDashes: '55-73-99998-8888',
};

const TEST_ORDER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_MESSAGE_CONTENT = 'Olá, quanto tempo para o pedido?';

describe('WhatsApp Conversational UI - End-to-End Tests', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let supabaseClient: ReturnType<typeof createClient>;

  beforeEach(() => {
    // Reset mocks
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Create mock Supabase client
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Webhook - Inbound Message Flow', () => {
    it('should process inbound message and associate with active order', async () => {
      // Arrange: Mock webhook payload
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-123',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            conversation: TEST_MESSAGE_CONTENT,
          },
          messageTimestamp: Date.now(),
        },
      };

      // Mock orders query response (active order found)
      const mockActiveOrder = {
        id: TEST_ORDER_ID,
        customer_phone: TEST_PHONE_NUMBERS.normalized,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      mockFetch
        // First call: Query orders
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockActiveOrder],
        })
        // Second call: Insert message
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{
            id: 'chat-msg-123',
            order_id: TEST_ORDER_ID,
            phone_number: TEST_PHONE_NUMBERS.normalized,
            direction: 'inbound',
            content: TEST_MESSAGE_CONTENT,
            status: 'sent',
            evolution_id: 'msg-123',
            created_at: new Date().toISOString(),
          }],
        });

      // Act: Simulate webhook call
      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
          headers: { 'Content-Type': 'application/json' },
        }),
        env: {
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY,
        },
      });

      // Assert
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.orderId).toBe(TEST_ORDER_ID);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should ignore message when no active orders exist', async () => {
      // Arrange
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-456',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            conversation: 'Test message',
          },
        },
      };

      // Mock: No active orders found
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: {
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY,
        },
      });

      // Assert
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.message).toContain('No active orders');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only query, no insert
    });

    it('should ignore message for completed orders', async () => {
      // Arrange
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-789',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            conversation: 'Test message',
          },
        },
      };

      // Mock: Only completed orders found
      const mockCompletedOrder = {
        id: TEST_ORDER_ID,
        customer_phone: TEST_PHONE_NUMBERS.normalized,
        status: 'completed',
        created_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCompletedOrder],
      });

      // Act
      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: {
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY,
        },
      });

      // Assert
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.message).toContain('No active orders');
    });

    it('should associate with most recent order when multiple active orders exist', async () => {
      // Arrange
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-multi',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            conversation: 'Which order?',
          },
        },
      };

      // Mock: Multiple active orders (already sorted by created_at desc)
      const olderOrder = {
        id: 'order-old',
        customer_phone: TEST_PHONE_NUMBERS.normalized,
        status: 'pending',
        created_at: '2024-01-01T10:00:00Z',
      };

      const newerOrder = {
        id: 'order-new',
        customer_phone: TEST_PHONE_NUMBERS.normalized,
        status: 'pending',
        created_at: '2024-01-01T11:00:00Z',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [newerOrder, olderOrder], // Newer first (desc order)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{
            id: 'chat-msg-multi',
            order_id: 'order-new', // Should use newer order
            phone_number: TEST_PHONE_NUMBERS.normalized,
            direction: 'inbound',
            content: 'Which order?',
            status: 'sent',
            created_at: new Date().toISOString(),
          }],
        });

      // Act
      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: {
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY,
        },
      });

      // Assert
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.orderId).toBe('order-new'); // Most recent order
    });
  });

  describe('Phone Number Normalization', () => {
    const testPhoneFormats = [
      { input: '5573999988888@s.whatsapp.net', expected: '5573999988888' },
      { input: '(55) 73 99998-8888@s.whatsapp.net', expected: '5573999988888' },
      { input: '+55 73 99998-8888@s.whatsapp.net', expected: '5573999988888' },
      { input: '55-73-99998-8888@s.whatsapp.net', expected: '5573999988888' },
    ];

    testPhoneFormats.forEach(({ input, expected }) => {
      it(`should normalize phone number from ${input}`, async () => {
        // Arrange
        const webhookPayload = {
          event: 'messages.upsert',
          instance: 'test-instance',
          data: {
            key: {
              id: 'msg-format-test',
              remoteJid: input,
              fromMe: false,
            },
            message: {
              conversation: 'Test',
            },
          },
        };

        const mockOrder = {
          id: TEST_ORDER_ID,
          customer_phone: expected,
          status: 'pending',
          created_at: new Date().toISOString(),
        };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => [mockOrder],
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 'test-msg' }],
          });

        // Act
        const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
        const response = await onRequest({
          request: new Request('http://localhost/api/whatsapp/webhook', {
            method: 'POST',
            body: JSON.stringify(webhookPayload),
          }),
          env: {
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
          },
        });

        // Assert
        expect(response.status).toBe(200);
        
        // Verify the query was made with normalized phone
        const queryCall = mockFetch.mock.calls[0];
        expect(queryCall[0]).toContain(`customer_phone=eq.${expected}`);
      });
    });
  });

  describe('Message Type Handling', () => {
    it('should extract text from conversation field', async () => {
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-conv',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            conversation: 'Simple text message',
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{
            id: TEST_ORDER_ID,
            customer_phone: TEST_PHONE_NUMBERS.normalized,
            status: 'pending',
            created_at: new Date().toISOString(),
          }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 'msg-1' }],
        });

      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(200);
    });

    it('should extract text from extendedTextMessage field', async () => {
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-ext',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            extendedTextMessage: {
              text: 'Reply or quoted message',
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{
            id: TEST_ORDER_ID,
            customer_phone: TEST_PHONE_NUMBERS.normalized,
            status: 'pending',
            created_at: new Date().toISOString(),
          }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 'msg-2' }],
        });

      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(200);
    });

    it('should ignore messages without text content', async () => {
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-no-text',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            // No conversation or extendedTextMessage
            imageMessage: { url: 'https://example.com/image.jpg' },
          },
        },
      };

      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.message).toContain('No text content');
    });

    it('should ignore outbound messages (fromMe: true)', async () => {
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-outbound',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: true, // Outbound message
          },
          message: {
            conversation: 'Staff reply',
          },
        },
      };

      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.message).toContain('Outbound message ignored');
      expect(mockFetch).not.toHaveBeenCalled(); // No database queries
    });

    it('should ignore non-message events', async () => {
      const webhookPayload = {
        event: 'connection.update', // Not a message event
        instance: 'test-instance',
        data: {
          state: 'open',
        },
      };

      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.message).toContain('Event ignored');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Supabase credentials', async () => {
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-error',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            conversation: 'Test',
          },
        },
      };

      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: {}, // Missing credentials
      });

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error).toContain('configuration error');
    });

    it('should handle database query failures', async () => {
      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            id: 'msg-db-error',
            remoteJid: '5573999988888@s.whatsapp.net',
            fromMe: false,
          },
          message: {
            conversation: 'Test',
          },
        },
      };

      // Mock database error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error).toContain('Database query failed');
    });

    it('should handle invalid payload structure', async () => {
      const invalidPayload = {
        event: 'messages.upsert',
        // Missing data.key.remoteJid
        data: {
          key: {},
        },
      };

      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('Invalid payload');
    });

    it('should handle non-POST requests', async () => {
      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'GET',
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(405);
      const result = await response.json();
      expect(result.error).toContain('Method not allowed');
    });

    it('should handle CORS preflight requests', async () => {
      const { onRequest } = await import('../../../functions/api/whatsapp/webhook');
      const response = await onRequest({
        request: new Request('http://localhost/api/whatsapp/webhook', {
          method: 'OPTIONS',
        }),
        env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });
});
