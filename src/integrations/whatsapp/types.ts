// Baileys WhatsApp API Types
export interface WhatsAppConnectionStatus {
  isConnected: boolean;
  qrCode?: string;
  lastConnected?: Date;
  phoneNumber?: string;
}

export interface WhatsAppSessionData {
  creds: any;
  keys: any;
}

export interface WhatsAppSession {
  id: string;
  sessionId: string;
  sessionData: WhatsAppSessionData;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

export interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
  };
}

// Notification System Types
export type NotificationType = 'payment_confirmed' | 'preparing' | 'ready' | 'custom';

export interface NotificationRequest {
  orderId: string;
  customerPhone: string;
  customerName: string;
  notificationType: NotificationType;
  orderDetails?: OrderData;
  customMessage?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount: number;
}

export interface QueuedNotification {
  id: string;
  orderId: string;
  customerPhone: string;
  notificationType: NotificationType;
  messageContent: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  scheduledAt: Date;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export interface MessageTemplate {
  id: string;
  templateType: NotificationType;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderData {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  tableNumber: string;
  totalAmount: number;
  items: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  paymentConfirmedAt?: string;
}

// Service Interfaces
export interface WhatsAppConnectionManager {
  initialize(): Promise<void>;
  getConnectionStatus(): WhatsAppConnectionStatus;
  restoreSession(): Promise<boolean>;
  saveSession(sessionData: WhatsAppSessionData): Promise<void>;
  onConnectionUpdate(callback: (status: WhatsAppConnectionStatus) => void): void;
}

export interface WhatsAppMessageService {
  sendNotification(notification: NotificationRequest): Promise<NotificationResult>;
  sendCustomMessage(phone: string, message: string): Promise<MessageResult>;
  validatePhoneNumber(phone: string): ValidationResult;
  checkWhatsAppExists(phone: string): Promise<boolean>;
}

export interface NotificationQueueManager {
  enqueue(notification: QueuedNotification): Promise<void>;
  processPendingNotifications(): Promise<ProcessResult[]>;
  retryFailedNotifications(): Promise<void>;
  getQueueStats(): Promise<QueueStats>;
}

export interface MessageTemplateManager {
  getTemplate(type: NotificationType): Promise<MessageTemplate>;
  renderTemplate(template: MessageTemplate, data: OrderData): string;
  updateTemplate(type: NotificationType, template: MessageTemplate): Promise<void>;
}

// Utility Types
export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  error?: string;
}

export interface ProcessResult {
  notificationId: string;
  success: boolean;
  error?: string;
}

export interface QueueStats {
  pending: number;
  sent: number;
  failed: number;
  totalToday: number;
  deliveryRate: number;
}