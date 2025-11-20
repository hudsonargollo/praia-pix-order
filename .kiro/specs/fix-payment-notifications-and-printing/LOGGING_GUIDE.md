# Comprehensive Logging Guide

## Overview

This document describes the comprehensive logging system implemented for payment confirmations, WhatsApp notifications, and auto-print functionality. All logs follow a structured format with consistent prefixes for easy filtering and debugging.

## Log Prefixes

All logs use consistent prefixes to identify their source:

- `[PaymentConfirmationService]` - Payment confirmation service operations
- `[confirm-payment]` - Edge function for payment confirmation
- `[QueueManager]` - WhatsApp notification queue management
- `[NotificationTriggers]` - Notification trigger events
- `[useAutoPrint]` - Auto-print hook operations

## Payment Confirmation Logging

### Entry Point
```javascript
[PaymentConfirmationService] Payment confirmation requested: {
  orderId: "uuid",
  source: "manual" | "webhook" | "mercadopago",
  paymentMethod: "pix" | "credit_card",
  paymentId: "payment-id",
  timestamp: "ISO-8601"
}
```

### Deduplication Check
```javascript
// When duplicate detected
[PaymentConfirmationService] Payment confirmation skipped - notification recently sent: {
  orderId: "uuid",
  source: "manual",
  reason: "deduplication_check_passed",
  timestamp: "ISO-8601"
}

// When no duplicate found
[PaymentConfirmationService] Deduplication check passed - proceeding with confirmation: {
  orderId: "uuid",
  source: "manual"
}

// Recent notification details
[PaymentConfirmationService] Recent notification found - preventing duplicate: {
  orderId: "uuid",
  notificationId: "uuid",
  notificationType: "payment_confirmed",
  sentAt: "ISO-8601",
  timeSinceNotification: "45s",
  deduplicationWindow: "5 minutes"
}
```

### Database Updates
```javascript
[PaymentConfirmationService] Updating order in database: {
  orderId: "uuid",
  updates: {
    status: "in_preparation",
    payment_status: "confirmed",
    payment_confirmed_at: "ISO-8601",
    payment_method: "pix"
  }
}

[PaymentConfirmationService] Order updated successfully: {
  orderId: "uuid",
  orderNumber: 123,
  status: "in_preparation",
  paymentStatus: "confirmed",
  paymentConfirmedAt: "ISO-8601"
}
```

### Event Logging
```javascript
[PaymentConfirmationService] Logging event: payment_confirmed {
  orderId: "uuid",
  event: "payment_confirmed",
  data: {
    source: "manual",
    paymentMethod: "pix",
    notificationSent: true
  },
  timestamp: "ISO-8601"
}

[PaymentConfirmationService] Event logged successfully to payment_confirmation_log: {
  event: "payment_confirmed",
  orderId: "uuid",
  source: "manual",
  notificationSent: true,
  timestamp: "ISO-8601"
}
```

### Completion
```javascript
[PaymentConfirmationService] Payment confirmation completed successfully: {
  orderId: "uuid",
  source: "manual",
  paymentMethod: "pix",
  paymentId: "payment-id",
  notificationSent: true,
  orderStatus: "in_preparation",
  paymentStatus: "confirmed",
  timestamp: "ISO-8601"
}
```

## WhatsApp Notification Logging

### Notification Triggers

#### Payment Confirmed
```javascript
[NotificationTriggers] Payment confirmed trigger: {
  orderId: "uuid",
  timestamp: "ISO-8601"
}

[NotificationTriggers] Recent notification already sent, skipping payment confirmation: {
  orderId: "uuid",
  recentNotificationId: "uuid",
  recentType: "order_created",
  sentAt: "ISO-8601",
  dedupeKey: "order-id:payment_confirmed:2025-11-20",
  timeSinceLastNotification: "45s"
}

[NotificationTriggers] Payment confirmation notification queued successfully: {
  orderId: "uuid",
  notificationId: "uuid",
  orderNumber: 123,
  customerName: "John Doe",
  paymentMethod: "pix",
  totalAmount: 25.50,
  timestamp: "ISO-8601"
}
```

#### Order Created
```javascript
[NotificationTriggers] Order created with links trigger: {
  orderId: "uuid",
  baseUrl: "https://example.com",
  timestamp: "ISO-8601"
}

[NotificationTriggers] Order creation notification queued successfully: {
  orderId: "uuid",
  notificationId: "uuid",
  orderNumber: 123,
  customerName: "John Doe",
  totalAmount: 25.50,
  timestamp: "ISO-8601"
}
```

