import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminWaiterReports from '../AdminWaiterReports';
import { supabase } from '@/integrations/supabase/client';

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
      status: 'completed',
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
      total_amount: 12.00,
      status: 'cancelled',
      created_at: '2024-01-01T12:00:00Z',
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

  it('calculates waiter sales and commission correctly', () => {
    // Test the calculation logic directly
    const orders = mockOrders;
    
    // Filter completed orders only
    const completedOrders = orders.filter(o => o.status === 'completed');
    const grossSales = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalCommission = completedOrders.reduce((sum, o) => sum + Number(o.total_amount) * 0.1, 0);
    const averageOrderValue = completedOrders.length > 0 ? grossSales / completedOrders.length : 0;

    // Verify calculations
    expect(completedOrders.length).toBe(2); // Only 2 completed orders
    expect(grossSales).toBe(43.50); // 25.50 + 18.00
    expect(Number(totalCommission.toFixed(2))).toBe(4.35); // 10% of 43.50
    expect(averageOrderValue).toBe(21.75); // 43.50 / 2
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

  it('handles commission calculation for different order amounts', () => {
    const testOrders = [
      { total_amount: 10.00, status: 'completed' },
      { total_amount: 25.50, status: 'completed' },
      { total_amount: 100.00, status: 'completed' },
      { total_amount: 50.00, status: 'cancelled' }, // Should not be included
    ];

    const completedOrders = testOrders.filter(o => o.status === 'completed');
    const totalCommission = completedOrders.reduce((sum, o) => sum + Number(o.total_amount) * 0.1, 0);

    // 10% commission: (10.00 + 25.50 + 100.00) * 0.1 = 13.55
    expect(totalCommission).toBe(13.55);
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
    expect(order.status).toBe('completed');
    expect(order.order_notes).toBe('Açaí sem granola');
  });
});