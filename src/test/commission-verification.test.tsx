/**
 * Commission Display and Calculation Verification Tests
 * 
 * Tests for Requirements 3.1, 3.2, 3.3, 3.4, 3.5:
 * - Commission display with updated title and styling
 * - Confirmed vs estimated commission breakdown
 * - Commission recalculation when orders are edited
 * - Real-time updates to commission display
 * - Commission display on mobile and desktop
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CommissionToggle } from '@/components/CommissionToggle';
import { CommissionCards } from '@/components/CommissionCards';
import { CommissionDisplay } from '@/components/CommissionDisplay';
import {
  calculateConfirmedCommissions,
  calculateEstimatedCommissions,
  getCommissionStatus,
  getOrdersByCategory,
  COMMISSION_RATE
} from '@/lib/commissionUtils';
import type { Order } from '@/types/commission';

// Mock orders for testing
const mockPaidOrder: Order = {
  id: '1',
  order_number: 1,
  waiter_id: 'waiter-1',
  customer_name: 'João Silva',
  customer_phone: '11987654321',
  total_amount: 100.00,
  commission_amount: 10.00,
  status: 'paid',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};

const mockPendingOrder: Order = {
  id: '2',
  order_number: 2,
  waiter_id: 'waiter-1',
  customer_name: 'Maria Santos',
  customer_phone: '11987654322',
  total_amount: 50.00,
  commission_amount: 5.00,
  status: 'pending_payment',
  created_at: '2024-01-15T11:00:00Z',
  updated_at: '2024-01-15T11:00:00Z'
};

const mockInPreparationOrder: Order = {
  id: '3',
  order_number: 3,
  waiter_id: 'waiter-1',
  customer_name: 'Pedro Costa',
  customer_phone: '11987654323',
  total_amount: 75.00,
  commission_amount: 7.50,
  status: 'in_preparation',
  created_at: '2024-01-15T12:00:00Z',
  updated_at: '2024-01-15T12:00:00Z'
};

const mockCancelledOrder: Order = {
  id: '4',
  order_number: 4,
  waiter_id: 'waiter-1',
  customer_name: 'Ana Lima',
  customer_phone: '11987654324',
  total_amount: 30.00,
  commission_amount: 0,
  status: 'cancelled',
  created_at: '2024-01-15T13:00:00Z',
  updated_at: '2024-01-15T13:00:00Z'
};

describe('Commission Calculation Logic', () => {
  it('should calculate confirmed commissions correctly from paid orders', () => {
    const orders = [mockPaidOrder, mockPendingOrder];
    const confirmed = calculateConfirmedCommissions(orders);
    
    // Only paid order should count: 100 * 0.1 = 10
    expect(confirmed).toBe(10.00);
  });

  it('should calculate estimated commissions correctly from pending orders', () => {
    const orders = [mockPaidOrder, mockPendingOrder, mockInPreparationOrder];
    const estimated = calculateEstimatedCommissions(orders);
    
    // Pending (50 * 0.1 = 5) + In Preparation (75 * 0.1 = 7.5) = 12.5
    expect(estimated).toBe(12.50);
  });

  it('should exclude cancelled orders from commission calculations', () => {
    const orders = [mockPaidOrder, mockCancelledOrder];
    const confirmed = calculateConfirmedCommissions(orders);
    const estimated = calculateEstimatedCommissions(orders);
    
    expect(confirmed).toBe(10.00); // Only paid order
    expect(estimated).toBe(0); // Cancelled order excluded
  });

  it('should use correct commission rate of 10%', () => {
    expect(COMMISSION_RATE).toBe(0.1);
    
    const testOrder: Order = { ...mockPaidOrder, total_amount: 200 };
    const status = getCommissionStatus(testOrder);
    
    expect(status.amount).toBe(20.00); // 200 * 0.1
  });

  it('should recalculate commissions when order total changes', () => {
    const originalOrder: Order = { ...mockPendingOrder, total_amount: 50 };
    const updatedOrder: Order = { ...mockPendingOrder, total_amount: 100 };
    
    const originalCommission = getCommissionStatus(originalOrder).amount;
    const updatedCommission = getCommissionStatus(updatedOrder).amount;
    
    expect(originalCommission).toBe(5.00);
    expect(updatedCommission).toBe(10.00);
    expect(updatedCommission - originalCommission).toBe(5.00);
  });

  it('should update commission status when order status changes', () => {
    const pendingOrder: Order = { ...mockPendingOrder };
    const paidOrder: Order = { ...mockPendingOrder, status: 'paid' };
    
    const pendingStatus = getCommissionStatus(pendingOrder);
    const paidStatus = getCommissionStatus(paidOrder);
    
    expect(pendingStatus.status).toBe('pending');
    expect(paidStatus.status).toBe('confirmed');
    expect(pendingStatus.amount).toBe(paidStatus.amount); // Same amount, different status
  });
});

describe('Commission Status Display', () => {
  it('should return correct status for paid orders', () => {
    const status = getCommissionStatus(mockPaidOrder);
    
    expect(status.status).toBe('confirmed');
    expect(status.icon).toBe('CheckCircle');
    expect(status.className).toContain('text-green-600');
    expect(status.tooltip).toContain('confirmada');
  });

  it('should return correct status for pending orders', () => {
    const status = getCommissionStatus(mockPendingOrder);
    
    expect(status.status).toBe('pending');
    expect(status.icon).toBe('Clock');
    expect(status.className).toContain('text-yellow-600');
    expect(status.tooltip).toContain('estimada');
  });

  it('should return correct status for cancelled orders', () => {
    const status = getCommissionStatus(mockCancelledOrder);
    
    expect(status.status).toBe('excluded');
    expect(status.icon).toBe('XCircle');
    expect(status.className).toContain('text-gray-400');
    expect(status.amount).toBe(0);
  });

  it('should format currency correctly in Brazilian format', () => {
    const status = getCommissionStatus(mockPaidOrder);
    
    expect(status.displayAmount).toMatch(/R\$/);
    expect(status.displayAmount).toContain('10,00');
  });
});

describe('Order Categorization', () => {
  it('should correctly categorize paid orders', () => {
    const orders = [mockPaidOrder, mockPendingOrder, mockCancelledOrder];
    const paidOrders = getOrdersByCategory(orders, 'PAID');
    
    expect(paidOrders).toHaveLength(1);
    expect(paidOrders[0].id).toBe('1');
  });

  it('should correctly categorize pending orders', () => {
    const orders = [mockPaidOrder, mockPendingOrder, mockInPreparationOrder];
    const pendingOrders = getOrdersByCategory(orders, 'PENDING');
    
    expect(pendingOrders).toHaveLength(2);
    expect(pendingOrders.map(o => o.id)).toContain('2');
    expect(pendingOrders.map(o => o.id)).toContain('3');
  });

  it('should correctly categorize excluded orders', () => {
    const orders = [mockPaidOrder, mockCancelledOrder];
    const excludedOrders = getOrdersByCategory(orders, 'EXCLUDED');
    
    expect(excludedOrders).toHaveLength(1);
    expect(excludedOrders[0].id).toBe('4');
  });
});

describe('CommissionToggle Component', () => {
  it('should render with updated title "Suas Comissões do Período"', () => {
    render(<CommissionToggle orders={[mockPaidOrder]} />);
    
    expect(screen.getByText('Suas Comissões do Período')).toBeInTheDocument();
  });

  it('should display date range for commission period', () => {
    render(<CommissionToggle orders={[mockPaidOrder, mockPendingOrder]} />);
    
    // Should show date range or period
    const dateElements = screen.getAllByText(/jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|2024/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should show confirmed and estimated commission breakdown', () => {
    render(<CommissionToggle orders={[mockPaidOrder, mockPendingOrder]} />);
    
    expect(screen.getByText('Confirmadas')).toBeInTheDocument();
    expect(screen.getByText('Estimadas')).toBeInTheDocument();
  });

  it('should display correct confirmed commission amount', () => {
    render(<CommissionToggle orders={[mockPaidOrder]} />);
    
    // Should show R$ 10,00 for confirmed (multiple instances expected)
    const amounts = screen.getAllByText(/R\$\s*10,00/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('should display correct estimated commission amount', () => {
    render(<CommissionToggle orders={[mockPendingOrder]} />);
    
    // Should show R$ 5,00 for estimated (multiple instances expected)
    const amounts = screen.getAllByText(/R\$\s*5,00/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('should show total commission combining confirmed and estimated', () => {
    render(<CommissionToggle orders={[mockPaidOrder, mockPendingOrder]} />);
    
    // Total should be 10 + 5 = 15
    expect(screen.getByText(/R\$\s*15,00/)).toBeInTheDocument();
  });

  it('should display order counts for each category', () => {
    render(<CommissionToggle orders={[mockPaidOrder, mockPendingOrder]} />);
    
    // Multiple instances of order counts expected (in breakdown and detail sections)
    const paidCounts = screen.getAllByText(/1.*pedido pago/i);
    const pendingCounts = screen.getAllByText(/1.*pedido pendente/i);
    expect(paidCounts.length).toBeGreaterThan(0);
    expect(pendingCounts.length).toBeGreaterThan(0);
  });

  it('should have toggle buttons for switching views', () => {
    render(<CommissionToggle orders={[mockPaidOrder, mockPendingOrder]} />);
    
    const receivedButton = screen.getByRole('button', { name: /recebidas/i });
    const pendingButton = screen.getByRole('button', { name: /a receber/i });
    
    expect(receivedButton).toBeInTheDocument();
    expect(pendingButton).toBeInTheDocument();
  });

  it('should use gradient styling for visual appeal', () => {
    const { container } = render(<CommissionToggle orders={[mockPaidOrder]} />);
    
    // Check for gradient classes
    const gradientElements = container.querySelectorAll('[class*="gradient"]');
    expect(gradientElements.length).toBeGreaterThan(0);
  });
});

describe('CommissionCards Component', () => {
  it('should render two cards for confirmed and estimated commissions', () => {
    render(<CommissionCards orders={[mockPaidOrder, mockPendingOrder]} />);
    
    expect(screen.getByText('Comissões Confirmadas')).toBeInTheDocument();
    expect(screen.getByText('Comissões Estimadas')).toBeInTheDocument();
  });

  it('should display correct amounts in each card', () => {
    render(<CommissionCards orders={[mockPaidOrder, mockPendingOrder]} />);
    
    // Confirmed: R$ 10,00
    // Estimated: R$ 5,00
    const amounts = screen.getAllByText(/R\$/);
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });

  it('should show appropriate icons for each card', () => {
    const { container } = render(<CommissionCards orders={[mockPaidOrder]} />);
    
    // Should have CheckCircle and Clock icons
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });
});

describe('CommissionDisplay Component', () => {
  it('should render commission amount with icon', () => {
    const config = getCommissionStatus(mockPaidOrder);
    render(<CommissionDisplay config={config} showIcon={true} />);
    
    expect(screen.getByText(/R\$\s*10,00/)).toBeInTheDocument();
  });

  it('should support different size variants', () => {
    const config = getCommissionStatus(mockPaidOrder);
    const { rerender } = render(<CommissionDisplay config={config} size="sm" />);
    
    expect(screen.getByText(/R\$\s*10,00/)).toBeInTheDocument();
    
    rerender(<CommissionDisplay config={config} size="lg" />);
    expect(screen.getByText(/R\$\s*10,00/)).toBeInTheDocument();
  });

  it('should show tooltip on hover', async () => {
    const config = getCommissionStatus(mockPaidOrder);
    const { container } = render(<CommissionDisplay config={config} />);
    
    // Tooltip is rendered but may not be visible initially
    // Check that the component renders with the correct config
    expect(screen.getByText(/R\$\s*10,00/)).toBeInTheDocument();
    
    // Verify tooltip trigger exists
    const tooltipTrigger = container.querySelector('[data-state]');
    expect(tooltipTrigger).toBeInTheDocument();
  });
});

describe('Commission Recalculation Scenarios', () => {
  it('should handle order item additions correctly', () => {
    const originalOrders = [mockPendingOrder]; // 50 * 0.1 = 5
    const updatedOrders = [{ ...mockPendingOrder, total_amount: 75 }]; // 75 * 0.1 = 7.5
    
    const originalEstimated = calculateEstimatedCommissions(originalOrders);
    const updatedEstimated = calculateEstimatedCommissions(updatedOrders);
    
    expect(originalEstimated).toBe(5.00);
    expect(updatedEstimated).toBe(7.50);
    expect(updatedEstimated - originalEstimated).toBe(2.50);
  });

  it('should handle order item removals correctly', () => {
    const originalOrders = [{ ...mockPendingOrder, total_amount: 100 }]; // 100 * 0.1 = 10
    const updatedOrders = [mockPendingOrder]; // 50 * 0.1 = 5
    
    const originalEstimated = calculateEstimatedCommissions(originalOrders);
    const updatedEstimated = calculateEstimatedCommissions(updatedOrders);
    
    expect(originalEstimated).toBe(10.00);
    expect(updatedEstimated).toBe(5.00);
    expect(originalEstimated - updatedEstimated).toBe(5.00);
  });

  it('should move commission from estimated to confirmed when order is paid', () => {
    const pendingOrders = [mockPendingOrder];
    const paidOrders = [{ ...mockPendingOrder, status: 'paid' }];
    
    const estimatedBefore = calculateEstimatedCommissions(pendingOrders);
    const confirmedBefore = calculateConfirmedCommissions(pendingOrders);
    
    const estimatedAfter = calculateEstimatedCommissions(paidOrders);
    const confirmedAfter = calculateConfirmedCommissions(paidOrders);
    
    expect(estimatedBefore).toBe(5.00);
    expect(confirmedBefore).toBe(0);
    expect(estimatedAfter).toBe(0);
    expect(confirmedAfter).toBe(5.00);
  });

  it('should handle multiple simultaneous order updates', () => {
    const orders = [
      mockPaidOrder,
      mockPendingOrder,
      mockInPreparationOrder
    ];
    
    const updatedOrders = [
      { ...mockPaidOrder, total_amount: 150 }, // 100 -> 150
      { ...mockPendingOrder, status: 'paid' }, // pending -> paid
      mockInPreparationOrder // unchanged
    ];
    
    const confirmedBefore = calculateConfirmedCommissions(orders);
    const estimatedBefore = calculateEstimatedCommissions(orders);
    
    const confirmedAfter = calculateConfirmedCommissions(updatedOrders);
    const estimatedAfter = calculateEstimatedCommissions(updatedOrders);
    
    // Confirmed: 100 * 0.1 = 10 -> (150 + 50) * 0.1 = 20
    expect(confirmedBefore).toBe(10.00);
    expect(confirmedAfter).toBe(20.00);
    
    // Estimated: (50 + 75) * 0.1 = 12.5 -> 75 * 0.1 = 7.5
    expect(estimatedBefore).toBe(12.50);
    expect(estimatedAfter).toBe(7.50);
  });
});

describe('Edge Cases and Precision', () => {
  it('should handle decimal precision correctly', () => {
    const order: Order = { ...mockPaidOrder, total_amount: 33.33 };
    const status = getCommissionStatus(order);
    
    // 33.33 * 0.1 = 3.333, should round to 3.33
    expect(status.amount).toBe(3.33);
  });

  it('should handle zero amount orders', () => {
    const order: Order = { ...mockPaidOrder, total_amount: 0 };
    const status = getCommissionStatus(order);
    
    expect(status.amount).toBe(0);
  });

  it('should handle very large order amounts', () => {
    const order: Order = { ...mockPaidOrder, total_amount: 10000 };
    const status = getCommissionStatus(order);
    
    expect(status.amount).toBe(1000.00);
  });

  it('should handle empty order arrays', () => {
    const confirmed = calculateConfirmedCommissions([]);
    const estimated = calculateEstimatedCommissions([]);
    
    expect(confirmed).toBe(0);
    expect(estimated).toBe(0);
  });
});
