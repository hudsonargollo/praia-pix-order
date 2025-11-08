import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OptOutManager } from '../opt-out-manager';
import { supabase } from '../../supabase/client';

// Mock supabase
vi.mock('../../supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock phone encryption
vi.mock('../phone-encryption', () => ({
  encryptPhoneNumberSafe: vi.fn((phone) => Promise.resolve(`encrypted_${phone}`)),
  decryptPhoneNumberSafe: vi.fn((phone) => Promise.resolve(phone.replace('encrypted_', ''))),
}));

// Mock phone validator
vi.mock('../phone-validator', () => ({
  validatePhoneNumber: vi.fn((phone) => ({
    isValid: phone.startsWith('+55'),
    formattedNumber: phone,
    error: phone.startsWith('+55') ? undefined : 'Invalid phone number',
  })),
}));

describe('OptOutManager', () => {
  let optOutManager: OptOutManager;
  let mockFrom: any;
  let mockSelect: any;
  let mockEq: any;
  let mockUpsert: any;
  let mockDelete: any;
  let mockOrder: any;

  beforeEach(() => {
    optOutManager = new OptOutManager();
    
    // Reset mocks
    mockOrder = vi.fn().mockReturnThis();
    mockEq = vi.fn().mockReturnThis();
    mockSelect = vi.fn().mockReturnThis();
    mockUpsert = vi.fn().mockReturnThis();
    mockDelete = vi.fn().mockReturnThis();
    
    mockFrom = vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
    }));

    (supabase.from as any) = mockFrom;
  });

  describe('isOptedOut', () => {
    it('should return true when phone number is opted out', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null,
          }),
        }),
      });

      const result = await optOutManager.isOptedOut('+5511987654321');
      expect(result).toBe(true);
    });

    it('should return false when phone number is not opted out', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await optOutManager.isOptedOut('+5511987654321');
      expect(result).toBe(false);
    });

    it('should return false for invalid phone numbers', async () => {
      const result = await optOutManager.isOptedOut('invalid');
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      const result = await optOutManager.isOptedOut('+5511987654321');
      expect(result).toBe(false);
    });
  });

  describe('optOut', () => {
    it('should add phone number to opt-out list', async () => {
      mockUpsert.mockResolvedValue({ error: null });

      await expect(
        optOutManager.optOut('+5511987654321', 'Customer request')
      ).resolves.not.toThrow();

      expect(mockFrom).toHaveBeenCalledWith('whatsapp_opt_outs');
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('should throw error for invalid phone number', async () => {
      await expect(
        optOutManager.optOut('invalid', 'Test')
      ).rejects.toThrow('Invalid phone number');
    });

    it('should handle opt-out without reason', async () => {
      mockUpsert.mockResolvedValue({ error: null });

      await expect(
        optOutManager.optOut('+5511987654321')
      ).resolves.not.toThrow();
    });

    it('should handle database errors', async () => {
      mockUpsert.mockResolvedValue({
        error: new Error('Database error'),
      });

      await expect(
        optOutManager.optOut('+5511987654321')
      ).rejects.toThrow();
    });
  });

  describe('optIn', () => {
    it('should remove phone number from opt-out list', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await expect(
        optOutManager.optIn('+5511987654321')
      ).resolves.not.toThrow();

      expect(mockFrom).toHaveBeenCalledWith('whatsapp_opt_outs');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error for invalid phone number', async () => {
      await expect(
        optOutManager.optIn('invalid')
      ).rejects.toThrow('Invalid phone number');
    });

    it('should handle database errors', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: new Error('Database error'),
        }),
      });

      await expect(
        optOutManager.optIn('+5511987654321')
      ).rejects.toThrow();
    });
  });

  describe('getAllOptOuts', () => {
    it('should return all opt-out records', async () => {
      const mockData = [
        {
          id: '1',
          customer_phone: 'encrypted_+5511987654321',
          opted_out_at: '2024-01-01T00:00:00Z',
          reason: 'Test reason',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSelect.mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const result = await optOutManager.getAllOptOuts();

      expect(result).toHaveLength(1);
      expect(result[0].customerPhone).toBe('+5511987654321');
      expect(result[0].reason).toBe('Test reason');
    });

    it('should return empty array on database error', async () => {
      mockSelect.mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      });

      const result = await optOutManager.getAllOptOuts();
      expect(result).toEqual([]);
    });
  });

  describe('getOptOutStats', () => {
    it('should calculate opt-out statistics', async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const mockData = [
        { opted_out_at: today.toISOString() },
        { opted_out_at: weekAgo.toISOString() },
        { opted_out_at: monthAgo.toISOString() },
      ];

      mockSelect.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const stats = await optOutManager.getOptOutStats();

      expect(stats.totalOptOuts).toBe(3);
      expect(stats.optOutsToday).toBeGreaterThanOrEqual(1);
      expect(stats.optOutsThisWeek).toBeGreaterThanOrEqual(2);
      expect(stats.optOutsThisMonth).toBe(3);
    });

    it('should return zero stats on error', async () => {
      mockSelect.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const stats = await optOutManager.getOptOutStats();

      expect(stats.totalOptOuts).toBe(0);
      expect(stats.optOutsToday).toBe(0);
      expect(stats.optOutsThisWeek).toBe(0);
      expect(stats.optOutsThisMonth).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete opt-out flow', async () => {
      // Mock opt-out
      mockUpsert.mockResolvedValue({ error: null });
      await optOutManager.optOut('+5511987654321', 'Test');

      // Mock check
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null,
          }),
        }),
      });
      const isOptedOut = await optOutManager.isOptedOut('+5511987654321');
      expect(isOptedOut).toBe(true);

      // Mock opt-in
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      await optOutManager.optIn('+5511987654321');

      // Mock check again
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
      const isOptedOutAfter = await optOutManager.isOptedOut('+5511987654321');
      expect(isOptedOutAfter).toBe(false);
    });
  });
});
