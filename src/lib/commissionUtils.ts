/**
 * Commission Calculation Utilities
 * 
 * Centralized logic for calculating waiter commissions based on order payment status.
 * Distinguishes between confirmed commissions (from paid orders) and estimated commissions
 * (from pending orders awaiting payment).
 */

import type { Order, CommissionDisplayConfig } from "@/types/commission";

/**
 * Payment status categories for commission calculations
 */
export const PAYMENT_STATUS_CATEGORIES = {
  /** Orders with confirmed payment - commissions are earned */
  CONFIRMED: ['confirmed'] as readonly string[],
  
  /** Orders awaiting payment - commissions are estimated */
  PENDING: ['pending'] as readonly string[],
  
  /** Orders that don't generate commissions */
  EXCLUDED: ['failed', 'refunded', 'cancelled'] as readonly string[]
} as const;

/**
 * Order status categories for commission calculations (legacy support)
 */
export const ORDER_STATUS_CATEGORIES = {
  /** Orders with confirmed payment - commissions are earned */
  PAID: ['paid', 'completed'] as readonly string[],
  
  /** Orders awaiting payment - commissions are estimated */
  PENDING: ['pending', 'pending_payment', 'in_preparation', 'ready'] as readonly string[],
  
  /** Orders that don't generate commissions */
  EXCLUDED: ['cancelled', 'expired'] as readonly string[]
} as const;

/**
 * Commission rate constant (10%)
 */
export const COMMISSION_RATE = 0.1;

/**
 * Calculate confirmed commissions from orders with confirmed payment status only
 * 
 * @param orders - Array of orders to calculate from
 * @returns Total confirmed commission amount (2 decimal precision)
 */
export function calculateConfirmedCommissions(orders: Order[]): number {
  const total = orders
    .filter(order => {
      // Use payment_status if available, otherwise fall back to order status
      const paymentStatus = order.payment_status?.toLowerCase();
      if (paymentStatus) {
        return PAYMENT_STATUS_CATEGORIES.CONFIRMED.includes(paymentStatus);
      }
      // Legacy: use order status
      return ORDER_STATUS_CATEGORIES.PAID.includes(order.status.toLowerCase());
    })
    .reduce((sum, order) => sum + (Number(order.total_amount) * COMMISSION_RATE), 0);
  
  return Number(total.toFixed(2));
}

/**
 * Calculate estimated commissions from orders with pending payment status
 * 
 * @param orders - Array of orders to calculate from
 * @returns Total estimated commission amount (2 decimal precision)
 */
export function calculateEstimatedCommissions(orders: Order[]): number {
  const total = orders
    .filter(order => {
      // Use payment_status if available, otherwise fall back to order status
      const paymentStatus = order.payment_status?.toLowerCase();
      if (paymentStatus) {
        return PAYMENT_STATUS_CATEGORIES.PENDING.includes(paymentStatus);
      }
      // Legacy: use order status
      return ORDER_STATUS_CATEGORIES.PENDING.includes(order.status.toLowerCase());
    })
    .reduce((sum, order) => sum + (Number(order.total_amount) * COMMISSION_RATE), 0);
  
  return Number(total.toFixed(2));
}

/**
 * Calculate pending commissions from orders with pending payment status
 * Alias for calculateEstimatedCommissions for clarity in different contexts
 * 
 * @param orders - Array of orders to calculate from
 * @returns Total pending commission amount (2 decimal precision)
 */
export function calculatePendingCommissions(orders: Order[]): number {
  return calculateEstimatedCommissions(orders);
}

/**
 * Get commission display configuration for an order
 * 
 * @param order - Order to get commission status for
 * @returns Display configuration with styling and tooltip information
 */
