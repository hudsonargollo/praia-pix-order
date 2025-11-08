import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationTriggers } from '../notification-triggers';
import { queueManager } from '../queue-manager';
import { supabase } from '../../supabase/client';

// Mock dependencies
vi.mock('../queue-manager', () => ({
  queueManager: {
    enqueue: vi.fn(),
  },
}));

vi.mock('../../supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('NotificationTriggerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('onPaymentConfirmed', () => {
    it('should queue payment confirmation notification', async () => {
      const mockOrderData = {
        id: 'order-123',
        order_number: 1001,
        customer_name: 'João Silva',
        customer_phone: '+5511987654321',
        table_number: 5,
        total_amount: 45.50,
        status: 'paid',
        created_at: new Date().toISOString(),
        order_items: [
          {
            id: 'item-1',
            item_name: 'Açaí 500ml',
            quantity: 1,
            unit_price: 25.00,
          },
        ],
      };

      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockOrderData, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Execute
      await notificationTriggers.onPaymentConfirmed('order-123');

      // Verify
      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(queueManager.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-123',
          customerPhone: '+5511987654321',
          notificationType: 'payment_confirmed',
        })
      );
    });
  });

  describe('onOrderStatusChange', () => {
    it('should trigger payment confirmation when status changes to paid', async () => {
      const mockOrderData = {
        id: 'order-111',
        order_number: 1004,
        customer_name: 'Ana Lima',
        customer_phone: '+5511987651234',
        table_number: 2,
        total_amount: 30.00,
        status: 'paid',
        created_at: new Date().toISOString(),
        order_items: [],
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockOrderData, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await notificationTriggers.onOrderStatusChange('order-111', 'paid', 'pending_payment');

      expect(queueManager.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationType: 'payment_confirmed',
        })
      );
    });
  });
});
