# WhatsApp Notifications System Design

## Overview

The WhatsApp notification system integrates Baileys API with the existing Coco Loko Açaiteria infrastructure to provide automated customer notifications throughout the order lifecycle. The system is designed for reliability, scalability, and ease of maintenance.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase       │    │   Cloudflare    │
│   (React)       │    │   (Database +    │    │   Functions     │
│                 │    │    Realtime)     │    │                 │
│ ┌─────────────┐ │    │                  │    │ ┌─────────────┐ │
│ │ Cashier     │ │◄──►│ ┌──────────────┐ │◄──►│ │ WhatsApp    │ │
│ │ Dashboard   │ │    │ │ Orders Table │ │    │ │ Service     │ │
│ └─────────────┘ │    │ │              │ │    │ │ (Baileys)   │ │
│                 │    │ └──────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │                  │    │        │        │
│ │ Order       │ │    │ ┌──────────────┐ │    │        ▼        │
│ │ Status      │ │    │ │ Notifications│ │    │ ┌─────────────┐ │
│ │ Updates     │ │    │ │ Queue        │ │    │ │ WhatsApp    │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ Web API     │ │
└─────────────────┘    └──────────────────┘    │ └─────────────┘ │
                                               └─────────────────┘
```

### Component Architecture

#### 1. WhatsApp Service Layer
- **Location**: Cloudflare Functions (`functions/api/whatsapp/`)
- **Responsibilities**: 
  - Baileys API integration
  - Session management
  - Message sending and queuing
  - Error handling and retries

#### 2. Database Schema Extensions
- **whatsapp_sessions**: Store Baileys session data
- **whatsapp_notifications**: Queue and track notifications
- **notification_templates**: Configurable message templates

#### 3. Frontend Integration
- **Cashier Dashboard**: Manual notification controls
- **Order Status**: Real-time notification status display
- **Admin Panel**: Configuration and monitoring

## Components and Interfaces

### 1. WhatsApp Connection Manager

```typescript
interface WhatsAppConnectionManager {
  // Initialize WhatsApp connection
  initialize(): Promise<void>;
  
  // Get current connection status
  getConnectionStatus(): ConnectionStatus;
  
  // Restore session from database
  restoreSession(): Promise<boolean>;
  
  // Save session to database
  saveSession(sessionData: SessionData): Promise<void>;
  
  // Handle connection events
  onConnectionUpdate(callback: (status: ConnectionStatus) => void): void;
}

interface ConnectionStatus {
  isConnected: boolean;
  qrCode?: string;
  lastConnected?: Date;
  phoneNumber?: string;
}
```

### 2. Message Service

```typescript
interface WhatsAppMessageService {
  // Send notification message
  sendNotification(notification: NotificationRequest): Promise<NotificationResult>;
  
  // Send custom message
  sendCustomMessage(phone: string, message: string): Promise<MessageResult>;
  
  // Validate phone number
  validatePhoneNumber(phone: string): ValidationResult;
  
  // Check if number has WhatsApp
  checkWhatsAppExists(phone: string): Promise<boolean>;
}

interface NotificationRequest {
  orderId: string;
  customerPhone: string;
  customerName: string;
  notificationType: 'payment_confirmed' | 'preparing' | 'ready';
  orderDetails?: OrderDetails;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount: number;
}
```

### 3. Notification Queue Manager

```typescript
interface NotificationQueueManager {
  // Add notification to queue
  enqueue(notification: QueuedNotification): Promise<void>;
  
  // Process pending notifications
  processPendingNotifications(): Promise<ProcessResult[]>;
  
  // Retry failed notifications
  retryFailedNotifications(): Promise<void>;
  
  // Get queue statistics
  getQueueStats(): Promise<QueueStats>;
}

interface QueuedNotification {
  id: string;
  orderId: string;
  customerPhone: string;
  message: string;
  notificationType: string;
  scheduledAt: Date;
  attempts: number;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}
```

### 4. Template Manager

```typescript
interface MessageTemplateManager {
  // Get template by type
  getTemplate(type: NotificationType): MessageTemplate;
  
  // Render template with order data
  renderTemplate(template: MessageTemplate, data: OrderData): string;
  
  // Update template
  updateTemplate(type: NotificationType, template: MessageTemplate): Promise<void>;
}

interface MessageTemplate {
  id: string;
  type: NotificationType;
  content: string;
  variables: string[];
  isActive: boolean;
}
```

## Data Models

### Database Tables

#### whatsapp_sessions
```sql
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  session_data JSONB NOT NULL,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### whatsapp_notifications
```sql
CREATE TABLE whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  customer_phone TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### notification_templates
```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

### Error Categories and Responses

1. **Connection Errors**
   - WhatsApp Web disconnection
   - Network connectivity issues
   - Session expiration

2. **Message Delivery Errors**
   - Invalid phone numbers
   - WhatsApp account not found
   - Rate limiting

3. **System Errors**
   - Database connectivity
   - Function timeout
   - Memory limitations

### Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: 3;
  baseDelay: 1000; // 1 second
  maxDelay: 30000; // 30 seconds
  backoffMultiplier: 2;
}

// Retry schedule: 1s, 2s, 4s, then fail
```

### Error Recovery

1. **Automatic Recovery**
   - Session restoration on connection loss
   - Queue processing resumption
   - Failed message retry with exponential backoff

2. **Manual Recovery**
   - Admin dashboard for connection management
   - Manual message retry from cashier dashboard
   - QR code re-scanning interface

## Testing Strategy

### Unit Tests
- Message formatting and template rendering
- Phone number validation and formatting
- Queue management operations
- Error handling scenarios

### Integration Tests
- Baileys API connection and session management
- Database operations for notifications
- End-to-end message delivery flow
- Real-time order status integration

### Mock Testing
- WhatsApp API simulation for development
- Notification delivery simulation
- Connection status mocking

### Performance Tests
- Message queue throughput
- Concurrent notification handling
- Memory usage during high load
- Connection stability over time

## Security Considerations

### Data Protection
- Encrypt phone numbers in database storage
- Secure session data with encryption at rest
- Implement proper access controls for admin functions

### WhatsApp Compliance
- Respect WhatsApp Terms of Service
- Implement opt-out mechanisms
- Avoid spam-like behavior with rate limiting

### API Security
- Validate all incoming requests
- Implement proper authentication for admin functions
- Use HTTPS for all communications

## Deployment Strategy

### Environment Configuration
```typescript
interface WhatsAppConfig {
  WHATSAPP_SESSION_ID: string;
  WHATSAPP_WEBHOOK_SECRET: string;
  NOTIFICATION_RETRY_ATTEMPTS: number;
  MESSAGE_QUEUE_BATCH_SIZE: number;
  CONNECTION_TIMEOUT_MS: number;
}
```

### Monitoring and Logging
- Connection status monitoring
- Message delivery rate tracking
- Error rate alerting
- Performance metrics collection

### Scalability Considerations
- Horizontal scaling with multiple WhatsApp sessions
- Queue partitioning for high throughput
- Connection pooling for database operations
- Caching for frequently accessed templates