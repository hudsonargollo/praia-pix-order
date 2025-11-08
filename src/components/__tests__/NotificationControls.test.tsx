import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationControls } from '../NotificationControls';
import { notificationTriggers } from '@/integrations/whatsapp';
import { whatsappClient } from '@/integrations/whatsapp/client';
import type { NotificationHistory } from '@/hooks/useNotificationHistory';

// Mock dependencies
vi.mock('@/integrations/whatsapp', () => ({
  notificationTriggers: {
    onOrderReady: vi.fn(),
  },
}));

vi.mock('@/integrations/whatsapp/client', () => ({
  whatsappClient: {
    sendTextMessage: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NotificationControls', () => {
  const mockProps = {
    orderId: 'order-123',
    orderNumber: 42,
    customerPhone: '+5511999999999',
    customerName: 'João Silva',
    orderStatus: 'ready',
    onNotificationSent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification controls with no history', () => {
    render(<NotificationControls {...mockProps} />);
    
    expect(screen.getByText('Status da Notificação:')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument();
    expect(screen.getByText('Notificar Pronto')).toBeInTheDocument();
    expect(screen.getByText('Mensagem')).toBeInTheDocument();
  });

  it('displays sent notification status', () => {
    const notificationHistory: NotificationHistory = {
      orderId: 'order-123',
      notifications: [{
        id: 'notif-1',
        order_id: 'order-123',
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
      }],
      lastNotification: {
        id: 'notif-1',
        order_id: 'order-123',
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
      hasFailedNotifications: false,
      totalAttempts: 1,
    };

    render(<NotificationControls {...mockProps} notificationHistory={notificationHistory} />);
    
    expect(screen.getByText('Enviada')).toBeInTheDocument();
    expect(screen.getByText(/Última enviada:/)).toBeInTheDocument();
    expect(screen.getByText(/Tipo: ready/)).toBeInTheDocument();
  });

  it('displays failed notification status with error message', () => {
    const notificationHistory: NotificationHistory = {
      orderId: 'order-123',
      notifications: [{
        id: 'notif-1',
        order_id: 'order-123',
        phone: '+5511999999999',
        customer_phone: '+5511999999999',
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
      }],
      lastNotification: {
        id: 'notif-1',
        order_id: 'order-123',
        phone: '+5511999999999',
        customer_phone: '+5511999999999',
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
      hasFailedNotifications: true,
      totalAttempts: 3,
    };

    render(<NotificationControls {...mockProps} notificationHistory={notificationHistory} />);
    
    expect(screen.getByText('Falhou')).toBeInTheDocument();
    expect(screen.getByText(/Tentativas: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Erro: Network error/)).toBeInTheDocument();
    expect(screen.getByText(/Notificações falharam - requer atenção/)).toBeInTheDocument();
  });

  it('sends ready notification when button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(notificationTriggers.onOrderReady).mockResolvedValue(undefined);

    render(<NotificationControls {...mockProps} />);
    
    const notifyButton = screen.getByText('Notificar Pronto');
    await user.click(notifyButton);

    await waitFor(() => {
      expect(notificationTriggers.onOrderReady).toHaveBeenCalledWith('order-123');
      expect(mockProps.onNotificationSent).toHaveBeenCalled();
    });
  });

  it('opens custom message dialog and sends message', async () => {
    const user = userEvent.setup();
    vi.mocked(whatsappClient.sendTextMessage).mockResolvedValue('msg-id-123');

    render(<NotificationControls {...mockProps} />);
    
    // Open dialog
    const messageButton = screen.getByText('Mensagem');
    await user.click(messageButton);

    // Check dialog is open
    expect(screen.getByText('Enviar Mensagem Personalizada')).toBeInTheDocument();
    expect(screen.getByText(/Envie uma mensagem WhatsApp personalizada para/)).toBeInTheDocument();

    // Type custom message
    const textarea = screen.getByPlaceholderText('Digite sua mensagem aqui...');
    await user.type(textarea, 'Olá! Seu pedido está pronto para retirada.');

    // Check preview
    expect(screen.getByText('Olá! Seu pedido está pronto para retirada.')).toBeInTheDocument();

    // Send message
    const sendButton = screen.getByText('Enviar Mensagem');
    await user.click(sendButton);

    await waitFor(() => {
      expect(whatsappClient.sendTextMessage).toHaveBeenCalledWith(
        '+5511999999999',
        'Olá! Seu pedido está pronto para retirada.'
      );
      expect(mockProps.onNotificationSent).toHaveBeenCalled();
    });
  });

  it('shows character count in custom message dialog', async () => {
    const user = userEvent.setup();

    render(<NotificationControls {...mockProps} />);
    
    const messageButton = screen.getByText('Mensagem');
    await user.click(messageButton);

    const textarea = screen.getByPlaceholderText('Digite sua mensagem aqui...');
    await user.type(textarea, 'Test message');

    expect(screen.getByText('12/4096 caracteres')).toBeInTheDocument();
  });

  it('disables send button when message is empty', async () => {
    const user = userEvent.setup();

    render(<NotificationControls {...mockProps} />);
    
    const messageButton = screen.getByText('Mensagem');
    await user.click(messageButton);

    const sendButton = screen.getByText('Enviar Mensagem');
    expect(sendButton).toBeDisabled();
  });

  it('shows loading state when sending notification', async () => {
    const user = userEvent.setup();
    vi.mocked(notificationTriggers.onOrderReady).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<NotificationControls {...mockProps} />);
    
    const notifyButton = screen.getByText('Notificar Pronto');
    await user.click(notifyButton);

    expect(screen.getByText('Enviando...')).toBeInTheDocument();
  });
});
