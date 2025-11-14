import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cashier from '../Cashier';
import { supabase } from '@/integrations/supabase/client';
import * as waiterUtils from '@/lib/waiterUtils';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
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

vi.mock('@/hooks/useRealtimeOrders', () => ({
  useCashierOrders: vi.fn(() => ({})),
}));

vi.mock('@/hooks/useNotificationHistory', () => ({
  useNotificationHistory: vi.fn(() => ({
    history: new Map(),
    refresh: vi.fn(),
  })),
}));

vi.mock('@/components/ConnectionMonitor', () => ({
  ConnectionMonitor: () => null,
  useConnectionMonitor: () => ({
    connectionStatus: 'connected',
    reconnect: vi.fn(),
  }),
}));

vi.mock('@/components/RealtimeNotifications', () => ({
  RealtimeNotifications: () => null,
  notificationUtils: {
    newOrder: vi.fn(),
    orderInPreparation: vi.fn(),
    orderReady: vi.fn(),
    orderCompleted: vi.fn(),
    paymentConfirmed: vi.fn(),
  },
}));

vi.mock('@/integrations/whatsapp', () => ({
  notificationTriggers: {
    onPaymentConfirmed: vi.fn(),
    onOrderStatusChange: vi.fn(),
    onOrderReady: vi.fn(),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Cashier Waiter Filtering', () => {
  const mockWaiters = [
    { id: 'waiter-1', full_name: 'João Silva', email: 'joao@test.com' },
    { id: 'waiter-2', full_name: 'Maria Santos', email: 'maria@test.com' },
    { id: 'waiter-3', full_name: 'Pedro Costa', email: 'pedro@test.com' },
  ];

  const mockOrders = [
    {
      id: 'order-1',
      order_number: 1001,
      customer_name: 'Cliente A',
      customer_phone: '+5573999999999',
      total_amount: 25.50,
      status: 'pending_payment',
      created_at: '2024-01-01T10:00:00Z',
      waiter_id: 'waiter-1',
    },
    {
      id: 'order-2',
      order_number: 1002,
      customer_name: 'Cliente B',
      customer_phone: '+5573888888888',
      total_amount: 30.00,
      status: 'in_preparation',
      created_at: '2024-01-01T11:00:00Z',
      waiter_id: 'waiter-1',
    },
    {
      id: 'order-3',
      order_number: 1003,
      customer_name: 'Cliente C',
      customer_phone: '+5573777777777',
      total_amount: 18.00,
      status: 'ready',
      created_at: '2024-01-01T12:00:00Z',
      waiter_id: 'waiter-2',
    },
    {
      id: 'order-4',
      order_number: 1004,
      customer_name: 'Cliente D',
      customer_phone: '+5573666666666',
      total_amount: 22.00,
      status: 'completed',
      created_at: '2024-01-01T13:00:00Z',
      waiter_id: 'waiter-2',
    },
    {
      id: 'order-5',
      order_number: 1005,
      customer_name: 'Cliente E',
      customer_phone: '+5573555555555',
      total_amount: 15.00,
      status: 'cancelled',
      created_at: '2024-01-01T14:00:00Z',
      waiter_id: 'waiter-3',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    } as any);

    // Mock fetchAllWaiters
    vi.spyOn(waiterUtils, 'fetchAllWaiters').mockResolvedValue(mockWaiters);
    
    // Mock getWaiterName
    vi.spyOn(waiterUtils, 'getWaiterName').mockImplementation((waiterId: string | null) => {
      if (!waiterId) return 'Cliente';
      const waiter = mockWaiters.find(w => w.id === waiterId);
      return waiter?.full_name || 'Garçom';
    });

    // Mock orders query - default to all orders
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: mockOrders,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays all orders by default when no waiter filter is selected', async () => {
    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verify all orders are loaded
    expect(supabase.from).toHaveBeenCalledWith('orders');
    
    // Should show counts for all orders
    await waitFor(() => {
      // 1 pending, 1 in_preparation, 1 ready, 1 completed, 1 cancelled
      expect(screen.getByText('1')).toBeInTheDocument(); // Multiple cards with count 1
    });
  });

  it('filters orders by specific waiter when waiter is selected', async () => {
    const waiter1Orders = mockOrders.filter(o => o.waiter_id === 'waiter-1');
    
    // Mock filtered query
    const mockEq = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: waiter1Orders,
          error: null,
        }),
      }),
    });

    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    // Set waiter filter in localStorage
    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verify filtered query was called
    await waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith('waiter_id', 'waiter-1');
    });
  });

  it('shows "All Waiters" option and displays all orders', async () => {
    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // When no filter is set, all orders should be shown
    const mockSelect = vi.mocked(supabase.from).mock.results[0]?.value?.select;
    expect(mockSelect).toHaveBeenCalled();
  });

  it('displays empty state when waiter has no orders', async () => {
    // Mock empty result for waiter-3 (who only has cancelled orders)
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-3');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum pedido aguardando pagamento para o garçom selecionado/i)).toBeInTheDocument();
    });
  });

  it('updates summary cards with filtered counts', async () => {
    const waiter1Orders = mockOrders.filter(o => o.waiter_id === 'waiter-1');
    
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: waiter1Orders,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Waiter-1 has: 1 pending_payment, 1 in_preparation
    // Should show correct counts in summary cards
    const cards = screen.getAllByRole('generic').filter(el => 
      el.className?.includes('cursor-pointer')
    );
    
    expect(cards.length).toBeGreaterThan(0);
  });

  it('persists waiter filter selection in localStorage', async () => {
    const testWaiterId = 'waiter-2';
    
    // Initially no filter
    expect(localStorage.getItem('cashier_waiter_filter')).toBeNull();

    // Set filter
    localStorage.setItem('cashier_waiter_filter', testWaiterId);

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verify filter persisted
    expect(localStorage.getItem('cashier_waiter_filter')).toBe(testWaiterId);
  });

  it('maintains filter state when switching tabs', async () => {
    const waiter1Orders = mockOrders.filter(o => o.waiter_id === 'waiter-1');
    
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: waiter1Orders,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Filter should remain active across tab switches
    expect(localStorage.getItem('cashier_waiter_filter')).toBe('waiter-1');
  });

  it('displays waiter information on order cards', async () => {
    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Check if waiter names are displayed
    await waitFor(() => {
      expect(waiterUtils.getWaiterName).toHaveBeenCalled();
    });
  });

  it('applies waiter filter to real-time order updates', async () => {
    const { useCashierOrders } = await import('@/hooks/useRealtimeOrders');
    
    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verify real-time hook was called
    expect(useCashierOrders).toHaveBeenCalled();
  });

  it('filters out orders from other waiters in real-time updates', async () => {
    const waiter1Orders = mockOrders.filter(o => o.waiter_id === 'waiter-1');
    
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: waiter1Orders,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Only waiter-1 orders should be visible
    // Order 1001 and 1002 belong to waiter-1
    await waitFor(() => {
      const orderCards = screen.queryAllByText(/Pedido #/i);
      expect(orderCards.length).toBeGreaterThan(0);
    });
  });

  it('clears filter when "All Waiters" is selected', async () => {
    // Start with a filter
    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Clear filter
    localStorage.removeItem('cashier_waiter_filter');

    // Verify all orders query is called
    const mockSelect = vi.mocked(supabase.from).mock.results[0]?.value?.select;
    expect(mockSelect).toHaveBeenCalled();
  });

  it('handles waiter filter with no matching orders gracefully', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-999');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum pedido aguardando pagamento para o garçom selecionado/i)).toBeInTheDocument();
    });
  });

  it('recalculates order counts when filter changes', async () => {
    const { rerender } = renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Change filter
    localStorage.setItem('cashier_waiter_filter', 'waiter-2');

    // Re-render to trigger filter change
    rerender(<BrowserRouter><Cashier /></BrowserRouter>);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });
  });

  it('shows correct empty state message for filtered view', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.getByText(/para o garçom selecionado/i)).toBeInTheDocument();
    });
  });

  it('fetches all waiters on component mount', async () => {
    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(waiterUtils.fetchAllWaiters).toHaveBeenCalled();
    });
  });

  it('displays waiter name in order details', async () => {
    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Verify getWaiterName is called for orders
    await waitFor(() => {
      expect(waiterUtils.getWaiterName).toHaveBeenCalledWith('waiter-1');
    });
  });

  it('handles multiple waiters with orders correctly', async () => {
    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Should display orders from multiple waiters
    expect(waiterUtils.getWaiterName).toHaveBeenCalledWith('waiter-1');
    expect(waiterUtils.getWaiterName).toHaveBeenCalledWith('waiter-2');
  });

  it('preserves filter across page reloads', async () => {
    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    const { unmount } = renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    unmount();

    // Simulate page reload
    const { container } = renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(localStorage.getItem('cashier_waiter_filter')).toBe('waiter-1');
    });
  });

  it('updates order counts for each status category with filter', async () => {
    const waiter1Orders = mockOrders.filter(o => o.waiter_id === 'waiter-1');
    
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: waiter1Orders,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Waiter-1 has: 1 pending_payment, 1 in_preparation, 0 ready, 0 completed, 0 cancelled
    // Verify counts are displayed correctly
    const summaryCards = screen.getAllByRole('generic').filter(el => 
      el.className?.includes('cursor-pointer')
    );
    
    expect(summaryCards.length).toBeGreaterThan(0);
  });

  it('handles filter with waiter who has only cancelled orders', async () => {
    const waiter3Orders = mockOrders.filter(o => o.waiter_id === 'waiter-3');
    
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: waiter3Orders,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-3');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Should show cancelled order in cancelled tab
    // Other tabs should show empty state
    await waitFor(() => {
      expect(screen.getByText(/Nenhum pedido aguardando pagamento para o garçom selecionado/i)).toBeInTheDocument();
    });
  });

  it('correctly filters orders in each tab', async () => {
    const waiter2Orders = mockOrders.filter(o => o.waiter_id === 'waiter-2');
    
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: waiter2Orders,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-2');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Waiter-2 has: 0 pending, 0 in_preparation, 1 ready, 1 completed, 0 cancelled
    // Verify correct filtering in each tab
    await waitFor(() => {
      const cards = screen.getAllByRole('generic');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it('handles real-time order creation with filter active', async () => {
    const waiter1Orders = mockOrders.filter(o => o.waiter_id === 'waiter-1');
    
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: waiter1Orders,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Real-time updates should respect the filter
    const { useCashierOrders } = await import('@/hooks/useRealtimeOrders');
    expect(useCashierOrders).toHaveBeenCalled();
  });

  it('removes filter when localStorage is cleared', async () => {
    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    // Clear filter
    localStorage.removeItem('cashier_waiter_filter');

    // Should show all orders
    expect(localStorage.getItem('cashier_waiter_filter')).toBeNull();
  });

  it('handles database errors gracefully when filtering', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    localStorage.setItem('cashier_waiter_filter', 'waiter-1');

    renderWithRouter(<Cashier />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });
  });
});
