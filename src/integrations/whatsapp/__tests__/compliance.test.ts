import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppComplianceChecker } from '../compliance';

describe('WhatsAppComplianceChecker', () => {
  describe('checkMessageCompliance', () => {
    it('should pass for valid messages', () => {
      const message = 'Olá! Seu pedido #123 foi confirmado e está sendo preparado.';
      const result = WhatsAppComplianceChecker.checkMessageCompliance(message);

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail for empty messages', () => {
      const result = WhatsAppComplianceChecker.checkMessageCompliance('');

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('Message cannot be empty');
    });

    it('should fail for messages exceeding maximum length', () => {
      const longMessage = 'a'.repeat(5000);
      const result = WhatsAppComplianceChecker.checkMessageCompliance(longMessage);

      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain('exceeds maximum length');
    });

    it('should warn for messages exceeding recommended length', () => {
      const longMessage = 'a'.repeat(1500);
      const result = WhatsAppComplianceChecker.checkMessageCompliance(longMessage);

      expect(result.isCompliant).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('longer than recommended');
    });

    it('should warn for excessive capitalization', () => {
      const message = 'URGENT!!! YOUR ORDER IS READY NOW!!!';
      const result = WhatsAppComplianceChecker.checkMessageCompliance(message);

      expect(result.warnings.some(w => w.includes('capitalization'))).toBe(true);
    });

    it('should warn for excessive punctuation', () => {
      const message = 'Your order is ready!!! Come pick it up now!!!';
      const result = WhatsAppComplianceChecker.checkMessageCompliance(message);

      expect(result.warnings.some(w => w.includes('punctuation'))).toBe(true);
    });

    it('should warn for multiple URLs', () => {
      const message = 'Check https://example.com and https://test.com and https://demo.com and https://site.com';
      const result = WhatsAppComplianceChecker.checkMessageCompliance(message);

      expect(result.warnings.some(w => w.includes('URLs'))).toBe(true);
    });

    it('should handle normal messages with single URL', () => {
      const message = 'Track your order at https://example.com/track/123';
      const result = WhatsAppComplianceChecker.checkMessageCompliance(message);

      expect(result.isCompliant).toBe(true);
      expect(result.warnings.filter(w => w.includes('URLs'))).toHaveLength(0);
    });
  });

  describe('isNotificationTypeAllowed', () => {
    it('should allow valid notification types', () => {
      const validTypes = ['payment_confirmed', 'preparing', 'ready', 'custom'];

      validTypes.forEach(type => {
        expect(WhatsAppComplianceChecker.isNotificationTypeAllowed(type)).toBe(true);
      });
    });

    it('should reject invalid notification types', () => {
      const invalidTypes = ['spam', 'marketing', 'promotional', 'invalid'];

      invalidTypes.forEach(type => {
        expect(WhatsAppComplianceChecker.isNotificationTypeAllowed(type)).toBe(false);
      });
    });
  });

  describe('isAppropriateTime', () => {
    it('should warn for late night hours', () => {
      // Mock current time to 11 PM
      const mockDate = new Date();
      mockDate.setHours(23, 0, 0, 0);
      vi.setSystemTime(mockDate);

      const result = WhatsAppComplianceChecker.isAppropriateTime();

      expect(result.isCompliant).toBe(true); // Not a hard violation
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('outside business hours');

      vi.useRealTimers();
    });

    it('should warn for early morning hours', () => {
      // Mock current time to 6 AM
      const mockDate = new Date();
      mockDate.setHours(6, 0, 0, 0);
      vi.setSystemTime(mockDate);

      const result = WhatsAppComplianceChecker.isAppropriateTime();

      expect(result.isCompliant).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('should pass for business hours', () => {
      // Mock current time to 2 PM
      const mockDate = new Date();
      mockDate.setHours(14, 0, 0, 0);
      vi.setSystemTime(mockDate);

      const result = WhatsAppComplianceChecker.isAppropriateTime();

      expect(result.isCompliant).toBe(true);
      expect(result.warnings).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe('checkRateLimits', () => {
    let mockSupabase: any;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      };
    });

    it('should pass when under rate limits', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => Promise.resolve({ data: Array(5).fill({}), error: null })),
          })),
          gte: vi.fn(() => Promise.resolve({ data: Array(100).fill({}), error: null })),
        })),
      }));

      const result = await WhatsAppComplianceChecker.checkRateLimits(
        'encrypted_phone',
        mockSupabase
      );

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when customer rate limit exceeded', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => Promise.resolve({ data: Array(15).fill({}), error: null })),
          })),
          gte: vi.fn(() => Promise.resolve({ data: Array(100).fill({}), error: null })),
        })),
      }));

      const result = await WhatsAppComplianceChecker.checkRateLimits(
        'encrypted_phone',
        mockSupabase
      );

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.includes('Rate limit exceeded for customer'))).toBe(true);
    });

    it('should warn when approaching rate limits', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => Promise.resolve({ data: Array(9).fill({}), error: null })),
          })),
          gte: vi.fn(() => Promise.resolve({ data: Array(850).fill({}), error: null })),
        })),
      }));

      const result = await WhatsAppComplianceChecker.checkRateLimits(
        'encrypted_phone',
        mockSupabase
      );

      expect(result.isCompliant).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB error') })),
          })),
          gte: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB error') })),
        })),
      }));

      const result = await WhatsAppComplianceChecker.checkRateLimits(
        'encrypted_phone',
        mockSupabase
      );

      expect(result.isCompliant).toBe(true);
      expect(result.warnings.some(w => w.includes('Unable to verify'))).toBe(true);
    });
  });

  describe('checkFullCompliance', () => {
    let mockSupabase: any;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      };
    });

    it('should pass for compliant messages', async () => {
      const message = 'Seu pedido #123 está pronto para retirada!';
      const result = await WhatsAppComplianceChecker.checkFullCompliance(
        message,
        'ready',
        'encrypted_phone',
        mockSupabase
      );

      expect(result.isCompliant).toBe(true);
    });

    it('should fail for invalid notification type', async () => {
      const message = 'Test message';
      const result = await WhatsAppComplianceChecker.checkFullCompliance(
        message,
        'invalid_type',
        'encrypted_phone',
        mockSupabase
      );

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.includes('Invalid notification type'))).toBe(true);
    });

    it('should aggregate violations from multiple checks', async () => {
      const message = ''; // Empty message
      const result = await WhatsAppComplianceChecker.checkFullCompliance(
        message,
        'invalid_type',
        'encrypted_phone',
        mockSupabase
      );

      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
    });
  });

  describe('getComplianceGuidelines', () => {
    it('should return compliance guidelines', () => {
      const guidelines = WhatsAppComplianceChecker.getComplianceGuidelines();

      expect(guidelines).toBeInstanceOf(Array);
      expect(guidelines.length).toBeGreaterThan(0);
      expect(guidelines.some(g => g.includes('transactional'))).toBe(true);
      expect(guidelines.some(g => g.includes('opt-out'))).toBe(true);
    });
  });
});
