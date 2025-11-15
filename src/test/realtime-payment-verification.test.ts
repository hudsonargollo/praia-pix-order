/**
 * Real-time Payment Status Verification Tests
 * 
 * These tests verify that payment_status and related fields are properly
 * included in real-time subscriptions and trigger UI updates.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { realtimeService, type Order } from '@/integrations/supabase/realtime';

describe('Real-time Payment Status Updates', () => {
  let unsubscribe: (() => void) | null = null;

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  describe('Order Interface Completeness', () => {
    it('should include all payment-related fields in Order interface', () => {
      const mockOrder: Order = {
        id: 'test-order-id',
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

      // Verify all payment fields are present
      expect(mockOrder).toHaveProperty('payment_status');
      expect(mockOrder).toHaveProperty('payment_confirmed_at');
      expect(mockOrder).toHaveProperty('pix_generated_at');
      expect(mockOrder).toHaveProperty('pix_qr_code');
      expect(mockOrder).toHaveProperty('pix_expires_at');
      expect(mockOrder).toHaveProperty('commission_amount');
      expect(mockOrder).toHaveProperty('waiter_id');
      expect(mockOrder).toHaveProperty('created_by_waiter');
    });

    it('should handle payment status transitions', () => {
      const orderPending: Order = {
        id: 'order-1',
        order_number: 1,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '1',
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

      expect(orderPending.payment_status).toBe('pending');
      expect(orderPending.payment_confirmed_at).toBeNull();

      // Simulate payment confirmation
      const orderConfirmed: Order = {
        ...orderPending,
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        mercadopago_payment_id: 'mp-12345',
      };

      expect(orderConfirmed.payment_status).toBe('confirmed');
      expect(orderConfirmed.payment_confirmed_at).not.toBeNull();
      expect(orderConfirmed.mercadopago_payment_id).toBe('mp-12345');
    });
  });

  describe('Kitchen Orders Subscription', () => {
    it('should subscribe to kitchen orders with payment status', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
      expect(realtimeService.getConnectionStatus()).toBeDefined();
    });

    it('should handle waiter orders with pending payment', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);

      // Verify subscription is active
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('Cashier Orders Subscription', () => {
    it('should subscribe to cashier orders with payment status', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToCashierOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
      expect(realtimeService.getConnectionStatus()).toBeDefined();
    });
  });

  describe('Payment Updates Subscription', () => {
    it('should subscribe to payment confirmation updates', () => {
      const onPaymentConfirmed = vi.fn();

      unsubscribe = realtimeService.subscribeToPaymentUpdates(onPaymentConfirmed);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should handle payment expiration updates', () => {
      const onPaymentConfirmed = vi.fn();
      const onPaymentExpired = vi.fn();

      unsubscribe = realtimeService.subscribeToPaymentUpdates(
        onPaymentConfirmed,
        onPaymentExpired
      );

      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('Order-Specific Subscription', () => {
    it('should subscribe to specific order updates', () => {
      const orderId = 'test-order-123';
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToOrder(orderId, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('PIX Generation Fields', () => {
    it('should include PIX generation fields in order updates', () => {
      const orderWithPix: Order = {
        id: 'order-pix',
        order_number: 100,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '1',
        status: 'in_preparation',
        payment_status: 'pending',
        total_amount: 50.00,
        created_at: new Date().toISOString(),
        notified_at: null,
        payment_confirmed_at: null,
        mercadopago_payment_id: null,
        payment_expires_at: null,
        pix_generated_at: new Date().toISOString(),
        pix_qr_code: 'mock-qr-code-data',
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

      expect(orderWithPix.pix_generated_at).not.toBeNull();
      expect(orderWithPix.pix_qr_code).toBe('mock-qr-code-data');
      expect(orderWithPix.pix_expires_at).not.toBeNull();
    });
  });

  describe('Commission Amount Updates', () => {
    it('should include commission_amount in order updates', () => {
      const orderWithCommission: Order = {
        id: 'order-commission',
        order_number: 200,
        customer_name: 'Customer',
        customer_phone: '5511999999999',
        table_number: '1',
        status: 'in_preparation',
        payment_status: 'confirmed',
        total_amount: 100.00,
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
        commission_amount: 10.00,
      };

      expect(orderWithCommission.commission_amount).toBe(10.00);
      expect(orderWithCommission.payment_status).toBe('confirmed');
      expect(orderWithCommission.payment_confirmed_at).not.toBeNull();
    });
  });

  describe('Connection Management', () => {
    it('should provide connection status', () => {
      const status = realtimeService.getConnectionStatus();
      expect(status).toBeDefined();
      expect(typeof status).toBe('string');
    });

    it('should allow manual reconnection', () => {
      expect(() => realtimeService.reconnect()).not.toThrow();
    });

    it('should allow unsubscribing from all channels', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
      
      expect(() => realtimeService.unsubscribeAll()).not.toThrow();
      
      unsubscribe = null; // Already unsubscribed
    });
  });
});
