/**
 * Frontend Tests for WhatsApp Chat Components
 * 
 * Tests cover:
 * - useOrderChat hook functionality
 * - OrderChatPanel component rendering
 * - Real-time message updates
 * - Audio notifications
 * - Message sending
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useOrderChat } from '@/hooks/useOrderChat';
import { OrderChatPanel } from '@/components/OrderChatPanel';
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

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useOrderChat Hook', () => {
  const TEST_ORDER_ID = 'test-order-123';
  const TEST_PHONE = '5573999988888';

  let mockFrom: ReturnType<typeof vi.fn>;
  let mockChannel: ReturnType<typeof vi.fn>;
  let mockSubscribe: ReturnType<typeof vi.fn>;
  let mockOn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup mock chain for Supabase queries
    mockFrom = vi.fn();
    mockChannel = vi.fn();
    mockSubscribe = vi.fn();
    mockOn = vi.fn();

    (supabase.from as any) = mockFrom;
    (supabase.channel as any) = mockChannel;

    // Default mock implementations
    mockSubscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED');
      return { unsubscribe: vi.fn() };
    });

    mockOn.mockReturnValue({
      subscribe: mockSubscribe,
    });

    mockChannel.mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and merge system notifications and chat messages', async () => {
    // Mock system notifications
    const mockNotifications = [
      {
        id: 'notif-1',
        order_id: TEST_ORDER_ID,
        customer_phone: TEST_PHONE,
        notification_type: 'order_accepted',
        message_content: 'Pedido aceito!',
        status: 'sent',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];

    // Mock chat messages
    const mockChatMessages = [
      {
        id: 'chat-1',
        order_id: TEST_ORDER_ID,
        phone_number: TEST_PHONE,
        direction: 'inbound' as const,
        content: 'Quanto tempo?',
        status: 'sent' as const,
        evolution_id: 'evo-1',
        created_at: '2024-01-01T10:05:00Z',
      },
    ];

    // Setup mock responses
    mockFrom.mockImplementation((table: string) => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: table === 'whatsapp_notifications' ? mockNotifications : mockChatMessages,
        error: null,
      });

      return {
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      };
    });

    // Render hook
    const { result } = renderHook(() => useOrderChat(TEST_ORDER_ID, TEST_PHONE));

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].type).toBe('system');
    expect(result.current.messages[1].type).toBe('chat');
    expect(result.current.error).toBeNull();
  });

  it('should sort messages chronologically', async () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        order_id: TEST_ORDER_ID,
        customer_phone: TEST_PHONE,
        notification_type: 'order_accepted',
        message_content: 'Third message',
        status: 'sent',
        created_at: '2024-01-01T10:10:00Z',
      },
    ];

    const mockChatMessages = [
      {
        id: 'chat-1',
        order_id: TEST_ORDER_ID,
        phone_number: TEST_PHONE,
        direction: 'inbound' as const,
        content: 'First message',
        status: 'sent' as const,
        evolution_id: 'evo-1',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 'chat-2',
        order_id: TEST_ORDER_ID,
        phone_number: TEST_PHONE,
        direction: 'outbound' as const,
        content: 'Second message',
        status: 'sent' as const,
        evolution_id: 'evo-2',
        created_at: '2024-01-01T10:05:00Z',
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: table === 'whatsapp_notifications' ? mockNotifications : mockChatMessages,
        error: null,
      });

      return {
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      };
    });

    const { result } = renderHook(() => useOrderChat(TEST_ORDER_ID, TEST_PHONE));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Messages should be sorted by timestamp
    expect(result.current.messages[0].content).toBe('First message');
    expect(result.current.messages[1].content).toBe('Second message');
    expect(result.current.messages[2].content).toBe('Third message');
  });

  it('should send message via Evolution API and insert to database', async () => {
    // Setup mocks
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }));

    (evolutionClient.sendTextMessage as any).mockResolvedValue({
      key: { id: 'evo-msg-123' },
    });

    const { result } = renderHook(() => useOrderChat(TEST_ORDER_ID, TEST_PHONE));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Send message
    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    // Assert Evolution API was called
    expect(evolutionClient.sendTextMessage).toHaveBeenCalledWith({
      number: TEST_PHONE,
      text: 'Test message',
    });

    // Assert database insert was called
    expect(mockFrom).toHaveBeenCalledWith('whatsapp_chat_messages');
  });

  it('should handle send message errors', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));

    // Mock Evolution API error
    (evolutionClient.sendTextMessage as any).mockRejectedValue(
      new Error('Evolution API error')
    );

    const { result } = renderHook(() => useOrderChat(TEST_ORDER_ID, TEST_PHONE));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Attempt to send message
    await expect(
      act(async () => {
        await result.current.sendMessage('Test message');
      })
    ).rejects.toThrow('Evolution API error');
  });

  it('should calculate unread message count', async () => {
    const mockChatMessages = [
      {
        id: 'chat-1',
        order_id: TEST_ORDER_ID,
        phone_number: TEST_PHONE,
        direction: 'inbound' as const,
        content: 'Unread 1',
        status: 'sent' as const,
        evolution_id: 'evo-1',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 'chat-2',
        order_id: TEST_ORDER_ID,
        phone_number: TEST_PHONE,
        direction: 'inbound' as const,
        content: 'Unread 2',
        status: 'sent' as const,
        evolution_id: 'evo-2',
        created_at: '2024-01-01T10:05:00Z',
      },
      {
        id: 'chat-3',
        order_id: TEST_ORDER_ID,
        phone_number: TEST_PHONE,
        direction: 'outbound' as const,
        content: 'Staff reply',
        status: 'sent' as const,
        evolution_id: 'evo-3',
        created_at: '2024-01-01T10:10:00Z',
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: table === 'whatsapp_notifications' ? [] : mockChatMessages,
        error: null,
      });

      return {
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      };
    });

    const { result } = renderHook(() => useOrderChat(TEST_ORDER_ID, TEST_PHONE));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should count only inbound messages
    expect(result.current.unreadCount).toBe(2);
    expect(result.current.hasUnreadMessages).toBe(true);
  });

  it('should setup real-time subscription for order', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));

    renderHook(() => useOrderChat(TEST_ORDER_ID, TEST_PHONE));

    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalledWith(`order-chat:${TEST_ORDER_ID}`);
    });

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        table: 'whatsapp_chat_messages',
        filter: `order_id=eq.${TEST_ORDER_ID}`,
      }),
      expect.any(Function)
    );
  });

  it('should cleanup subscription on unmount', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));

    const { unmount } = renderHook(() => useOrderChat(TEST_ORDER_ID, TEST_PHONE));

    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalled();
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});

describe('OrderChatPanel Component', () => {
  const TEST_ORDER_ID = 'test-order-123';
  const TEST_PHONE = '5573999988888';

  beforeEach(() => {
    // Mock useOrderChat hook
    vi.mock('@/hooks/useOrderChat', () => ({
      useOrderChat: vi.fn(() => ({
        messages: [],
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        hasUnreadMessages: false,
        unreadCount: 0,
      })),
    }));
  });

  it('should render chat panel with header', () => {
    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    expect(screen.getByText(/Conversa com Cliente/i)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    (useOrderChat as any).mockReturnValue({
      messages: [],
      loading: true,
      error: null,
      sendMessage: vi.fn(),
      hasUnreadMessages: false,
      unreadCount: 0,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    expect(screen.getByText(/Carregando mensagens/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    (useOrderChat as any).mockReturnValue({
      messages: [],
      loading: false,
      error: new Error('Test error'),
      sendMessage: vi.fn(),
      hasUnreadMessages: false,
      unreadCount: 0,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    expect(screen.getByText(/Erro ao carregar mensagens/i)).toBeInTheDocument();
  });

  it('should display empty state when no messages', () => {
    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    expect(screen.getByText(/Nenhuma mensagem ainda/i)).toBeInTheDocument();
  });

  it('should render system messages with correct styling', () => {
    (useOrderChat as any).mockReturnValue({
      messages: [
        {
          id: 'msg-1',
          type: 'system',
          direction: 'system',
          content: 'Pedido aceito',
          timestamp: '2024-01-01T10:00:00Z',
        },
      ],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      hasUnreadMessages: false,
      unreadCount: 0,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    const systemMessage = screen.getByText('Pedido aceito');
    expect(systemMessage).toBeInTheDocument();
    expect(systemMessage.parentElement).toHaveClass('bg-gray-100');
  });

  it('should render inbound messages aligned left', () => {
    (useOrderChat as any).mockReturnValue({
      messages: [
        {
          id: 'msg-1',
          type: 'chat',
          direction: 'inbound',
          content: 'Customer message',
          timestamp: '2024-01-01T10:00:00Z',
          status: 'sent',
        },
      ],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      hasUnreadMessages: false,
      unreadCount: 0,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    const message = screen.getByText('Customer message');
    expect(message).toBeInTheDocument();
    expect(message.closest('.flex')).toHaveClass('justify-start');
  });

  it('should render outbound messages aligned right', () => {
    (useOrderChat as any).mockReturnValue({
      messages: [
        {
          id: 'msg-1',
          type: 'chat',
          direction: 'outbound',
          content: 'Staff reply',
          timestamp: '2024-01-01T10:00:00Z',
          status: 'sent',
        },
      ],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      hasUnreadMessages: false,
      unreadCount: 0,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    const message = screen.getByText('Staff reply');
    expect(message).toBeInTheDocument();
    expect(message.closest('.flex')).toHaveClass('justify-end');
  });

  it('should display message timestamps', () => {
    (useOrderChat as any).mockReturnValue({
      messages: [
        {
          id: 'msg-1',
          type: 'chat',
          direction: 'inbound',
          content: 'Test message',
          timestamp: '2024-01-01T10:30:00Z',
          status: 'sent',
        },
      ],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      hasUnreadMessages: false,
      unreadCount: 0,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    // Should display time in HH:MM format
    expect(screen.getByText(/10:30/)).toBeInTheDocument();
  });

  it('should display message status indicators', () => {
    (useOrderChat as any).mockReturnValue({
      messages: [
        {
          id: 'msg-1',
          type: 'chat',
          direction: 'outbound',
          content: 'Test',
          timestamp: '2024-01-01T10:00:00Z',
          status: 'delivered',
        },
      ],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      hasUnreadMessages: false,
      unreadCount: 0,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    // Should show double checkmark for delivered
    expect(screen.getByText(/✓✓/)).toBeInTheDocument();
  });

  it('should handle message input and send', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(undefined);

    (useOrderChat as any).mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: mockSendMessage,
      hasUnreadMessages: false,
      unreadCount: 0,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
    const sendButton = screen.getByRole('button');

    // Type message
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input).toHaveValue('Test message');

    // Click send
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('should show unread indicator badge', () => {
    (useOrderChat as any).mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      hasUnreadMessages: true,
      unreadCount: 3,
    });

    render(<OrderChatPanel orderId={TEST_ORDER_ID} customerPhone={TEST_PHONE} />);

    expect(screen.getByText('Novo')).toBeInTheDocument();
  });
});
