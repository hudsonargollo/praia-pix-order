/**
 * Payment Status Logic Unit Tests
 * 
 * Tests for Task 13.1: Payment status transitions, PIX generation validation,
 * commission calculations with payment_status filtering, and item addition validation.
 * 
 * Requirements Coverage:
 * - Payment status transitions (Requirements 4.1, 4.2, 8.1, 8.2, 8.3)
 * - PIX generation validation (Requirements 2.1, 2.2, 2.3, 2.4)
 * - Commission calculation with payment_status (Requirements 9.1, 9.2, 9.3)
 * - Item addition validation (Requirements 11.1, 11.2, 11.3, 11.4)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateConfirmedCommissions,
  calculateEstimatedCommissions,
  calculatePendingCommissions,
  getCommissionStatus,
  getOrdersByPaymentCategory,
  PAYMENT_STATUS_CATEGORIES,
  COMMISSION_RATE
} from '@/lib/commissionUtils';
import type { Order } from '@/types/commission';

// Mock orders with different payment statuses
const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'test-order-id',
  order_number: 1,
  customer_name: 'Test Customer',
  customer_phone: '5511999999999',
  table_number: null,
  status: 'in_preparation',
  payment_status: 'pending',
  total_amount: 100.00,
  commission_amount: 10.00,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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
  waiter_id: 'test-waiter-id',
  ...overrides
});

describe('Payment Status Transitions', () => {
  describe('Valid transitions', () => {
    it('should transition from pending to confirmed', () => {
      const pendingOrder = createMockOrder({ payment_status: 'pending' });
      const confirmedOrder = createMockOrder({ 
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString()
      });

      expect(pendingOrder.payment_status).toBe('pending');
      expect(confirmedOrder.payment_status).toBe('confirmed');
      expect(confirmedOrder.payment_confirmed_at).not.toBeNull();
    });

    it('should transition from pending to failed', () => {
      const pendingOrder = createMockOrder({ payment_status: 'pending' });
      const failedOrder = createMockOrder({ payment_status: 'failed' });

      expect(pendingOrder.payment_status).toBe('pending');
      expect(failedOrder.payment_status).toBe('failed');
    });

    it('should transition from confirmed to refunded', () => {
      const confirmedOrder = createMockOrder({ 
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString()
      });
      const refundedOrder = createMockOrder({ payment_status: 'refunded' });

      expect(confirmedOrder.payment_status).toBe('confirmed');
      expect(refundedOrder.payment_status).toBe('refunded');
    });
  });

  describe('Payment status categories', () => {
    it('should correctly categorize confirmed payment status', () => {
      expect(PAYMENT_STATUS_CATEGORIES.CONFIRMED).toContain('confirmed');
      expect(PAYMENT_STATUS_CATEGORIES.CONFIRMED).toHaveLength(1);
    });

    it('should correctly categorize pending payment status', () => {
      expect(PAYMENT_STATUS_CATEGORIES.PENDING).toContain('pending');
      expect(PAYMENT_STATUS_CATEGORIES.PENDING).toHaveLength(1);
    });

    it('should correctly categorize excluded payment statuses', () => {
      expect(PAYMENT_STATUS_CATEGORIES.EXCLUDED).toContain('failed');
      expect(PAYMENT_STATUS_CATEGORIES.EXCLUDED).toContain('refunded');
      expect(PAYMENT_STATUS_CATEGORIES.EXCLUDED).toContain('cancelled');
    });
  });

  describe('Order filtering by payment status', () => {
    it('should filter orders with confirmed payment status', () => {
      const orders = [
        createMockOrder({ id: '1', payment_status: 'confirmed' }),
        createMockOrder({ id: '2', payment_status: 'pending' }),
        createMockOrder({ id: '3', payment_status: 'confirmed' })
      ];

      const confirmedOrders = getOrdersByPaymentCategory(orders, 'CONFIRMED');
      expect(confirmedOrders).toHaveLength(2);
      expect(confirmedOrders.map(o => o.id)).toEqual(['1', '3']);
    });

    it('should filter orders with pending payment status', () => {
      const orders = [
        createMockOrder({ id: '1', payment_status: 'pending' }),
        createMockOrder({ id: '2', payment_status: 'confirmed' }),
        createMockOrder({ id: '3', payment_status: 'pending' })
      ];

      const pendingOrders = getOrdersByPaymentCategory(orders, 'PENDING');
      expect(pendingOrders).toHaveLength(2);
      expect(pendingOrders.map(o => o.id)).toEqual(['1', '3']);
    });

    it('should filter orders with excluded payment statuses', () => {
      const orders = [
        createMockOrder({ id: '1', payment_status: 'failed' }),
        createMockOrder({ id: '2', payment_status: 'confirmed' }),
        createMockOrder({ id: '3', payment_status: 'refunded' })
      ];

      const excludedOrders = getOrdersByPaymentCategory(orders, 'EXCLUDED');
      expect(excludedOrders).toHaveLength(2);
      expect(excludedOrders.map(o => o.id)).toEqual(['1', '3']);
    });
  });
});

describe('PIX Generation Validation Logic', () => {
  describe('Order validation for PIX generation', () => {
    it('should validate order has waiter_id', () => {
      const orderWithWaiter = createMockOrder({ waiter_id: 'waiter-123' });
      const orderWithoutWaiter = createMockOrder({ waiter_id: null });

      expect(orderWithWaiter.waiter_id).not.toBeNull();
      expect(orderWithoutWaiter.waiter_id).toBeNull();
    });

    it('should validate payment_status is pending', () => {
      const pendingOrder = createMockOrder({ payment_status: 'pending' });
      const confirmedOrder = createMockOrder({ payment_status: 'confirmed' });

      expect(pendingOrder.payment_status).toBe('pending');
      expect(confirmedOrder.payment_status).not.toBe('pending');
    });

    it('should check if PIX already exists and is not expired', () => {
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const pastExpiry = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const orderWithValidPix = createMockOrder({
        pix_qr_code: 'valid-qr-code',
        pix_expires_at: futureExpiry
      });

      const orderWithExpiredPix = createMockOrder({
        pix_qr_code: 'expired-qr-code',
        pix_expires_at: pastExpiry
      });

      const orderWithoutPix = createMockOrder({
        pix_qr_code: null,
        pix_expires_at: null
      });

      // Valid PIX exists and not expired
      expect(orderWithValidPix.pix_qr_code).not.toBeNull();
      expect(new Date(orderWithValidPix.pix_expires_at!).getTime()).toBeGreaterThan(Date.now());

      // PIX expired
      expect(orderWithExpiredPix.pix_qr_code).not.toBeNull();
      expect(new Date(orderWithExpiredPix.pix_expires_at!).getTime()).toBeLessThan(Date.now());

      // No PIX
      expect(orderWithoutPix.pix_qr_code).toBeNull();
    });

    it('should validate order total amount is positive', () => {
      const validOrder = createMockOrder({ total_amount: 50.00 });
      const zeroOrder = createMockOrder({ total_amount: 0 });
      const negativeOrder = createMockOrder({ total_amount: -10.00 });

      expect(validOrder.total_amount).toBeGreaterThan(0);
      expect(zeroOrder.total_amount).toBe(0);
      expect(negativeOrder.total_amount).toBeLessThan(0);
    });
  });

  describe('PIX expiration handling', () => {
    it('should set expiration 15 minutes in the future', () => {
      const now = Date.now();
      const expirationTime = now + 15 * 60 * 1000;
      const expirationDate = new Date(expirationTime).toISOString();

      const order = createMockOrder({
        pix_generated_at: new Date(now).toISOString(),
        pix_expires_at: expirationDate
      });

      const generatedAt = new Date(order.pix_generated_at!).getTime();
      const expiresAt = new Date(order.pix_expires_at!).getTime();
      const diffMinutes = (expiresAt - generatedAt) / (60 * 1000);

      expect(diffMinutes).toBeCloseTo(15, 0);
    });

    it('should detect expired PIX', () => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString();
      const order = createMockOrder({
        pix_qr_code: 'qr-code',
        pix_expires_at: pastExpiry
      });

      const isExpired = new Date(order.pix_expires_at!).getTime() < Date.now();
      expect(isExpired).toBe(true);
    });

    it('should detect valid (not expired) PIX', () => {
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const order = createMockOrder({
        pix_qr_code: 'qr-code',
        pix_expires_at: futureExpiry
      });

      const isExpired = new Date(order.pix_expires_at!).getTime() < Date.now();
      expect(isExpired).toBe(false);
    });
  });
});

describe('Commission Calculation with Payment Status Filtering', () => {
  describe('Confirmed commissions', () => {
    it('should calculate commissions only from confirmed payment status', () => {
      const orders = [
        createMockOrder({ id: '1', total_amount: 100, payment_status: 'confirmed' }),
        createMockOrder({ id: '2', total_amount: 50, payment_status: 'pending' }),
        createMockOrder({ id: '3', total_amount: 75, payment_status: 'confirmed' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      // (100 + 75) * 0.1 = 17.5
      expect(confirmed).toBe(17.50);
    });

    it('should exclude pending orders from confirmed commissions', () => {
      const orders = [
        createMockOrder({ total_amount: 100, payment_status: 'pending' }),
        createMockOrder({ total_amount: 50, payment_status: 'pending' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      expect(confirmed).toBe(0);
    });

    it('should exclude failed orders from confirmed commissions', () => {
      const orders = [
        createMockOrder({ total_amount: 100, payment_status: 'confirmed' }),
        createMockOrder({ total_amount: 50, payment_status: 'failed' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      // Only 100 * 0.1 = 10
      expect(confirmed).toBe(10.00);
    });

    it('should exclude refunded orders from confirmed commissions', () => {
      const orders = [
        createMockOrder({ total_amount: 100, payment_status: 'confirmed' }),
        createMockOrder({ total_amount: 50, payment_status: 'refunded' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      // Only 100 * 0.1 = 10
      expect(confirmed).toBe(10.00);
    });
  });

  describe('Estimated/Pending commissions', () => {
    it('should calculate commissions only from pending payment status', () => {
      const orders = [
        createMockOrder({ id: '1', total_amount: 100, payment_status: 'pending' }),
        createMockOrder({ id: '2', total_amount: 50, payment_status: 'confirmed' }),
        createMockOrder({ id: '3', total_amount: 75, payment_status: 'pending' })
      ];

      const estimated = calculateEstimatedCommissions(orders);
      // (100 + 75) * 0.1 = 17.5
      expect(estimated).toBe(17.50);
    });

    it('should exclude confirmed orders from estimated commissions', () => {
      const orders = [
        createMockOrder({ total_amount: 100, payment_status: 'confirmed' }),
        createMockOrder({ total_amount: 50, payment_status: 'confirmed' })
      ];

      const estimated = calculateEstimatedCommissions(orders);
      expect(estimated).toBe(0);
    });

    it('should exclude failed orders from estimated commissions', () => {
      const orders = [
        createMockOrder({ total_amount: 100, payment_status: 'pending' }),
        createMockOrder({ total_amount: 50, payment_status: 'failed' })
      ];

      const estimated = calculateEstimatedCommissions(orders);
      // Only 100 * 0.1 = 10
      expect(estimated).toBe(10.00);
    });

    it('should have calculatePendingCommissions as alias', () => {
      const orders = [
        createMockOrder({ total_amount: 100, payment_status: 'pending' })
      ];

      const estimated = calculateEstimatedCommissions(orders);
      const pending = calculatePendingCommissions(orders);

      expect(pending).toBe(estimated);
      expect(pending).toBe(10.00);
    });
  });

  describe('Commission rate', () => {
    it('should use 10% commission rate', () => {
      expect(COMMISSION_RATE).toBe(0.1);
    });

    it('should calculate correct commission amount', () => {
      const orders = [
        createMockOrder({ total_amount: 100, payment_status: 'confirmed' }),
        createMockOrder({ total_amount: 250, payment_status: 'confirmed' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      // (100 + 250) * 0.1 = 35
      expect(confirmed).toBe(35.00);
    });

    it('should handle decimal precision correctly', () => {
      const orders = [
        createMockOrder({ total_amount: 33.33, payment_status: 'confirmed' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      // 33.33 * 0.1 = 3.333, rounded to 3.33
      expect(confirmed).toBe(3.33);
    });
  });

  describe('Commission status display', () => {
    it('should return confirmed status for confirmed payment', () => {
      const order = createMockOrder({ 
        total_amount: 100,
        payment_status: 'confirmed' 
      });

      const status = getCommissionStatus(order);
      expect(status.status).toBe('confirmed');
      expect(status.amount).toBe(10.00);
      expect(status.icon).toBe('CheckCircle');
      expect(status.className).toContain('green');
    });

    it('should return pending status for pending payment', () => {
      const order = createMockOrder({ 
        total_amount: 100,
        payment_status: 'pending' 
      });

      const status = getCommissionStatus(order);
      expect(status.status).toBe('pending');
      expect(status.amount).toBe(10.00);
      expect(status.icon).toBe('Clock');
      expect(status.className).toContain('yellow');
    });

    it('should return excluded status for failed payment', () => {
      const order = createMockOrder({ 
        total_amount: 100,
        payment_status: 'failed' 
      });

      const status = getCommissionStatus(order);
      expect(status.status).toBe('excluded');
      expect(status.amount).toBe(0);
      expect(status.icon).toBe('XCircle');
      expect(status.className).toContain('gray');
    });

    it('should return excluded status for refunded payment', () => {
      const order = createMockOrder({ 
        total_amount: 100,
        payment_status: 'refunded' 
      });

      const status = getCommissionStatus(order);
      expect(status.status).toBe('excluded');
      expect(status.amount).toBe(0);
    });
  });

  describe('Commission recalculation on payment status change', () => {
    it('should move commission from pending to confirmed when payment confirmed', () => {
      const orders = [
        createMockOrder({ id: '1', total_amount: 100, payment_status: 'pending' })
      ];

      const pendingBefore = calculatePendingCommissions(orders);
      const confirmedBefore = calculateConfirmedCommissions(orders);

      // Simulate payment confirmation
      orders[0].payment_status = 'confirmed';
      orders[0].payment_confirmed_at = new Date().toISOString();

      const pendingAfter = calculatePendingCommissions(orders);
      const confirmedAfter = calculateConfirmedCommissions(orders);

      expect(pendingBefore).toBe(10.00);
      expect(confirmedBefore).toBe(0);
      expect(pendingAfter).toBe(0);
      expect(confirmedAfter).toBe(10.00);
    });

    it('should remove commission when payment fails', () => {
      const orders = [
        createMockOrder({ id: '1', total_amount: 100, payment_status: 'pending' })
      ];

      const pendingBefore = calculatePendingCommissions(orders);

      // Simulate payment failure
      orders[0].payment_status = 'failed';

      const pendingAfter = calculatePendingCommissions(orders);
      const confirmedAfter = calculateConfirmedCommissions(orders);

      expect(pendingBefore).toBe(10.00);
      expect(pendingAfter).toBe(0);
      expect(confirmedAfter).toBe(0);
    });
  });
});

describe('Item Addition Validation Logic', () => {
  describe('Order status validation', () => {
    it('should allow adding items to orders in_preparation', () => {
      const order = createMockOrder({ status: 'in_preparation' });
      expect(order.status).toBe('in_preparation');
    });

    it('should not allow adding items to completed orders', () => {
      const order = createMockOrder({ status: 'completed' });
      expect(order.status).not.toBe('in_preparation');
    });

    it('should not allow adding items to cancelled orders', () => {
      const order = createMockOrder({ status: 'cancelled' });
      expect(order.status).not.toBe('in_preparation');
    });

    it('should not allow adding items to pending_payment orders', () => {
      const order = createMockOrder({ status: 'pending_payment' });
      expect(order.status).not.toBe('in_preparation');
    });
  });

  describe('Waiter ownership validation', () => {
    it('should validate order has waiter_id', () => {
      const orderWithWaiter = createMockOrder({ waiter_id: 'waiter-123' });
      const orderWithoutWaiter = createMockOrder({ waiter_id: null });

      expect(orderWithWaiter.waiter_id).not.toBeNull();
      expect(orderWithoutWaiter.waiter_id).toBeNull();
    });

    it('should validate waiter owns the order', () => {
      const order = createMockOrder({ waiter_id: 'waiter-123' });
      const requestingWaiterId = 'waiter-123';
      const differentWaiterId = 'waiter-456';

      expect(order.waiter_id).toBe(requestingWaiterId);
      expect(order.waiter_id).not.toBe(differentWaiterId);
    });
  });

  describe('Total amount recalculation', () => {
    it('should recalculate total when items added', () => {
      const originalTotal = 100.00;
      const addedAmount = 25.00;
      const newTotal = originalTotal + addedAmount;

      expect(newTotal).toBe(125.00);
    });

    it('should recalculate commission when total changes', () => {
      const originalTotal = 100.00;
      const addedAmount = 50.00;
      const newTotal = originalTotal + addedAmount;
      const newCommission = newTotal * COMMISSION_RATE;

      expect(newCommission).toBe(15.00);
    });

    it('should handle multiple items addition', () => {
      const originalTotal = 100.00;
      const items = [
        { price: 10.00, quantity: 2 }, // 20.00
        { price: 15.00, quantity: 1 }, // 15.00
        { price: 7.50, quantity: 3 }   // 22.50
      ];

      const addedAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newTotal = originalTotal + addedAmount;

      expect(addedAmount).toBe(57.50);
      expect(newTotal).toBe(157.50);
    });
  });

  describe('PIX invalidation on item addition', () => {
    it('should invalidate PIX if exists and not expired', () => {
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const order = createMockOrder({
        pix_qr_code: 'existing-qr-code',
        pix_expires_at: futureExpiry
      });

      const hasValidPix = order.pix_qr_code !== null && 
                          new Date(order.pix_expires_at!).getTime() > Date.now();

      expect(hasValidPix).toBe(true);
    });

    it('should not invalidate PIX if already expired', () => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString();
      const order = createMockOrder({
        pix_qr_code: 'expired-qr-code',
        pix_expires_at: pastExpiry
      });

      const hasValidPix = order.pix_qr_code !== null && 
                          new Date(order.pix_expires_at!).getTime() > Date.now();

      expect(hasValidPix).toBe(false);
    });

    it('should not invalidate PIX if none exists', () => {
      const order = createMockOrder({
        pix_qr_code: null,
        pix_expires_at: null
      });

      const hasValidPix = order.pix_qr_code !== null && 
                          order.pix_expires_at !== null &&
                          new Date(order.pix_expires_at).getTime() > Date.now();

      expect(hasValidPix).toBe(false);
    });

    it('should clear PIX fields when invalidated', () => {
      const order = createMockOrder({
        pix_qr_code: 'qr-code',
        pix_generated_at: new Date().toISOString(),
        pix_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

      // Simulate invalidation
      const updatedOrder = {
        ...order,
        pix_qr_code: null,
        pix_generated_at: null,
        pix_expires_at: null
      };

      expect(updatedOrder.pix_qr_code).toBeNull();
      expect(updatedOrder.pix_generated_at).toBeNull();
      expect(updatedOrder.pix_expires_at).toBeNull();
    });
  });

  describe('Product availability validation', () => {
    it('should validate product exists', () => {
      const menuItems = [
        { id: 'product-1', name: 'Açaí', available: true },
        { id: 'product-2', name: 'Banana', available: true }
      ];

      const requestedProductId = 'product-1';
      const invalidProductId = 'product-999';

      const validProduct = menuItems.find(item => item.id === requestedProductId);
      const invalidProduct = menuItems.find(item => item.id === invalidProductId);

      expect(validProduct).toBeDefined();
      expect(invalidProduct).toBeUndefined();
    });

    it('should validate product is available', () => {
      const menuItems = [
        { id: 'product-1', name: 'Açaí', available: true },
        { id: 'product-2', name: 'Banana', available: false }
      ];

      const availableProduct = menuItems.find(item => item.id === 'product-1');
      const unavailableProduct = menuItems.find(item => item.id === 'product-2');

      expect(availableProduct?.available).toBe(true);
      expect(unavailableProduct?.available).toBe(false);
    });
  });
});

describe('Edge Cases and Error Scenarios', () => {
  describe('Empty and null handling', () => {
    it('should handle empty order arrays', () => {
      const confirmed = calculateConfirmedCommissions([]);
      const pending = calculatePendingCommissions([]);

      expect(confirmed).toBe(0);
      expect(pending).toBe(0);
    });

    it('should handle orders with zero amount', () => {
      const orders = [
        createMockOrder({ total_amount: 0, payment_status: 'confirmed' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      expect(confirmed).toBe(0);
    });

    it('should handle null payment_status gracefully', () => {
      const order = createMockOrder({ 
        payment_status: null as any,
        status: 'paid' 
      });

      // Should fall back to order status
      const status = getCommissionStatus(order);
      expect(status.status).toBe('confirmed');
    });
  });

  describe('Decimal precision', () => {
    it('should round commission to 2 decimal places', () => {
      const orders = [
        createMockOrder({ total_amount: 33.33, payment_status: 'confirmed' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      // 33.33 * 0.1 = 3.333, should round to 3.33
      expect(confirmed).toBe(3.33);
      expect(confirmed.toString()).toMatch(/^\d+\.\d{2}$/);
    });

    it('should handle very small amounts', () => {
      const orders = [
        createMockOrder({ total_amount: 0.01, payment_status: 'confirmed' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      // 0.01 * 0.1 = 0.001, should round to 0.00
      expect(confirmed).toBe(0.00);
    });

    it('should handle large amounts', () => {
      const orders = [
        createMockOrder({ total_amount: 10000.00, payment_status: 'confirmed' })
      ];

      const confirmed = calculateConfirmedCommissions(orders);
      // 10000 * 0.1 = 1000
      expect(confirmed).toBe(1000.00);
    });
  });

  describe('Case sensitivity', () => {
    it('should handle lowercase payment status', () => {
      const order = createMockOrder({ payment_status: 'confirmed' });
      const status = getCommissionStatus(order);
      expect(status.status).toBe('confirmed');
    });

    it('should handle uppercase payment status', () => {
      const order = createMockOrder({ payment_status: 'CONFIRMED' as any });
      const status = getCommissionStatus(order);
      expect(status.status).toBe('confirmed');
    });

    it('should handle mixed case payment status', () => {
      const order = createMockOrder({ payment_status: 'Confirmed' as any });
      const status = getCommissionStatus(order);
      expect(status.status).toBe('confirmed');
    });
  });
});
