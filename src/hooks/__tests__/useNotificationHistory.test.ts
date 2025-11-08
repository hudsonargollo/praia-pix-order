import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotificationHistory } from '../useNotificationHistory';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

describe('useNotificationHistory', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      order_id: 'order-1',
      phone: '+5511999999999',
      customer_phone: '+5511999999999',
      notification_type: 'ready',
      message_type: 'text',
      message_content: 'Seu pedido está pronto!',
      status: 'sent',
      attempts: 1,
      scheduled_at: '2024-01-01T10:00:00Z',
      sent_at: '2024-01-01T10:00:05Z',
      error_message: null,
      whatsapp_message_id: 'msg-123',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:05Z',
    },
    {
      id: 'notif-2',
      order_id: 'order-1',
      phone: '+5511999999999',
      customer_phone: '+5511999999999',
      notification_type: 'payment_confirmed',
      message_type: 'text',
      message_content: 'Pagamento confirmado!',
      status: 'sent',
      attempts: 1,
      scheduled_at: '2024-01-01T09:00:00Z',
      sent_at: '2024-01-01T09:00:05Z',
      error_message: null,
      whatsapp_message_id: 'msg-122',
      created_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T09:00:05Z',
    },
    {
      id: 'notif-3',
      order_id: 'order-2',
      phone: '+5511888888888',
      customer_phone: '+5511888888888',
      notification_type: 'ready',
      message_type: 'text',
      message_content: 'Seu pedido está pronto!',
      status: 'failed',
      attempts: 3,
      scheduled_at: '2024-01-01T10:00:00Z',
      sent_at: null,
      error_message: 'Network error',
      whatsapp_message_id: null,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:15Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase query chain
    const mockSelect = vi.fn().mockReturnThis();
    const mockIn = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: mockNotifications, error: null });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      in: mockIn,
      order: mockOrder,
    } as any);

    // Mock Supabase realtime subscription
    const mockSubscribe = vi.fn();
    const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
    vi.mocked(supabase.channel).mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
    } as any);

    mockSubscribe.mockReturnValue({
      unsubscribe: vi.fn(),
    });
  });

  it('loads notification history for given order IDs', async () => {
    const { result } = renderHook(() => useNotificationHistory(['order-1', 'order-2']));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.history.size).toBe(2);
    
    const order1History = result.current.history.get('order-1');
    expect(order1History).toBeDefined();
    expect(order1History?.notifications).toHaveLength(2);
    expect(order1History?.lastNotification?.id).toBe('notif-1');
    expect(order1History?.hasFailedNotifications).toBe(false);
    expect(order1History?.totalAttempts).toBe(2);

    const order2History = result.current.history.get('order-2');
    expect(order2History).toBeDefined();
    expect(order2History?.notifications).toHaveLength(1);
    expect(order2History?.lastNotification?.id).toBe('notif-3');
    expect(order2History?.hasFailedNotifications).toBe(true);
    expect(order2History?.totalAttempts).toBe(3);
  });

  it('returns empty history when no order IDs provided', async () => {
    const { result } = renderHook(() => useNotificationHistory([]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.history.size).toBe(0);
  });

  it('identifies failed notifications correctly', async () => {
    const { result } = renderHook(() => useNotificationHistory(['order-2']));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const order2History = result.current.history.get('order-2');
    expect(order2History?.hasFailedNotifications).toBe(true);
    expect(order2History?.lastNotification?.status).toBe('failed');
    expect(order2History?.lastNotification?.error_message).toBe('Network error');
  });

  it('calculates total attempts correctly', async () => {
    const { result } = renderHook(() => useNotificationHistory(['order-1']));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const order1History = result.current.history.get('order-1');
    expect(order1History?.totalAttempts).toBe(2); // 1 + 1 from two notifications
  });

  it('provides refresh function', async () => {
    const { result } = renderHook(() => useNotificationHistory(['order-1']));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.refresh).toBeDefined();
    expect(typeof result.current.refresh).toBe('function');
  });
});
