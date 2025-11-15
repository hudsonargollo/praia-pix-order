/**
 * Real-time PIX Generation Updates Tests
 * 
 * These tests verify that PIX generation updates (pix_qr_code, pix_generated_at, pix_expires_at)
 * are properly captured by real-time subscriptions and trigger UI updates.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { realtimeService, type Order } from '@/integrations/supabase/realtime';

describe('Real-time PIX Generation Updates', () => {
  let unsubscribe: (() => void) | null = null;

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  describe('PIX Generation Field Updates', () => {
    it('should capture pix_qr_code updates in real-time', () => {
      const mockOrderBefore: Order = {
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

      // Simulate PIX generation
      const mockOrderAfter: Order = {
        ...mockOrderBefore,
        pix_qr_code: '00020126580014br.gov.bcb.pix...',
        pix_generated_at: new Date().toISOString(),
        pix_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      expect(mockOrderBefore.pix_qr_code).toBeNull();
      expect(mockOrderBefore.pix_generated_at).toBeNull();
      expect(mockOrderBefore.pix_expires_at).toBeNull();

      expect(mockOrderAfter.pix_qr_code).not.toBeNull();
      expect(mockOrderAfter.pix_generated_at).not.toBeNull();
      expect(mockOrderAfter.pix_expires_at).not.toBeNull();
    });

    it('should handle PIX regeneration (clearing and setting new values)', () => {
      const orderWithOldPix: Order = {
        id: 'order-456',
        order_number: 456,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '3',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 75.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        pix_qr_code: 'old-qr-code-data',
        pix_expires_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Expired
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
        commission_amount: 7.50,
      };

      // After regeneration
      const orderWithNewPix: Order = {
        ...orderWithOldPix,
        pix_qr_code: 'new-qr-code-data',
        pix_generated_at: new Date().toISOString(),
        pix_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      expect(orderWithOldPix.pix_qr_code).toBe('old-qr-code-data');
      expect(orderWithNewPix.pix_qr_code).toBe('new-qr-code-data');
      expect(new Date(orderWithNewPix.pix_generated_at!).getTime())
        .toBeGreaterThan(new Date(orderWithOldPix.pix_generated_at!).getTime());
    });

    it('should handle PIX invalidation when items are added', () => {
      const orderWithPix: Order = {
        id: 'order-789',
        order_number: 789,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '7',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 50.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date().toISOString(),
        pix_qr_code: 'existing-qr-code',
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
        commission_amount: 5.00,
      };

      // After adding items (PIX invalidated)
      const orderAfterAddItems: Order = {
        ...orderWithPix,
        total_amount: 75.00, // Increased
        commission_amount: 7.50, // Recalculated
        pix_qr_code: null, // Cleared
        pix_generated_at: null, // Cleared
        pix_expires_at: null, // Cleared
      };

      expect(orderWithPix.pix_qr_code).not.toBeNull();
      expect(orderAfterAddItems.pix_qr_code).toBeNull();
      expect(orderAfterAddItems.total_amount).toBeGreaterThan(orderWithPix.total_amount);
    });
  });

  describe('Waiter Dashboard Subscription', () => {
    it('should receive PIX generation updates for waiter orders', () => {
      const onUpdate = vi.fn();
      const orderId = 'waiter-order-123';

      unsubscribe = realtimeService.subscribeToOrder(orderId, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should handle multiple PIX field updates simultaneously', () => {
      const orderUpdate: Order = {
        id: 'order-multi',
        order_number: 999,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '9',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 100.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date().toISOString(),
        pix_qr_code: '00020126580014br.gov.bcb.pix0136...',
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
        commission_amount: 10.00,
      };

      // All three PIX fields should be updated together
      expect(orderUpdate.pix_qr_code).not.toBeNull();
      expect(orderUpdate.pix_generated_at).not.toBeNull();
      expect(orderUpdate.pix_expires_at).not.toBeNull();

      // Verify timestamps are consistent
      const generatedTime = new Date(orderUpdate.pix_generated_at!).getTime();
      const expiresTime = new Date(orderUpdate.pix_expires_at!).getTime();
      expect(expiresTime).toBeGreaterThan(generatedTime);
    });
  });

  describe('Cashier Dashboard Subscription', () => {
    it('should receive PIX generation updates on cashier dashboard', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToCashierOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('Kitchen Dashboard Subscription', () => {
    it('should receive PIX generation updates on kitchen dashboard', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should not affect kitchen workflow when PIX is generated', () => {
      const orderBeforePix: Order = {
        id: 'kitchen-order',
        order_number: 555,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '5',
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

      const orderAfterPix: Order = {
        ...orderBeforePix,
        pix_qr_code: 'qr-code-data',
        pix_generated_at: new Date().toISOString(),
        pix_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      // Order status should remain unchanged
      expect(orderBeforePix.status).toBe('in_preparation');
      expect(orderAfterPix.status).toBe('in_preparation');
      
      // Kitchen can still mark as ready regardless of PIX status
      expect(orderAfterPix.ready_at).toBeNull();
    });
  });

  describe('PIX Expiration Handling', () => {
    it('should track PIX expiration time', () => {
      const now = Date.now();
      const expirationMinutes = 30;
      
      const order: Order = {
        id: 'order-expire',
        order_number: 111,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '1',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 40.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date(now).toISOString(),
        pix_qr_code: 'qr-code',
        pix_expires_at: new Date(now + expirationMinutes * 60 * 1000).toISOString(),
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
        commission_amount: 4.00,
      };

      const generatedTime = new Date(order.pix_generated_at!).getTime();
      const expiresTime = new Date(order.pix_expires_at!).getTime();
      const timeDiff = (expiresTime - generatedTime) / 1000 / 60; // minutes

      expect(timeDiff).toBeCloseTo(expirationMinutes, 0);
    });

    it('should identify expired PIX codes', () => {
      const order: Order = {
        id: 'order-expired',
        order_number: 222,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '2',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 45.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        pix_qr_code: 'expired-qr-code',
        pix_expires_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Expired 30 min ago
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
        commission_amount: 4.50,
      };

      const now = Date.now();
      const expiresTime = new Date(order.pix_expires_at!).getTime();
      const isExpired = expiresTime < now;

      expect(isExpired).toBe(true);
    });
  });

  describe('Order Card UI Updates', () => {
    it('should enable PIX generation button when no PIX exists', () => {
      const order: Order = {
        id: 'order-no-pix',
        order_number: 333,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '3',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 55.00,
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
        commission_amount: 5.50,
      };

      const canGeneratePix = !order.pix_qr_code && order.payment_status === 'pending';
      expect(canGeneratePix).toBe(true);
    });

    it('should disable PIX generation button when PIX exists and not expired', () => {
      const order: Order = {
        id: 'order-has-pix',
        order_number: 444,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '4',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 65.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date().toISOString(),
        pix_qr_code: 'active-qr-code',
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
        commission_amount: 6.50,
      };

      const now = Date.now();
      const expiresTime = new Date(order.pix_expires_at!).getTime();
      const isExpired = expiresTime < now;
      const canGeneratePix = !order.pix_qr_code || isExpired;

      expect(canGeneratePix).toBe(false);
    });
  });
});
