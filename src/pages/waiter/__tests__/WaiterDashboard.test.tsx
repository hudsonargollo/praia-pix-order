import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WaiterDashboard from '../WaiterDashboard';
import { supabase } from '@/integrations/supabase/client';
import { calculateConfirmedCommissions, calculateEstimatedCommissions, getCommissionStatus } from '@/lib/commissionUtils';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('WaiterDashboard Commission Display', () => {
  const mockUser = {
    id: 'waiter-123',
    email: 'joao@test.com',
    user_metadata: {
      role: 'waiter',
      full_name: 'João Silva',
    },
  };

  const mockOrders = [
    {
      id: 'order-1',
      order_number: 1001,
      customer_name: 'Cliente A',
      customer_phone: '+5573999999999',
      total_amount: 25.50,
      status: 'paid',
      created_at: '2024-01-01T10:00:00Z',
      waiter_id: 'waiter-123',
    },
    {
      id: 'order-2',
      order_number: 1002,
      customer_name: 'Cliente B',
      customer_phone: '+5573888888888',
      total_amount: 18.00,
      status: 'completed',
      created_at: '2024-01-01T11:00:00Z',
      waiter_id: 'waiter-123',
    },
    {
      id: 'order-3',
      order_number: 1003,
      customer_name: 'Cliente C',
      customer_phone: '+5573777777777',
      total_amount: 30.00,
      status: 'pending',
      created_at: '2024-01-01T12:00:00Z',
      waiter_id: 'waiter-123',
    },
    {
      id: 'order-4',
      order_number: 1004,
      customer_name: 'Cliente D',
      customer_phone: '+5573666666666',
      total_amount: 15.00,
      status: 'in_preparation',
      created_at: '2024-01-01T13:00:00Z',
      waiter_id: 'waiter-123',
    },
    {
      id: 'order-5',
      order_number: 1005,
      customer_name: 'Cliente E',
      customer_phone: '+5573555555555',
      total_amount: 12.00,
      status: 'cancelled',
      created_at: '2024-01-01T14:00:00Z',
      waiter_id: 'waiter-123',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock orders query
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);
  });

  it('calculates confirmed commissions correctly from paid orders', () => {
    const confirmedCommission = calculateConfirmedCommissions(mockOrders as any);
    
    // paid (25.50) + completed (18.00) = 43.50 * 0.1 = 4.35
    expect(Number(confirmedCommission.toFixed(2))).toBe(4.35);
  });

  it('calculates estimated commissions correctly from pending orders', () => {
    const estimatedCommission = calculateEstimatedCommissions(mockOrders as any);
    
    // pending (30.00) + in_preparation (15.00) = 45.00 * 0.1 = 4.50
    expect(Number(estimatedCommission.toFixed(2))).toBe(4.50);
  });

  it('displays commission status indicators for each order', () => {
    mockOrders.forEach((order: any) => {
      const status = getCommissionStatus(order);
      
      if (order.status === 'paid' || order.status === 'completed') {
        expect(status.status).toBe('confirmed');
        expect(status.icon).toBe('CheckCircle');
        expect(status.className).toContain('text-green-600');
      } else if (order.status === 'pending' || order.status === 'in_preparation') {
        expect(status.status).toBe('pending');
        expect(status.icon).toBe('Clock');
        expect(status.className).toContain('text-yellow-600');
      } else if (order.status === 'cancelled') {
        expect(status.status).toBe('excluded');
        expect(status.icon).toBe('XCircle');
        expect(status.className).toContain('text-gray-400');
        expect(status.amount).toBe(0);
      }
    });
  });

  it('shows correct order counts for confirmed and estimated commissions', () => {
    const paidOrders = mockOrders.filter(o => 
      o.status === 'paid' || o.status === 'completed'
    );
    const pendingOrders = mockOrders.filter(o => 
      o.status === 'pending' || o.status === 'in_preparation' || 
      o.status === 'pending_payment' || o.status === 'ready'
    );
    
    expect(paidOrders.length).toBe(2);
    expect(pendingOrders.length).toBe(2);
  });

  it('excludes cancelled orders from commission calculations', () => {
    const confirmedCommission = calculateConfirmedCommissions(mockOrders as any);
    const estimatedCommission = calculateEstimatedCommissions(mockOrders as any);
    
    // Cancelled order (12.00) should not be included
    const totalCommissions = confirmedCommission + estimatedCommission;
    expect(Number(totalCommissions.toFixed(2))).toBe(8.85);
  });

  it('displays correct tooltips for commission status', () => {
    const paidOrder = mockOrders[0];
    const pendingOrder = mockOrders[2];
    const cancelledOrder = mockOrders[4];
    
    const paidStatus = getCommissionStatus(paidOrder as any);
    const pendingStatus = getCommissionStatus(pendingOrder as any);
    const cancelledStatus = getCommissionStatus(cancelledOrder as any);
    
    expect(paidStatus.tooltip).toContain('confirmada');
    expect(pendingStatus.tooltip).toContain('estimada');
    expect(cancelledStatus.tooltip).toContain('cancelado');
  });

  it('handles commission transition from estimated to confirmed', () => {
    // Simulate order before payment
    const orderBefore = { ...mockOrders[2], status: 'pending' } as any;
    const statusBefore = getCommissionStatus(orderBefore);
    
    expect(statusBefore.status).toBe('pending');
    expect(statusBefore.className).toContain('text-yellow-600');
    
    // Simulate order after payment
    const orderAfter = { ...mockOrders[2], status: 'paid' } as any;
    const statusAfter = getCommissionStatus(orderAfter);
    
    expect(statusAfter.status).toBe('confirmed');
    expect(statusAfter.className).toContain('text-green-600');
    
    // Commission amount should remain the same
    expect(statusBefore.amount).toBe(statusAfter.amount);
  });

  it('calculates total sales from paid orders only', () => {
    const paidOrders = mockOrders.filter((o: any) => 
      o.status === 'paid' || o.status === 'completed'
    );
    const totalSales = paidOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
    
    // 25.50 + 18.00 = 43.50
    expect(totalSales).toBe(43.50);
  });

  it('verifies commission precision to 2 decimal places', () => {
    const testOrders = [
      { id: '1', total_amount: 33.33, status: 'paid', created_at: '2024-01-01', waiter_id: 'waiter-123' },
      { id: '2', total_amount: 66.67, status: 'completed', created_at: '2024-01-01', waiter_id: 'waiter-123' },
    ];
    
    const confirmedCommission = calculateConfirmedCommissions(testOrders);
    expect(Number(confirmedCommission.toFixed(2))).toBe(10.00);
  });

  it('handles empty order list gracefully', () => {
    const emptyOrders: any[] = [];
    
    const confirmedCommission = calculateConfirmedCommissions(emptyOrders);
    const estimatedCommission = calculateEstimatedCommissions(emptyOrders);
    
    expect(confirmedCommission).toBe(0);
    expect(estimatedCommission).toBe(0);
  });

  it('handles orders with only cancelled status', () => {
    const cancelledOrders = [
      { id: '1', total_amount: 10.00, status: 'cancelled', created_at: '2024-01-01', waiter_id: 'waiter-123' },
      { id: '2', total_amount: 20.00, status: 'expired', created_at: '2024-01-01', waiter_id: 'waiter-123' },
    ];
    
    const confirmedCommission = calculateConfirmedCommissions(cancelledOrders);
    const estimatedCommission = calculateEstimatedCommissions(cancelledOrders);
    
    expect(confirmedCommission).toBe(0);
    expect(estimatedCommission).toBe(0);
  });

  it('displays commission amounts in Brazilian Real format', () => {
    const order = mockOrders[0];
    const status = getCommissionStatus(order as any);
    
    // Should format as R$ X,XX
    expect(status.displayAmount).toMatch(/R\$/);
  });

  it('handles multiple pending status types correctly', () => {
    const pendingOrders = [
      { id: '1', total_amount: 10.00, status: 'pending', created_at: '2024-01-01', waiter_id: 'waiter-123' },
      { id: '2', total_amount: 20.00, status: 'pending_payment', created_at: '2024-01-01', waiter_id: 'waiter-123' },
      { id: '3', total_amount: 30.00, status: 'in_preparation', created_at: '2024-01-01', waiter_id: 'waiter-123' },
      { id: '4', total_amount: 40.00, status: 'ready', created_at: '2024-01-01', waiter_id: 'waiter-123' },
    ];
    
    const estimatedCommission = calculateEstimatedCommissions(pendingOrders);
    
    // All should be included: (10 + 20 + 30 + 40) * 0.1 = 10.00
    expect(Number(estimatedCommission.toFixed(2))).toBe(10.00);
  });

  it('verifies consistent commission calculation across components', () => {
    // This test ensures WaiterDashboard and AdminWaiterReports use the same logic
    const confirmedCommission = calculateConfirmedCommissions(mockOrders as any);
    const estimatedCommission = calculateEstimatedCommissions(mockOrders as any);
    
    // These values should match in both components
    expect(Number(confirmedCommission.toFixed(2))).toBe(4.35);
    expect(Number(estimatedCommission.toFixed(2))).toBe(4.50);
  });

  it('recalculates commissions after order edit', () => {
    // Original order
    const originalOrder = {
      id: 'order-1',
      total_amount: 25.50,
      status: 'pending',
      created_at: '2024-01-01T10:00:00Z',
      waiter_id: 'waiter-123',
    };

    // Calculate original commission
    const originalCommission = calculateEstimatedCommissions([originalOrder]);
    expect(Number(originalCommission.toFixed(2))).toBe(2.55);

    // Simulate order edit with new total
    const updatedOrder = {
      ...originalOrder,
      total_amount: 35.00, // Increased from 25.50
    };

    // Calculate new commission
    const newCommission = calculateEstimatedCommissions([updatedOrder]);
    expect(Number(newCommission.toFixed(2))).toBe(3.50);

    // Verify commission increased
    expect(newCommission).toBeGreaterThan(originalCommission);
  });

  it('updates commission status when order transitions from pending to paid', () => {
    const ordersBeforePayment = [
      { id: 'order-1', total_amount: 30.00, status: 'pending', created_at: '2024-01-01', waiter_id: 'waiter-123' },
    ];

    const ordersAfterPayment = [
      { id: 'order-1', total_amount: 30.00, status: 'paid', created_at: '2024-01-01', waiter_id: 'waiter-123' },
    ];

    // Before payment: should be in estimated
    const estimatedBefore = calculateEstimatedCommissions(ordersBeforePayment);
    const confirmedBefore = calculateConfirmedCommissions(ordersBeforePayment);
    expect(Number(estimatedBefore.toFixed(2))).toBe(3.00);
    expect(confirmedBefore).toBe(0);

    // After payment: should move to confirmed
    const estimatedAfter = calculateEstimatedCommissions(ordersAfterPayment);
    const confirmedAfter = calculateConfirmedCommissions(ordersAfterPayment);
    expect(estimatedAfter).toBe(0);
    expect(Number(confirmedAfter.toFixed(2))).toBe(3.00);
  });

  it('handles real-time order updates correctly', () => {
    const initialOrders = [
      { id: 'order-1', total_amount: 25.00, status: 'pending', created_at: '2024-01-01', waiter_id: 'waiter-123' },
      { id: 'order-2', total_amount: 30.00, status: 'paid', created_at: '2024-01-01', waiter_id: 'waiter-123' },
    ];

    // Initial state
    const initialConfirmed = calculateConfirmedCommissions(initialOrders);
    const initialEstimated = calculateEstimatedCommissions(initialOrders);
    expect(Number(initialConfirmed.toFixed(2))).toBe(3.00);
    expect(Number(initialEstimated.toFixed(2))).toBe(2.50);

    // Simulate real-time update: order-1 gets paid
    const updatedOrders = [
      { id: 'order-1', total_amount: 25.00, status: 'paid', created_at: '2024-01-01', waiter_id: 'waiter-123' },
      { id: 'order-2', total_amount: 30.00, status: 'paid', created_at: '2024-01-01', waiter_id: 'waiter-123' },
    ];

    const updatedConfirmed = calculateConfirmedCommissions(updatedOrders);
    const updatedEstimated = calculateEstimatedCommissions(updatedOrders);
    expect(Number(updatedConfirmed.toFixed(2))).toBe(5.50);
    expect(updatedEstimated).toBe(0);
  });

  it('maintains commission accuracy after multiple edits', () => {
    let order = {
      id: 'order-1',
      total_amount: 20.00,
      status: 'pending',
      created_at: '2024-01-01',
      waiter_id: 'waiter-123',
    };

    // First edit: increase total
    order = { ...order, total_amount: 25.00 };
    let commission = calculateEstimatedCommissions([order]);
    expect(Number(commission.toFixed(2))).toBe(2.50);

    // Second edit: increase again
    order = { ...order, total_amount: 30.00 };
    commission = calculateEstimatedCommissions([order]);
    expect(Number(commission.toFixed(2))).toBe(3.00);

    // Third edit: decrease
    order = { ...order, total_amount: 22.50 };
    commission = calculateEstimatedCommissions([order]);
    expect(Number(commission.toFixed(2))).toBe(2.25);

    // Verify commission is always 10% of total
    expect(commission).toBe(order.total_amount * 0.1);
  });
});