export function getCommissionStatus(order: Order): CommissionDisplayConfig {
  const paymentStatus = order.payment_status?.toLowerCase();
  const orderStatus = order.status.toLowerCase();
  const commissionAmount = Number((Number(order.total_amount) * COMMISSION_RATE).toFixed(2));
  
  // Use payment_status if available
  if (paymentStatus) {
    if (PAYMENT_STATUS_CATEGORIES.CONFIRMED.includes(paymentStatus)) {
      return {
        amount: commissionAmount,
        displayAmount: commissionAmount.toLocaleString("pt-BR", { 
          style: "currency", 
          currency: "BRL" 
        }),
        status: 'confirmed',
        className: 'text-green-600 font-semibold',
        icon: 'CheckCircle',
        tooltip: 'Comissão confirmada - pagamento recebido'
      };
    }
    
    if (PAYMENT_STATUS_CATEGORIES.PENDING.includes(paymentStatus)) {
      return {
        amount: commissionAmount,
        displayAmount: commissionAmount.toLocaleString("pt-BR", { 
          style: "currency", 
          currency: "BRL" 
        }),
        status: 'pending',
        className: 'text-yellow-600 font-semibold',
        icon: 'Clock',
        tooltip: 'Comissão estimada - aguardando pagamento'
      };
    }
    
    if (PAYMENT_STATUS_CATEGORIES.EXCLUDED.includes(paymentStatus)) {
      return {
        amount: 0,
        displayAmount: 'R$ 0,00',
        status: 'excluded',
        className: 'text-gray-400 line-through',
        icon: 'XCircle',
        tooltip: 'Pagamento falhou ou cancelado - sem comissão'
      };
    }
  }
  
  // Legacy: fall back to order status
  if (ORDER_STATUS_CATEGORIES.PAID.includes(orderStatus)) {
    return {
      amount: commissionAmount,
      displayAmount: commissionAmount.toLocaleString("pt-BR", { 
        style: "currency", 
        currency: "BRL" 
      }),
      status: 'confirmed',
      className: 'text-green-600 font-semibold',
      icon: 'CheckCircle',
      tooltip: 'Comissão confirmada'
    };
  }
  
  if (ORDER_STATUS_CATEGORIES.PENDING.includes(orderStatus)) {
    return {
      amount: commissionAmount,
      displayAmount: commissionAmount.toLocaleString("pt-BR", { 
        style: "currency", 
        currency: "BRL" 
      }),
      status: 'pending',
      className: 'text-yellow-600 font-semibold',
      icon: 'Clock',
      tooltip: 'Comissão estimada - aguardando pagamento'
    };
  }
  
  // Excluded statuses (cancelled, expired, or unknown)
  return {
    amount: 0,
    displayAmount: 'R$ 0,00',
    status: 'excluded',
    className: 'text-gray-400 line-through',
    icon: 'XCircle',
    tooltip: 'Pedido cancelado - sem comissão'
  };
}

/**
 * Get filtered orders by payment status category
 * 
 * @param orders - Array of orders to filter
 * @param category - Payment status category to filter by
 * @returns Filtered array of orders matching the category
 */
export function getOrdersByPaymentCategory(
  orders: Order[], 
  category: keyof typeof PAYMENT_STATUS_CATEGORIES
): Order[] {
  return orders.filter(order => {
    const paymentStatus = order.payment_status?.toLowerCase();
    if (paymentStatus) {
      return PAYMENT_STATUS_CATEGORIES[category].includes(paymentStatus);
    }
    // Legacy: fall back to order status
    const legacyCategory = category === 'CONFIRMED' ? 'PAID' : category;
    return ORDER_STATUS_CATEGORIES[legacyCategory as keyof typeof ORDER_STATUS_CATEGORIES]?.includes(order.status.toLowerCase()) || false;
  });
}

/**
 * Get filtered orders by status category (legacy support)
 * 
 * @param orders - Array of orders to filter
 * @param category - Status category to filter by
 * @returns Filtered array of orders matching the category
 */
export function getOrdersByCategory(
  orders: Order[], 
  category: keyof typeof ORDER_STATUS_CATEGORIES
): Order[] {
  return orders.filter(order => 
    ORDER_STATUS_CATEGORIES[category].includes(order.status.toLowerCase())
  );
}