### Queue Management

#### Enqueueing
```javascript
[QueueManager] Notification enqueued successfully: {
  id: "notification-uuid",
  orderId: "order-uuid",
  type: "payment_confirmed",
  dedupeKey: "order-id:payment_confirmed:2025-11-20",
  scheduledAt: "ISO-8601"
}
```

#### Batch Processing
```javascript
[QueueManager] Processing batch: {
  count: 5,
  batchSize: 10,
  maxConcurrent: 5,
  notifications: [
    {
      id: "uuid",
      orderId: "uuid",
      type: "payment_confirmed",
      attempts: 0,
      scheduledAt: "ISO-8601"
    }
  ]
}

[QueueManager] Batch processing complete: {
  total: 5,
  successful: 4,
  failed: 1,
  successRate: "80.0%",
  failedNotifications: [
    {
      id: "uuid",
      error: "Network timeout"
    }
  ]
}
```

#### Sending Notifications
```javascript
[QueueManager] Sending notification uuid to +5511999999999

[QueueManager] Notification sent successfully: {
  notificationId: "uuid",
  orderId: "order-uuid",
  type: "payment_confirmed",
  phone: "+5511999999999",
  messageId: "whatsapp-message-id",
  sentAt: "ISO-8601",
  dedupeKey: "order-id:payment_confirmed:2025-11-20",
  attempts: 1
}
```

## Auto-Print Logging

### Initialization
```javascript
[useAutoPrint] Initializing order tracking... {
  enabled: true,
  isAutoPrintEnabled: true,
  timestamp: "ISO-8601"
}

[useAutoPrint] Tracking 3 existing orders: {
  orders: [
    {
      id: "uuid",
      orderNumber: 123,
      status: "in_preparation",
      createdAt: "ISO-8601"
    }
  ]
}

[useAutoPrint] Order tracking initialization complete
```

### State Changes
```javascript
[useAutoPrint] Auto-print toggled: {
  previousValue: false,
  newValue: true,
  timestamp: "ISO-8601"
}

[useAutoPrint] Auto-print state saved to localStorage: {
  enabled: true,
  timestamp: "ISO-8601"
}
```

### Order Insert Detection
```javascript
[useAutoPrint] New order inserted: {
  orderId: "uuid",
  orderNumber: 123,
  status: "in_preparation",
  customerName: "John Doe",
  totalAmount: 25.50,
  createdAt: "ISO-8601",
  timestamp: "ISO-8601"
}

[useAutoPrint] Auto-print triggered - new order in preparation: {
  orderId: "uuid",
  orderNumber: 123,
  customerName: "John Doe",
  totalAmount: 25.50,
  reason: "order_inserted_with_in_preparation_status",
  timestamp: "ISO-8601"
}

[useAutoPrint] Auto-print completed successfully for new order: {
  orderId: "uuid",
  orderNumber: 123,
  timestamp: "ISO-8601"
}
```

### Status Change Detection
```javascript
[useAutoPrint] Order status change detected: {
  orderId: "uuid",
  orderNumber: 123,
  previousStatus: "pending_payment",
  currentStatus: "in_preparation",
  timestamp: "ISO-8601"
}

[useAutoPrint] Auto-print triggered - status transition: {
  orderId: "uuid",
  orderNumber: 123,
  transition: "pending_payment → in_preparation",
  customerName: "John Doe",
  totalAmount: 25.50,
  timestamp: "ISO-8601"
}

[useAutoPrint] Auto-print completed successfully: {
  orderId: "uuid",
  orderNumber: 123,
  timestamp: "ISO-8601"
}
```

### Error Handling
```javascript
[useAutoPrint] Auto-print failed: {
  orderId: "uuid",
  orderNumber: 123,
  error: "Print server unavailable",
  timestamp: "ISO-8601"
}
```

## Database Logging Tables

### payment_confirmation_log
Tracks all payment confirmation attempts:
```sql
SELECT 
  order_id,
  source,
  payment_method,
  payment_id,
  notification_sent,
  notification_error,
  created_at
FROM payment_confirmation_log
WHERE order_id = 'uuid'
ORDER BY created_at DESC;
```

