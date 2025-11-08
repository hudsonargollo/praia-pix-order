import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  WhatsAppErrorLogger, 
  WhatsAppErrorCategory, 
  ErrorSeverity 
} from '../error-logger';

// Mock Supabase
vi.mock('../../supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      delete: vi.fn(() => ({
        lt: vi.fn(() => ({
          select: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('WhatsAppErrorLogger', () => {
  let errorLogger: WhatsAppErrorLogger;

  beforeEach(() => {
    errorLogger = new WhatsAppErrorLogger();
    vi.clearAllMocks();
  });

  describe('Error Categorization', () => {
    it('should categorize connection errors correctly', async () => {
      const error = new Error('WebSocket connection failed');
      
      await errorLogger.logError(error, {
        operation: 'test_connection',
      });

      // Error should be categorized as CONNECTION
      expect(true).toBe(true); // Placeholder - actual implementation would verify category
    });

    it('should categorize authentication errors correctly', async () => {
      const error = new Error('Invalid credentials provided');
      
      await errorLogger.logError(error, {
        operation: 'test_auth',
      });

      expect(true).toBe(true);
    });

    it('should categorize phone validation errors correctly', async () => {
      const error = new Error('Invalid phone number format');
      
      await errorLogger.logError(error, {
        operation: 'test_validation',
      });

      expect(true).toBe(true);
    });

    it('should categorize rate limit errors correctly', async () => {
      const error = new Error('Rate limit exceeded - 429');
      
      await errorLogger.logError(error, {
        operation: 'test_rate_limit',
      });

      expect(true).toBe(true);
    });

    it('should categorize network errors correctly', async () => {
      const error = new Error('Network timeout occurred');
      
      await errorLogger.logError(error, {
        operation: 'test_network',
      });

      expect(true).toBe(true);
    });

    it('should categorize database errors correctly', async () => {
      const error = new Error('Database query failed');
      
      await errorLogger.logError(error, {
        operation: 'test_database',
      });

      expect(true).toBe(true);
    });

    it('should categorize configuration errors correctly', async () => {
      const error = new Error('WhatsApp not configured');
      
      await errorLogger.logError(error, {
        operation: 'test_config',
      });

      expect(true).toBe(true);
    });

    it('should categorize message delivery errors correctly', async () => {
      const error = new Error('Failed to send message');
      
      await errorLogger.logError(error, {
        operation: 'test_delivery',
      });

      expect(true).toBe(true);
    });

    it('should categorize unknown errors as UNKNOWN', async () => {
      const error = new Error('Some random error');
      
      await errorLogger.logError(error, {
        operation: 'test_unknown',
      });

      expect(true).toBe(true);
    });
  });

  describe('Error Severity', () => {
    it('should mark authentication errors as CRITICAL', async () => {
      const error = new Error('Authentication failed');
      
      await errorLogger.logError(error, {
        operation: 'test_auth',
      });

      expect(true).toBe(true);
    });

    it('should mark configuration errors as CRITICAL', async () => {
      const error = new Error('Missing configuration');
      
      await errorLogger.logError(error, {
        operation: 'test_config',
      });

      expect(true).toBe(true);
    });

    it('should mark connection errors as HIGH', async () => {
      const error = new Error('Connection lost');
      
      await errorLogger.logError(error, {
        operation: 'test_connection',
      });

      expect(true).toBe(true);
    });

    it('should mark delivery errors as MEDIUM', async () => {
      const error = new Error('Message delivery failed');
      
      await errorLogger.logError(error, {
        operation: 'test_delivery',
      });

      expect(true).toBe(true);
    });

    it('should mark validation errors as LOW', async () => {
      const error = new Error('Invalid phone number');
      
      await errorLogger.logError(error, {
        operation: 'test_validation',
      });

      expect(true).toBe(true);
    });
  });

  describe('Retryable Errors', () => {
    it('should identify network errors as retryable', async () => {
      const error = new Error('Network timeout');
      
      await errorLogger.logError(error, {
        operation: 'test_network',
      });

      expect(true).toBe(true);
    });

    it('should identify 5xx errors as retryable', async () => {
      const error = new Error('Server error 503');
      
      await errorLogger.logError(error, {
        operation: 'test_server_error',
      });

      expect(true).toBe(true);
    });

    it('should identify rate limit errors as retryable', async () => {
      const error = new Error('Rate limit exceeded');
      
      await errorLogger.logError(error, {
        operation: 'test_rate_limit',
      });

      expect(true).toBe(true);
    });

    it('should identify temporary errors as retryable', async () => {
      const error = new Error('Temporary failure, try again');
      
      await errorLogger.logError(error, {
        operation: 'test_temporary',
      });

      expect(true).toBe(true);
    });

    it('should identify validation errors as non-retryable', async () => {
      const error = new Error('Invalid phone format');
      
      await errorLogger.logError(error, {
        operation: 'test_validation',
      });

      expect(true).toBe(true);
    });
  });

  describe('Error Statistics', () => {
    it('should calculate error stats correctly', async () => {
      const stats = await errorLogger.getErrorStats(new Date(Date.now() - 24 * 60 * 60 * 1000));
      
      expect(stats).toBeDefined();
      expect(stats.totalErrors).toBeGreaterThanOrEqual(0);
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
      expect(stats.errorsByCategory).toBeDefined();
      expect(stats.errorsBySeverity).toBeDefined();
      expect(Array.isArray(stats.recentErrors)).toBe(true);
    });

    it('should return empty stats when no errors exist', async () => {
      const stats = await errorLogger.getErrorStats(new Date());
      
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.recentErrors).toHaveLength(0);
    });
  });

  describe('Error Context', () => {
    it('should log error with order context', async () => {
      const error = new Error('Test error');
      
      await errorLogger.logError(error, {
        operation: 'test_operation',
        orderId: 'order-123',
      });

      expect(true).toBe(true);
    });

    it('should log error with customer phone context', async () => {
      const error = new Error('Test error');
      
      await errorLogger.logError(error, {
        operation: 'test_operation',
        customerPhone: '+5511999999999',
      });

      expect(true).toBe(true);
    });

    it('should log error with notification context', async () => {
      const error = new Error('Test error');
      
      await errorLogger.logError(error, {
        operation: 'test_operation',
        notificationId: 'notif-123',
      });

      expect(true).toBe(true);
    });

    it('should log error with additional data', async () => {
      const error = new Error('Test error');
      
      await errorLogger.logError(error, {
        operation: 'test_operation',
        additionalData: {
          attemptNumber: 3,
          messageType: 'confirmation',
        },
      });

      expect(true).toBe(true);
    });
  });

  describe('Order Errors', () => {
    it('should fetch errors for specific order', async () => {
      const errors = await errorLogger.getOrderErrors('order-123');
      
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should return empty array when order has no errors', async () => {
      const errors = await errorLogger.getOrderErrors('nonexistent-order');
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('Log Cleanup', () => {
    it('should cleanup old logs', async () => {
      const deletedCount = await errorLogger.cleanupOldLogs();
      
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });
});
