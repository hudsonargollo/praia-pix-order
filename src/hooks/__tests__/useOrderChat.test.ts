import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrderChat } from '../useOrderChat';
import { supabase } from '@/integrations/supabase/client';
import { evolutionClient } from '@/integrations/whatsapp/evolution-client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

// Mock Evolution API client
vi.mock('@/integrations/whatsapp/evolution-client', () => ({
  evolutionClient: {
    sendTextMessage: vi.fn(),
  },
}));

describe('useOrderChat', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      order_id: 'order-1',
      customer_phone: '5511999999999',
      notification_type: 'payment_confirmed',
      message_content: 'Pagamento confirmado!',
      status: 'sent',
      created_at: '2024-01-01T09:00:00Z',
    },
    {
      id: 'notif-2',
      order_id: 'order-1',
      customer_phone: '5511999999999',
      notification_type: 'ready',
      message_content: 'Seu pedido está pronto!',
      status: 'sent',
      created_at: '2024-01-01T10:00:00Z',
    },
  ];

  const mockChatMessages = [
    {
      id: 'chat-1',
      order_id: 'order-1',
      phone_number: '5511999999999',
      direction: 'inbound' as const,
      content: 'Quanto tempo vai demorar?',
      status: 'sent' as const,
      evolution_id: 'evo-123',
      created_at: '2024-01-01T09:30:00Z',
    },
    {
      id: 'chat-2',
      order_id: 'order-1',
      phone_number: '5511999999999',
      direction: 'outbound' as const,
      content: 'Cerca de 15 minutos!',
      status: 'sent' as const,
      evolution_id: 'evo-124',
      created_at: '2024-01-01T09:31:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase query chain for notifications
    const mockNotificationsSelect = vi.fn().mockReturnThis();
    const mockNotificationsEq = vi.fn().mockReturnThis();
    const mockNotificationsOrder = vi.fn().mockResolvedValue({ 
      data: mockNotifications, 
      error: null 
    });

    // Mock Supabase query chain for chat messages
    const mockChatSelect = vi.fn().mockReturnThis();
    const mockChatEq = vi.fn().mockReturnThis();
    const mockChatOrder = vi.fn().mockResolvedValue({ 
      data: mockChatMessages, 
      error: null 
    });

    // Mock Supabase insert chain
    const mockInsert = vi.fn().mockResolvedValue({ 
      data: null, 
      error: null 
    });

    // Setup from() mock to return different chains based on table name
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'whatsapp_notifications') {
        return {
          select: mockNotificationsSelect,
          eq: mockNotificationsEq,
          order: mockNotificationsOrder,
        } as any;
      } else if (table === 'whatsapp_chat_messages') {
        return {
          select: mockChatSelect,
          eq: mockChatEq,
          order: mockChatOrder,
          insert: mockInsert,
        } as any;
      }
      return {} as any;
    });

    // Mock Supabase realtime subscription
    const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
    const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
    vi.mocked(supabase.channel).mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
    } as any);

    // Mock Evolution API
    vi.mocked(evolutionClient.sendTextMessage).mockResolvedValue({
      key: { id: 'evo-125', remoteJid: '5511999999999@s.whatsapp.net', fromMe: true },
    });
  });

  it('loads and merges messages from both tables', async () => {
    const { result } = renderHook(() => 
      useOrderChat('order-1', '5511999999999')
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have 4 messages total (2 notifications + 2 chat messages)
    expect(result.current.messages).toHaveLength(4);
    
    // Messages should be sorted chronologically
    expect(result.current.messages[0].id).toBe('notif-1');
    expect(result.current.messages[1].id).toBe('chat-1');
    expect(result.current.messages[2].id).toBe('chat-2');
    expect(result.current.messages[3].id).toBe('notif-2');
  });

  it('distinguishes between system and chat messages', async () => {
    const { result } = renderHook(() => 
      useOrderChat('order-1', '5511999999999')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const systemMessages = result.current.messages.filter(m => m.type === 'system');
    const chatMessages = result.current.messages.filter(m => m.type === 'chat');

    expect(systemMessages).toHaveLength(2);
    expect(chatMessages).toHaveLength(2);

    // System messages should have 'system' direction
    systemMessages.forEach(msg => {
      expect(msg.direction).toBe('system');
    });

    // Chat messages should have 'inbound' or 'outbound' direction
    chatMessages.forEach(msg => {
      expect(['inbound', 'outbound']).toContain(msg.direction);
    });
  });

  it('tracks unread message count', async () => {
    const { result } = renderHook(() => 
      useOrderChat('order-1', '5511999999999')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have 1 unread inbound message initially
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.hasUnreadMessages).toBe(true);
  });

  it('sends messages via Evolution API and inserts to database', async () => {
    const { result } = renderHook(() => 
      useOrderChat('order-1', '5511999999999')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.sendMessage('Obrigado!');

    // Should call Evolution API
    expect(evolutionClient.sendTextMessage).toHaveBeenCalledWith({
      number: '5511999999999',
      text: 'Obrigado!',
    });

    // Should insert to database
    expect(supabase.from).toHaveBeenCalledWith('whatsapp_chat_messages');
  });

  it('handles empty order ID gracefully', async () => {
    const { result } = renderHook(() => 
      useOrderChat(null, null)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('handles errors when fetching messages', async () => {
    const mockError = new Error('Database error');
    
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    } as any));

    const { result } = renderHook(() => 
      useOrderChat('order-1', '5511999999999')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('throws error when sending message without order ID', async () => {
    const { result } = renderHook(() => 
      useOrderChat(null, '5511999999999')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.sendMessage('Test')).rejects.toThrow(
      'Order ID and customer phone are required to send messages'
    );
  });

  it('throws error when sending empty message', async () => {
    const { result } = renderHook(() => 
      useOrderChat('order-1', '5511999999999')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.sendMessage('   ')).rejects.toThrow(
      'Message content cannot be empty'
    );
  });
});
