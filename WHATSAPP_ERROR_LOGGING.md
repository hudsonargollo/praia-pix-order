# WhatsApp Error Logging System

## Overview

This system provides comprehensive error tracking and logging for WhatsApp notifications, allowing administrators to monitor and troubleshoot notification failures.

## Features

### 1. Error Logging
- **Automatic Error Capture**: All WhatsApp notification errors are automatically logged to the database
- **Categorization**: Errors are categorized by type (connection, authentication, message delivery, etc.)
- **Severity Levels**: Critical, High, Medium, and Low severity classification
- **Context Preservation**: Error context is stored (without message content for privacy)
- **Retry Detection**: System identifies which errors are retryable

### 2. Error Display on Cashier Page
- **Visual Indicators**: Orders with WhatsApp notification errors show a warning banner
- **Error Count**: Badge displays the number of errors for each order
- **Clickable Navigation**: Clicking the error banner navigates to the detailed error log
- **Real-time Updates**: Errors are loaded and displayed in real-time

### 3. Error Log Viewer (WhatsApp Admin Page)
- **Dedicated Tab**: "Log de Erros" tab in the WhatsApp Admin page
- **Filtering Options**:
  - Time range (1 hour, 24 hours, 7 days, 30 days)
  - Severity level (Critical, High, Medium, Low)
  - Error category
  - Order-specific filtering via URL parameter
- **Statistics Dashboard**: Shows total errors, critical errors, and retryable errors
- **Detailed View**: Click any error to see full details including stack trace

## Database Schema

### whatsapp_error_logs Table
```sql
- id: UUID (primary key)
- category: TEXT (error category)
- severity: TEXT (error severity level)
- error_message: TEXT (error message)
- error_stack: TEXT (stack trace)
- context: JSONB (error context, sanitized)
- order_id: UUID (reference to orders table)
- customer_phone: TEXT
- notification_id: UUID
- is_retryable: BOOLEAN
- created_at: TIMESTAMPTZ
```

### whatsapp_alerts Table
```sql
- id: UUID (primary key)
- alert_type: TEXT
- category: TEXT
- message: TEXT
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

## Usage

### For Cashiers
1. View orders in the Cashier page
2. Orders with WhatsApp notification errors will show a red warning banner
3. Click the warning banner to view detailed error logs
4. The system will navigate to the WhatsApp Admin page with the order filtered

### For Administrators
1. Navigate to WhatsApp Admin page (`/whatsapp-admin`)
2. Click on the "Log de Erros" tab
3. Use filters to narrow down errors:
   - Select time range
   - Filter by severity
   - Filter by category
4. Click on any error to view full details
5. Review error patterns to identify systemic issues

## Error Categories

- **connection**: Connection issues with WhatsApp service
- **authentication**: Authentication/session problems
- **message_delivery**: Message sending failures
- **phone_validation**: Invalid phone number format
- **rate_limit**: API rate limiting
- **network**: Network connectivity issues
- **database**: Database operation failures
- **configuration**: Configuration problems
- **unknown**: Unclassified errors

## Severity Levels

- **Critical**: Requires immediate attention (authentication, configuration)
- **High**: Affects service availability (connection issues)
- **Medium**: Affects individual operations (delivery failures, rate limits)
- **Low**: Expected or recoverable errors (phone validation)

## Privacy & Security

- **Message Content Protection**: Message content is never logged
- **Sanitization**: All context data is sanitized to remove sensitive information
- **Access Control**: Only authenticated staff can view error logs
- **Data Retention**: Old logs can be cleaned up (30+ days)

## API Integration

### Error Logger Service
```typescript
import { errorLogger } from '@/integrations/whatsapp/error-logger';

// Log an error
await errorLogger.logError(error, {
  operation: 'send_notification',
  orderId: 'uuid',
  customerPhone: '+5511999999999',
  additionalData: { /* context */ }
});

// Get error statistics
const stats = await errorLogger.getErrorStats(since);

// Get errors for specific order
const errors = await errorLogger.getOrderErrors(orderId);
```

### React Hooks
```typescript
import { useWhatsAppErrors, useAllWhatsAppErrors } from '@/hooks/useWhatsAppErrors';

// Get errors for specific orders
const { errors, loading, refresh } = useWhatsAppErrors(orderIds);

// Get all errors with filters
const { errors, loading, refresh } = useAllWhatsAppErrors({
  category: 'message_delivery',
  severity: 'high',
  since: new Date(),
  limit: 100
});
```

## Components

### WhatsAppErrorIndicator
Displays error warnings on order cards in the Cashier page.

```typescript
<WhatsAppErrorIndicator 
  errors={orderErrors} 
  orderId={order.id} 
  compact={false}
/>
```

### WhatsAppErrorLogViewer
Full error log viewer with filtering and detailed view.

```typescript
<WhatsAppErrorLogViewer />
```

## Migration

Run the migration to create the necessary tables:

```bash
npx supabase db reset
# or
npx supabase migration up
```

The migration file: `supabase/migrations/20240116000000_create_whatsapp_error_logs.sql`

## Future Enhancements

- Email/SMS alerts for critical errors
- Automatic retry mechanism for retryable errors
- Error trend analysis and reporting
- Integration with monitoring services (Sentry, etc.)
- Bulk error resolution actions
