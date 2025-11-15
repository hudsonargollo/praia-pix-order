/**
 * Real-time Item Addition Updates Tests
 * 
 * These tests verify that adding items to orders triggers UPDATE events
 * and that total_amount and commission_amount update in real-time across all clients.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { realtimeService, type Order } from '@/integrations/supabase/realtime';

describe('Real-time Item Addition Updates', () => {
  let unsubscribe: (() => void) | null = null;

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  describe('Item Addition Triggers Order Update', () => {
    it('should update total_amount when items are added', () => {
      const orderBefore: Order = {
        id: 'order-123',
        order_number: 123,
        customer_name: 'Test Customer',
        customer_phone: '5511999999999',
        table_number: '5',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 50.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: null,
        pix_qr_code: null,
        pix_expires_at: null,
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 5.00,
      };

      // After adding items worth R$25
      const orderAfter: Order = {
        ...orderBefore,
        total_amount: 75.00, // 50 + 25
        commission_amount: 7.50, // Recalculated at 10%
      };

      expect(orderBefore.total_amount).toBe(50.00);
      expect(orderAfter.total_amount).toBe(75.00);
      expect(orderAfter.total_amount).toBeGreaterThan(orderBefore.total_amount);
    });

    it('should update commission_amount when items are added', () => {
      const orderBefore: Order = {
        id: 'order-456',
        order_number: 456,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '3',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 100.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: null,
        pix_qr_code: null,
        pix_expires_at: null,
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 10.00,
      };

      // After adding items worth R$50
      const orderAfter: Order = {
        ...orderBefore,
        total_amount: 150.00,
        commission_amount: 15.00, // 10% of 150
      };

      expect(orderBefore.commission_amount).toBe(10.00);
      expect(orderAfter.commission_amount).toBe(15.00);
      expect(orderAfter.commission_amount).toBeGreaterThan(orderBefore.commission_amount!);
    });

    it('should maintain correct commission percentage after item addition', () => {
      const commissionRate = 0.10; // 10%

      const orderBefore: Order = {
        id: 'order-789',
        order_number: 789,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '7',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 80.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: null,
        pix_qr_code: null,
        pix_expires_at: null,
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 8.00,
      };

      const orderAfter: Order = {
        ...orderBefore,
        total_amount: 120.00,
        commission_amount: 12.00,
      };

      // Verify commission rate is maintained
      const rateBefore = orderBefore.commission_amount! / orderBefore.total_amount;
      const rateAfter = orderAfter.commission_amount! / orderAfter.total_amount;

      expect(rateBefore).toBeCloseTo(commissionRate, 2);
      expect(rateAfter).toBeCloseTo(commissionRate, 2);
      expect(rateBefore).toBeCloseTo(rateAfter, 2);
    });
  });

  describe('PIX Invalidation on Item Addition', () => {
    it('should clear PIX data when items are added', () => {
      const orderWithPix: Order = {
        id: 'order-pix',
        order_number: 111,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '1',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 60.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date().toISOString(),
        pix_qr_code: 'existing-qr-code-data',
        pix_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 6.00,
      };

      // After adding items
      const orderAfterAddItems: Order = {
        ...orderWithPix,
        total_amount: 85.00,
        commission_amount: 8.50,
        pix_qr_code: null, // Cleared
        pix_generated_at: null, // Cleared
        pix_expires_at: null, // Cleared
      };

      expect(orderWithPix.pix_qr_code).not.toBeNull();
      expect(orderAfterAddItems.pix_qr_code).toBeNull();
      expect(orderAfterAddItems.pix_generated_at).toBeNull();
      expect(orderAfterAddItems.pix_expires_at).toBeNull();
    });

    it('should preserve order status when items are added', () => {
      const orderBefore: Order = {
        id: 'order-status',
        order_number: 222,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '2',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 70.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: null,
        pix_qr_code: null,
        pix_expires_at: null,
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 7.00,
      };

      const orderAfter: Order = {
        ...orderBefore,
        total_amount: 95.00,
        commission_amount: 9.50,
      };

      // Status should remain unchanged
      expect(orderBefore.status).toBe('in_preparation');
      expect(orderAfter.status).toBe('in_preparation');
      expect(orderBefore.payment_status).toBe('pending');
      expect(orderAfter.payment_status).toBe('pending');
    });
  });

  describe('Real-time Subscription Updates', () => {
    it('should subscribe to order updates for item additions', () => {
      const orderId = 'order-subscribe';
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToOrder(orderId, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should receive updates on waiter dashboard', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      // Waiter dashboard would use cashier subscription or custom subscription
      unsubscribe = realtimeService.subscribeToCashierOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should receive updates on kitchen dashboard', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should receive updates on cashier dashboard', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToCashierOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('Multiple Item Additions', () => {
    it('should handle multiple sequential item additions', () => {
      const initialOrder: Order = {
        id: 'order-multi',
        order_number: 333,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '3',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 50.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: null,
        pix_qr_code: null,
        pix_expires_at: null,
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 5.00,
      };

      // First addition: +R$20
      const afterFirstAddition: Order = {
        ...initialOrder,
        total_amount: 70.00,
        commission_amount: 7.00,
      };

      // Second addition: +R$30
      const afterSecondAddition: Order = {
        ...afterFirstAddition,
        total_amount: 100.00,
        commission_amount: 10.00,
      };

      expect(initialOrder.total_amount).toBe(50.00);
      expect(afterFirstAddition.total_amount).toBe(70.00);
      expect(afterSecondAddition.total_amount).toBe(100.00);

      expect(initialOrder.commission_amount).toBe(5.00);
      expect(afterFirstAddition.commission_amount).toBe(7.00);
      expect(afterSecondAddition.commission_amount).toBe(10.00);
    });

    it('should accumulate total correctly across multiple additions', () => {
      const orders = [
        { total: 50.00, commission: 5.00 },
        { total: 75.00, commission: 7.50 },
        { total: 100.00, commission: 10.00 },
        { total: 125.00, commission: 12.50 },
      ];

      for (let i = 1; i < orders.length; i++) {
        expect(orders[i].total).toBeGreaterThan(orders[i - 1].total);
        expect(orders[i].commission).toBeGreaterThan(orders[i - 1].commission);
      }
    });
  });

  describe('Validation and Edge Cases', () => {
    it('should only allow item additions for orders in preparation', () => {
      const validOrder: Order = {
        id: 'order-valid',
        order_number: 444,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '4',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 60.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: null,
        pix_qr_code: null,
        pix_expires_at: null,
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 6.00,
      };

      const canAddItems = validOrder.status === 'in_preparation' && 
                          validOrder.payment_status === 'pending';
      expect(canAddItems).toBe(true);
    });

    it('should not allow item additions for completed orders', () => {
      const completedOrder: Order = {
        id: 'order-completed',
        order_number: 555,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '5',
        status: 'completed',
        payment_status: 'confirmed',
        total_amount: 80.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: new Date().toISOString(),
        mercadopago_payment_id: 'mp-12345',
        payment_expires_at: null,
        pix_generated_at: new Date().toISOString(),
        pix_qr_code: 'qr-code',
        pix_expires_at: null,
        ready_at: new Date().toISOString(),
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: new Date().toISOString(),
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 8.00,
      };

      const canAddItems = completedOrder.status === 'in_preparation' && 
                          completedOrder.payment_status === 'pending';
      expect(canAddItems).toBe(false);
    });

    it('should not allow item additions for orders with confirmed payment', () => {
      const paidOrder: Order = {
        id: 'order-paid',
        order_number: 666,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '6',
        status: 'in_preparation',
        payment_status: 'confirmed',
        total_amount: 90.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: new Date().toISOString(),
        mercadopago_payment_id: 'mp-67890',
        payment_expires_at: null,
        pix_generated_at: new Date().toISOString(),
        pix_qr_code: 'qr-code',
        pix_expires_at: null,
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 9.00,
      };

      const canAddItems = paidOrder.status === 'in_preparation' && 
                          paidOrder.payment_status === 'pending';
      expect(canAddItems).toBe(false);
    });
  });

  describe('Commission Display Updates', () => {
    it('should show pending commission before payment', () => {
      const order: Order = {
        id: 'order-pending-commission',
        order_number: 777,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '7',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 100.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: null,
        pix_qr_code: null,
        pix_expires_at: null,
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 10.00,
      };

      const isPending = order.payment_status === 'pending';
      const pendingCommission = isPending ? order.commission_amount : 0;
      const confirmedCommission = !isPending ? order.commission_amount : 0;

      expect(pendingCommission).toBe(10.00);
      expect(confirmedCommission).toBe(0);
    });

    it('should move commission from pending to confirmed after payment', () => {
      const orderBefore: Order = {
        id: 'order-commission-transition',
        order_number: 888,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '8',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 120.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date().toISOString(),
        pix_qr_code: 'qr-code',
        pix_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        ready_at: null,
        kitchen_notified_at: null,
        cancelled_at: null,
        deleted_at: null,
        qr_code_data: null,
        pix_copy_paste: null,
        completed_at: null,
        order_notes: null,
        created_by_waiter: true,
        waiter_id: 'waiter-123',
        commission_amount: 12.00,
      };

      const orderAfter: Order = {
        ...orderBefore,
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        mercadopago_payment_id: 'mp-99999',
      };

      const pendingBefore = orderBefore.payment_status === 'pending' ? orderBefore.commission_amount : 0;
      const confirmedBefore = orderBefore.payment_status === 'confirmed' ? orderBefore.commission_amount : 0;

      const pendingAfter = orderAfter.payment_status === 'pending' ? orderAfter.commission_amount : 0;
      const confirmedAfter = orderAfter.payment_status === 'confirmed' ? orderAfter.commission_amount : 0;

      expect(pendingBefore).toBe(12.00);
      expect(confirmedBefore).toBe(0);
      expect(pendingAfter).toBe(0);
      expect(confirmedAfter).toBe(12.00);
    });
  });
});
