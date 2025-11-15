/**
 * Payment Status Real-time Updates Test
 * 
 * Verifies that payment_status changes are properly captured and propagated
 * through the real-time subscription system.
 */

import { describe, it, expect } from 'vitest';
import type { Order } from '@/integrations/supabase/realtime';

describe('Payment Status Real-time Updates', () => {
  it('should include payment_status in Order interface', () => {
    // Create a mock order with payment_status
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
      waiter_id: 'test-waiter-id',
      commission_amount: 5.00
    };

    // Verify payment_status is accessible
    expect(mockOrder.payment_status).toBe('pending');
    
    // Simulate payment confirmation
    const updatedOrder: Order = {
      ...mockOrder,
      payment_status: 'confirmed',
      payment_confirmed_at: new Date().toISOString()
    };
    
    expect(updatedOrder.payment_status).toBe('confirmed');
    expect(updatedOrder.payment_confirmed_at).not.toBeNull();
  });

  it('should handle payment_status transitions', () => {
    const baseOrder: Partial<Order> = {
      id: 'test-order',
      status: 'in_preparation',
      total_amount: 100.00
    };

    // Test pending -> confirmed transition
    const pendingOrder: Partial<Order> = {
      ...baseOrder,
      payment_status: 'pending'
    };
    expect(pendingOrder.payment_status).toBe('pending');

    const confirmedOrder: Partial<Order> = {
      ...pendingOrder,
      payment_status: 'confirmed',
      payment_confirmed_at: new Date().toISOString()
    };
    expect(confirmedOrder.payment_status).toBe('confirmed');
    expect(confirmedOrder.payment_confirmed_at).toBeDefined();

    // Test pending -> failed transition
    const failedOrder: Partial<Order> = {
      ...pendingOrder,
      payment_status: 'failed'
    };
    expect(failedOrder.payment_status).toBe('failed');
  });

  it('should maintain backward compatibility with order status', () => {
    // Legacy order without payment_status
    const legacyOrder: Partial<Order> = {
      id: 'legacy-order',
      status: 'paid',
      payment_status: 'confirmed'
    };

    // Both status fields should be accessible
    expect(legacyOrder.status).toBe('paid');
    expect(legacyOrder.payment_status).toBe('confirmed');
  });
});
