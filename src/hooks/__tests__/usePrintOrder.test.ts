import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePrintOrder } from '../usePrintOrder';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock react-to-print
vi.mock('react-to-print', () => ({
  useReactToPrint: vi.fn(() => vi.fn()),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('usePrintOrder', () => {
  const mockOrder = {
    id: 'order-1',
    order_number: 123,
    customer_name: 'João Silva',
    customer_phone: '+5511999999999',
    total_amount: 45.50,
    order_notes: 'Sem açúcar',
    created_at: '2024-01-01T10:00:00Z',
    waiter_id: 'waiter-1',
  };

  const mockItems = [
    {
      id: 'item-1',
      item_name: 'Açaí 500ml',
      quantity: 2,
      unit_price: 15.00,
    },
    {
      id: 'item-2',
      item_name: 'Granola',
      quantity: 1,
      unit_price: 5.50,
    },
  ];

  const mockWaiter = {
    full_name: 'Carlos Garçom',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase query chain for orders
    const mockOrderSelect = vi.fn().mockReturnThis();
    const mockOrderEq = vi.fn().mockReturnThis();
    const mockOrderSingle = vi.fn().mockResolvedValue({ data: mockOrder, error: null });

    // Mock Supabase query chain for order_items
    const mockItemsSelect = vi.fn().mockReturnThis();
    const mockItemsEq = vi.fn().mockResolvedValue({ data: mockItems, error: null });

    // Mock Supabase query chain for profiles
    const mockProfileSelect = vi.fn().mockReturnThis();
    const mockProfileEq = vi.fn().mockReturnThis();
    const mockProfileSingle = vi.fn().mockResolvedValue({ data: mockWaiter, error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'orders') {
        return {
          select: mockOrderSelect,
          eq: mockOrderEq,
          single: mockOrderSingle,
        } as any;
      } else if (table === 'order_items') {
        return {
          select: mockItemsSelect,
          eq: mockItemsEq,
        } as any;
      } else if (table === 'profiles') {
        return {
          select: mockProfileSelect,
          eq: mockProfileEq,
          single: mockProfileSingle,
        } as any;
      }
      return {} as any;
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => usePrintOrder());

    expect(result.current.isPrinting).toBe(false);
    expect(result.current.orderData).toBeNull();
    expect(result.current.printRef).toBeDefined();
    expect(result.current.printOrder).toBeDefined();
  });

  it('fetches order data when printOrder is called', async () => {
    const { result } = renderHook(() => usePrintOrder());

    result.current.printOrder('order-1');

    await waitFor(() => {
      expect(result.current.orderData).not.toBeNull();
    });

    expect(result.current.orderData?.order.id).toBe('order-1');
    expect(result.current.orderData?.order.order_number).toBe(123);
    expect(result.current.orderData?.items).toHaveLength(2);
    expect(result.current.orderData?.waiterName).toBe('Carlos Garçom');
  });

  it('sets isPrinting to true during print operation', async () => {
    const { result } = renderHook(() => usePrintOrder());

    result.current.printOrder('order-1');

    expect(result.current.isPrinting).toBe(true);
  });

  it('handles order without waiter', async () => {
    const orderWithoutWaiter = { ...mockOrder, waiter_id: null };
    
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'orders') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: orderWithoutWaiter, error: null }),
        } as any;
      } else if (table === 'order_items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => usePrintOrder());

    result.current.printOrder('order-1');

    await waitFor(() => {
      expect(result.current.orderData).not.toBeNull();
    });

    expect(result.current.orderData?.waiterName).toBeNull();
  });
});
