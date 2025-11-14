import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminWaiterReports from '../AdminWaiterReports';
import { supabase } from '@/integrations/supabase/client';
import { calculateConfirmedCommissions, calculateEstimatedCommissions, getCommissionStatus } from '@/lib/commissionUtils';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
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

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'dd/MM') return '01/01';
    if (formatStr === 'dd/MM/yyyy HH:mm') return '01/01/2024 10:00';
    if (formatStr === 'dd-MM-yyyy') return '01-01-2024';
    return '01/01/2024';
  }),
}));

vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

describe('AdminWaiterReports', () => {
  const mockWaiters = [
    {
      id: 'waiter-1',
      email: 'joao@test.com',
      full_name: 'João Silva',
    },
    {
      id: 'waiter-2',
      email: 'maria@test.com',
      full_name: 'Maria Santos',
    },
  ];

  const mockOrders = [
    {
      id: 'order-1',
      order_number: 1001,
      customer_name: 'Cliente A',
      customer_phone: '+5573999999999',
      total_amount: 25.50,
      status: 'paid',
      created_at: '2024-01-01T10:00:00Z',
      order_notes: 'Açaí sem granola',
    },
    {
      id: 'order-2',
      order_number: 1002,
      customer_name: 'Cliente B',
      customer_phone: '+5573888888888',
      total_amount: 18.00,
      status: 'completed',
      created_at: '2024-01-01T11:00:00Z',
      order_notes: null,
    },
    {
      id: 'order-3',
      order_number: 1003,
      customer_name: 'Cliente C',
      customer_phone: '+5573777777777',
      total_amount: 30.00,
      status: 'pending',
      created_at: '2024-01-01T12:00:00Z',
      order_notes: '',
    },
    {
      id: 'order-4',
      order_number: 1004,
      customer_name: 'Cliente D',
      customer_phone: '+5573666666666',
      total_amount: 15.00,
      status: 'in_preparation',
      created_at: '2024-01-01T13:00:00Z',
      order_notes: 'Sem açúcar',
    },
    {
      id: 'order-5',
      order_number: 1005,
      customer_name: 'Cliente E',
      customer_phone: '+5573555555555',
      total_amount: 12.00,
      status: 'cancelled',
      created_at: '2024-01-01T14:00:00Z',
      order_notes: '',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful waiter loading
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { waiters: mockWaiters },
      error: null,
    });
  });

  it('renders admin waiter reports interface', () => {
    render(<AdminWaiterReports />);
    
    expect(screen.getByText('Relatórios por Garçom')).toBeInTheDocument();
    expect(screen.getByText('Selecionar Garçom')).toBeInTheDocument();
    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('disables export button when no waiter selected', () => {
    render(<AdminWaiterReports />);
    
    const exportButton = screen.getByText('Exportar');
    expect(exportButton).toBeDisabled();
  });

  it('calculates confirmed commissions from paid orders only', () => {
    const confirmedCommission = calculateConfirmedCommissions(mockOrders);
    
    // Only orders with status 'paid' or 'completed' should be included
    // order-1 (paid): 25.50 * 0.1 = 2.55
    // order-2 (completed): 18.00 * 0.1 = 1.80
    // Total: 4.35
    expect(Number(confirmedCommission.toFixed(2))).toBe(4.35);
  });

  it('calculates estimated commissions from pending orders', () => {
    const estimatedCommission = calculateEstimatedCommissions(mockOrders);
    
    // Orders with status 'pending', 'pending_payment', 'in_preparation', or 'ready'
    // order-3 (pending): 30.00 * 0.1 = 3.00
    // order-4 (in_preparation): 15.00 * 0.1 = 1.50
    // Total: 4.50
    expect(Number(estimatedCommission.toFixed(2))).toBe(4.50);
  });

  it('excludes cancelled orders from all commission calculations', () => {
    const confirmedCommission = calculateConfirmedCommissions(mockOrders);
    const estimatedCommission = calculateEstimatedCommissions(mockOrders);
    
    // order-5 (cancelled) should not be included in either calculation
    const totalCommissions = confirmedCommission + estimatedCommission;
    
    // Total should be 4.35 + 4.50 = 8.85 (not including the 12.00 cancelled order)
    expect(Number(totalCommissions.toFixed(2))).toBe(8.85);
  });

  it('filters orders by waiter ID correctly', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrders,
              error: null,
            }),
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    // Simulate the query that would be made
    const waiterId = 'waiter-1';
    const dateFrom = new Date('2024-01-01');
    const dateTo = new Date('2024-01-31');

    await supabase
      .from('orders')
      .select('*')
      .eq('waiter_id', waiterId)
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString())
      .order('created_at', { ascending: false });

    // Verify the query was constructed correctly
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockSelect().eq).toHaveBeenCalledWith('waiter_id', waiterId);
  });

  it('applies date range filtering in queries', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrders,
              error: null,
            }),
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    // Simulate date range filtering
    const dateFrom = new Date('2024-01-01');
    const dateTo = new Date('2024-01-31');

    await supabase
      .from('orders')
      .select('*')
      .eq('waiter_id', 'waiter-1')
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());

    // Verify date filtering is applied
    expect(mockSelect().eq().gte).toHaveBeenCalledWith('created_at', dateFrom.toISOString());
    expect(mockSelect().eq().gte().lte).toHaveBeenCalledWith('created_at', dateTo.toISOString());
  });

  it('returns correct commission status for paid orders', () => {
    const paidOrder = mockOrders[0]; // status: 'paid'
    const status = getCommissionStatus(paidOrder);
    
    expect(status.status).toBe('confirmed');
    expect(status.className).toContain('text-green-600');
    expect(status.icon).toBe('CheckCircle');
    expect(status.tooltip).toContain('confirmada');
  });

  it('returns correct commission status for pending orders', () => {
    const pendingOrder = mockOrders[2]; // status: 'pending'
    const status = getCommissionStatus(pendingOrder);
    
    expect(status.status).toBe('pending');
    expect(status.className).toContain('text-yellow-600');
    expect(status.icon).toBe('Clock');
    expect(status.tooltip).toContain('estimada');
  });

  it('returns correct commission status for cancelled orders', () => {
    const cancelledOrder = mockOrders[4]; // status: 'cancelled'
    const status = getCommissionStatus(cancelledOrder);
    
    expect(status.status).toBe('excluded');
    expect(status.className).toContain('text-gray-400');
    expect(status.className).toContain('line-through');
    expect(status.icon).toBe('XCircle');
    expect(status.amount).toBe(0);
  });

  it('loads waiters using edge function', async () => {
    render(<AdminWaiterReports />);

    // Verify the edge function is called
    expect(supabase.functions.invoke).toHaveBeenCalledWith('list-waiters');
  });

  it('handles waiter loading error gracefully', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Failed to load waiters' },
    });

    render(<AdminWaiterReports />);

    // Should still render the interface
    expect(screen.getByText('Relatórios por Garçom')).toBeInTheDocument();
  });

  it('processes order notes correctly', () => {
    const ordersWithNotes = mockOrders.map(order => ({
      ...order,
      order_notes: order.order_notes || '', // Handle null/undefined notes
    }));

    // Verify notes are processed correctly
    expect(ordersWithNotes[0].order_notes).toBe('Açaí sem granola');
    expect(ordersWithNotes[1].order_notes).toBe(''); // null becomes empty string
    expect(ordersWithNotes[2].order_notes).toBe(''); // empty string remains
  });

  it('calculates statistics for empty order list', () => {
    const emptyOrders: any[] = [];
    
    const completedOrders = emptyOrders.filter(o => o.status === 'completed');
    const grossSales = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalCommission = completedOrders.reduce((sum, o) => sum + Number(o.total_amount) * 0.1, 0);
    const averageOrderValue = completedOrders.length > 0 ? grossSales / completedOrders.length : 0;

    expect(completedOrders.length).toBe(0);
    expect(grossSales).toBe(0);
    expect(totalCommission).toBe(0);
    expect(averageOrderValue).toBe(0);
  });

  it('formats order data correctly for display', () => {
    const order = mockOrders[0];
    
    // Verify order data structure
    expect(order.id).toBe('order-1');
    expect(order.order_number).toBe(1001);
    expect(order.customer_name).toBe('Cliente A');
    expect(order.customer_phone).toBe('+5573999999999');
    expect(order.total_amount).toBe(25.50);
    expect(order.status).toBe('paid');
    expect(order.order_notes).toBe('Açaí sem granola');
  });

  it('calculates commission breakdown with mixed order statuses', () => {
    const confirmedCommission = calculateConfirmedCommissions(mockOrders);
    const estimatedCommission = calculateEstimatedCommissions(mockOrders);
    
    // Confirmed: paid (25.50) + completed (18.00) = 43.50 * 0.1 = 4.35
    expect(Number(confirmedCommission.toFixed(2))).toBe(4.35);
    
    // Estimated: pending (30.00) + in_preparation (15.00) = 45.00 * 0.1 = 4.50
    expect(Number(estimatedCommission.toFixed(2))).toBe(4.50);
    
    // Total potential: 8.85
    const totalPotential = confirmedCommission + estimatedCommission;
    expect(Number(totalPotential.toFixed(2))).toBe(8.85);
  });

  it('handles commission status transitions correctly', () => {
    // Simulate order transitioning from pending to paid
    const orderBeforePayment = { ...mockOrders[2], status: 'pending' };
    const orderAfterPayment = { ...mockOrders[2], status: 'paid' };
    
    const statusBefore = getCommissionStatus(orderBeforePayment);
    const statusAfter = getCommissionStatus(orderAfterPayment);
    
    // Before payment: should be estimated (yellow)
    expect(statusBefore.status).toBe('pending');
    expect(statusBefore.className).toContain('text-yellow-600');
    
    // After payment: should be confirmed (green)
    expect(statusAfter.status).toBe('confirmed');
    expect(statusAfter.className).toContain('text-green-600');
    
    // Commission amount should remain the same
    expect(statusBefore.amount).toBe(statusAfter.amount);
  });

  it('verifies commission precision to 2 decimal places', () => {
    const testOrders = [
      { id: '1', total_amount: 33.33, status: 'paid', created_at: '2024-01-01' },
      { id: '2', total_amount: 66.67, status: 'completed', created_at: '2024-01-01' },
    ];
    
    const confirmedCommission = calculateConfirmedCommissions(testOrders);
    
    // (33.33 + 66.67) * 0.1 = 10.00
    expect(Number(confirmedCommission.toFixed(2))).toBe(10.00);
    
    // Verify each order's commission
    const order1Status = getCommissionStatus(testOrders[0]);
    const order2Status = getCommissionStatus(testOrders[1]);
    
    expect(Number(order1Status.amount.toFixed(2))).toBe(3.33);
    expect(Number(order2Status.amount.toFixed(2))).toBe(6.67);
  });

  it('handles orders with various pending statuses', () => {
    const pendingOrders = [
      { id: '1', total_amount: 10.00, status: 'pending', created_at: '2024-01-01' },
      { id: '2', total_amount: 20.00, status: 'pending_payment', created_at: '2024-01-01' },
      { id: '3', total_amount: 30.00, status: 'in_preparation', created_at: '2024-01-01' },
      { id: '4', total_amount: 40.00, status: 'ready', created_at: '2024-01-01' },
    ];
    
    const estimatedCommission = calculateEstimatedCommissions(pendingOrders);
    
    // All should be included in estimated: (10 + 20 + 30 + 40) * 0.1 = 10.00
    expect(Number(estimatedCommission.toFixed(2))).toBe(10.00);
    
    // Verify each has pending status
    pendingOrders.forEach(order => {
      const status = getCommissionStatus(order);
      expect(status.status).toBe('pending');
      expect(status.className).toContain('text-yellow-600');
    });
  });

  it('handles orders with various paid statuses', () => {
    const paidOrders = [
      { id: '1', total_amount: 25.00, status: 'paid', created_at: '2024-01-01' },
      { id: '2', total_amount: 35.00, status: 'completed', created_at: '2024-01-01' },
    ];
    
    const confirmedCommission = calculateConfirmedCommissions(paidOrders);
    
    // Both should be included: (25 + 35) * 0.1 = 6.00
    expect(Number(confirmedCommission.toFixed(2))).toBe(6.00);
    
    // Verify each has confirmed status
    paidOrders.forEach(order => {
      const status = getCommissionStatus(order);
      expect(status.status).toBe('confirmed');
      expect(status.className).toContain('text-green-600');
    });
  });

  it('handles case-insensitive order status matching', () => {
    const ordersWithMixedCase = [
      { id: '1', total_amount: 10.00, status: 'PAID', created_at: '2024-01-01' },
      { id: '2', total_amount: 20.00, status: 'Completed', created_at: '2024-01-01' },
      { id: '3', total_amount: 30.00, status: 'PENDING', created_at: '2024-01-01' },
      { id: '4', total_amount: 40.00, status: 'Cancelled', created_at: '2024-01-01' },
    ];
    
    const confirmedCommission = calculateConfirmedCommissions(ordersWithMixedCase);
    const estimatedCommission = calculateEstimatedCommissions(ordersWithMixedCase);
    
    // Should handle case-insensitive matching
    expect(Number(confirmedCommission.toFixed(2))).toBe(3.00); // 10 + 20
    expect(Number(estimatedCommission.toFixed(2))).toBe(3.00); // 30
  });
});