### whatsapp_notifications
Tracks all WhatsApp notifications with dedupe keys:
```sql
SELECT 
  id,
  order_id,
  notification_type,
  status,
  dedupe_key,
  attempts,
  sent_at,
  error_message,
  created_at
FROM whatsapp_notifications
WHERE order_id = 'uuid'
ORDER BY created_at DESC;
```

### whatsapp_error_logs
Tracks all WhatsApp-related errors:
```sql
SELECT 
  error_type,
  error_message,
  operation,
  order_id,
  customer_phone,
  additional_data,
  created_at
FROM whatsapp_error_logs
WHERE order_id = 'uuid'
ORDER BY created_at DESC;
```

## Debugging Workflows

### Troubleshooting Duplicate Notifications

1. Check payment confirmation log:
```sql
SELECT * FROM payment_confirmation_log 
WHERE order_id = 'uuid' 
ORDER BY created_at DESC;
```

2. Check WhatsApp notifications with dedupe keys:
```sql
SELECT 
  id,
  notification_type,
  status,
  dedupe_key,
  sent_at,
  created_at
FROM whatsapp_notifications
WHERE order_id = 'uuid'
ORDER BY created_at DESC;
```

3. Look for deduplication logs in console:
```
Filter: [PaymentConfirmationService] Recent notification found
Filter: [NotificationTriggers] Recent notification already sent
```

### Troubleshooting Missing Auto-Print

1. Check auto-print initialization:
```
Filter: [useAutoPrint] Initializing order tracking
Filter: [useAutoPrint] Tracking
```

2. Check order status changes:
```
Filter: [useAutoPrint] Order status change detected
Filter: [useAutoPrint] Auto-print triggered
```

3. Check for errors:
```
Filter: [useAutoPrint] Auto-print failed
Filter: [useAutoPrint] Error
```

### Troubleshooting Failed Notifications

1. Check queue processing:
```
Filter: [QueueManager] Processing batch
Filter: [QueueManager] Batch processing complete
```

2. Check notification attempts:
```sql
SELECT 
  id,
  order_id,
  notification_type,
  status,
  attempts,
  error_message,
  scheduled_at
FROM whatsapp_notifications
WHERE status = 'failed' OR attempts > 1
ORDER BY created_at DESC;
```

3. Check error logs:
```sql
SELECT * FROM whatsapp_error_logs
WHERE operation = 'send_whatsapp_notification'
ORDER BY created_at DESC
LIMIT 10;
```

## Log Filtering Tips

### Browser Console Filters

- All payment confirmations: `[PaymentConfirmationService]`
- All WhatsApp notifications: `[QueueManager]` OR `[NotificationTriggers]`
- All auto-print events: `[useAutoPrint]`
- All errors: `Error` OR `Failed` OR `failed`
- Specific order: `order-uuid`
- Deduplication events: `duplicate` OR `dedupe`

### Time-based Filtering

All logs include ISO-8601 timestamps for precise time-based filtering and correlation across different components.

## Performance Monitoring

### Key Metrics to Track

1. **Payment Confirmation Success Rate**
```sql
SELECT 
  source,
  COUNT(*) as total,
  SUM(CASE WHEN notification_sent THEN 1 ELSE 0 END) as with_notification,
  AVG(CASE WHEN notification_sent THEN 1.0 ELSE 0.0 END) * 100 as success_rate
FROM payment_confirmation_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY source;
```

2. **Notification Delivery Rate**
```sql
SELECT 
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  AVG(attempts) as avg_attempts
FROM whatsapp_notifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY notification_type;
```

3. **Auto-Print Reliability**
Monitor console logs for:
- Ratio of "Auto-print triggered" to "Auto-print completed successfully"
- Frequency of "Auto-print failed" errors
- Time between order status change and print trigger

## Best Practices

1. **Always include timestamps** - All logs include ISO-8601 timestamps for correlation
2. **Use structured data** - All logs use objects with named fields for easy parsing
3. **Include context** - Order IDs, numbers, and customer names help identify issues
4. **Log both success and failure** - Track successful operations to establish baselines
5. **Use consistent prefixes** - Makes filtering and searching much easier
6. **Don't throw on logging errors** - Logging failures shouldn't break the application flow
7. **Include dedupe keys** - Essential for tracking duplicate prevention
8. **Log timing information** - Helps identify performance issues and race conditions
