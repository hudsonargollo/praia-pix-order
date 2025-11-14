/**
 * Commission Calculation Utilities
 * 
 * Centralized logic for calculating waiter commissions based on order payment status.
 * Distinguishes between confirmed commissions (from paid orders) and estimated commissions
 * (from pending orders awaiting payment).
 */

import type { Order, CommissionDisplayConfig } from "@/types/commission";

/**
 * Order status categories for commission calculations
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
 * Calculate confirmed commissions from paid orders only
 * 
 * @param orders - Array of orders to calculate from
 * @returns Total confirmed commission amount (2 decimal precision)
 */
export function calculateConfirmedCommissions(orders: Order[]): number {
  const total = orders
    .filter(order => ORDER_STATUS_CATEGORIES.PAID.includes(order.status.toLowerCase()))
    .reduce((sum, order) => sum + (Number(order.total_amount) * COMMISSION_RATE), 0);
  
  return Number(total.toFixed(2));
}

/**
 * Calculate estimated commissions from pending orders
 * 
 * @param orders - Array of orders to calculate from
 * @returns Total estimated commission amount (2 decimal precision)
 */
export function calculateEstimatedCommissions(orders: Order[]): number {
  const total = orders
    .filter(order => ORDER_STATUS_CATEGORIES.PENDING.includes(order.status.toLowerCase()))
    .reduce((sum, order) => sum + (Number(order.total_amount) * COMMISSION_RATE), 0);
  
  return Number(total.toFixed(2));
}

/**
 * Get commission display configuration for an order
 * 
 * @param order - Order to get commission status for
 * @returns Display configuration with styling and tooltip information
 */
export function getCommissionStatus(order: Order): CommissionDisplayConfig {
  const status = order.status.toLowerCase();
  const commissionAmount = Number((Number(order.total_amount) * COMMISSION_RATE).toFixed(2));
  
  if (ORDER_STATUS_CATEGORIES.PAID.includes(status)) {
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
  
  if (ORDER_STATUS_CATEGORIES.PENDING.includes(status)) {
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
 * Get filtered orders by status category
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
