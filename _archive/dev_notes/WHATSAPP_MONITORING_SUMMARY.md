# WhatsApp Monitoring and Error Handling System

## Overview

Implemented a comprehensive monitoring and error handling system for WhatsApp notifications, including error logging, delivery rate monitoring, alerting, and an admin dashboard.

## Components Implemented

### 1. Error Logger (`src/integrations/whatsapp/error-logger.ts`)

**Features:**
- Automatic error categorization (connection, authentication, phone validation, rate limit, network, database, configuration, message delivery, unknown)
- Error severity levels (low, medium, high, critical)
- Retryable error detection
- Comprehensive error context tracking (order ID, customer phone, notification ID, additional data)
- Error statistics and analytics
- Automatic alert triggering for critical errors and high error rates
- Error log cleanup for old entries (30+ days)

**Key Functions:**
- `logError()` - Log errors with automatic categorization and severity
- `getErrorStats()` - Get error statistics for a time period
- `getOrderErrors()` - Get all errors for a specific order
- `cleanupOldLogs()` - Remove old error logs

### 2. Delivery Monitor (`src/integrations/whatsapp/delivery-monitor.ts`)

**Features:**
- Real-time delivery statistics tracking
- Delivery rate and failure rate calculations
- Average delivery time monitoring
- Statistics by notification type
- Automatic monitoring with configurable intervals
- Alert triggering for:
  - High failure rates (>10% by default)
  - High pending message counts
  - Slow delivery times (>5 minutes average)
- Delivery trends over time (7-day, 30-day)
- Alert management (create, resolve, track)

**Key Functions:**
- `getDeliveryStats()` - Get delivery statistics for a time period
- `getStatsByType()` - Get statistics grouped by notification type
- `checkAndAlert()` - Check thresholds and trigger alerts
- `startMonitoring()` - Start automatic monitoring
- `stopMonitoring()` - Stop automatic monitoring
- `getDeliveryTrends()` - Get historical delivery trends
- `getUnresolvedAlerts()` - Get active alerts
- `resolveAlert()` - Mark an alert as resolved

### 3. Database Schema

**New Tables:**

#### `whatsapp_error_logs`
- Stores all WhatsApp operation errors
- Includes category, severity, error message, stack trace, context
- Links to orders, notifications, and customer phones
- Indexed for fast queries

#### `whatsapp_alerts`
- Stores system alerts
- Tracks alert type, category, message, metadata
- Supports alert resolution tracking
- Indexed for fast queries

### 4. Admin Dashboard (`src/pages/WhatsAppAdmin.tsx`)

**Features:**
- Real-time statistics overview (sent, failed, pending, average delivery time)
- Time period selector (last hour, 24 hours, 7 days, 30 days)
- Active alerts display with resolution capability
- Three main tabs:
  1. **Deliveries** - Recent delivery history with status and timing
  2. **Errors** - Error statistics by category and recent errors
  3. **Trends** - 7-day delivery trends with visual indicators
- Auto-refresh every 30 seconds
- Manual refresh and monitoring check buttons

**Access:**
- Route: `/whatsapp-admin`
- Protected route (requires cashier role)

### 5. Monitoring Module (`src/integrations/whatsapp/monitoring.ts`)

**Utility Functions:**
- `initializeMonitoring()` - Start the monitoring system
- `stopMonitoring()` - Stop the monitoring system
- `getSystemHealth()` - Get comprehensive health status

## Configuration

### Alert Thresholds (Configurable)

```typescript
{
  failureRateThreshold: 10, // Alert if failure rate exceeds 10%
  checkIntervalMs: 60 * 60 * 1000, // Check every hour
  minSampleSize: 10, // Minimum notifications to trigger alert
}
```

### Time Periods

- `LAST_HOUR` - Last 60 minutes
- `LAST_24_HOURS` - Last 24 hours
- `LAST_7_DAYS` - Last 7 days
- `LAST_30_DAYS` - Last 30 days

## Usage Examples

### Log an Error

```typescript
import { errorLogger } from '@/integrations/whatsapp';

try {
  // WhatsApp operation
} catch (error) {
  await errorLogger.logError(error as Error, {
    operation: 'send_notification',
    orderId: 'order-123',
    customerPhone: '+5511999999999',
    additionalData: {
      attemptNumber: 3,
      messageType: 'confirmation',
    },
  });
}
```

### Get Delivery Statistics

```typescript
import { deliveryMonitor, TimePeriod } from '@/integrations/whatsapp';

const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_24_HOURS);
console.log(`Delivery rate: ${stats.deliveryRate}%`);
console.log(`Failure rate: ${stats.failureRate}%`);
```

### Start Monitoring

```typescript
import { initializeMonitoring } from '@/integrations/whatsapp';

// Start automatic monitoring
initializeMonitoring();
```

### Check System Health

```typescript
import { getSystemHealth } from '@/integrations/whatsapp';

const health = await getSystemHealth();
console.log(`System status: ${health.status}`);
console.log(`Active alerts: ${health.alerts.length}`);
```

## Testing

Created comprehensive test suites:

1. **Error Logger Tests** (`src/integrations/whatsapp/__tests__/error-logger.test.ts`)
   - Error categorization tests
   - Severity determination tests
   - Retryable error detection tests
   - Error statistics tests
   - Context tracking tests

2. **Delivery Monitor Tests** (`src/integrations/whatsapp/__tests__/delivery-monitor.test.ts`)
   - Delivery statistics calculation tests
   - Statistics by type tests
   - Alert threshold tests
   - Trend calculation tests
   - Monitoring lifecycle tests

## Database Migrations

Created migration: `supabase/migrations/20251107000004_create_whatsapp_error_logs_table.sql`

- Creates `whatsapp_error_logs` table
- Creates `whatsapp_alerts` table
- Adds indexes for performance
- Sets up Row Level Security (RLS) policies

## Integration Points

The monitoring system integrates with:

1. **WhatsApp Service** - Automatic error logging in all operations
2. **Queue Manager** - Delivery tracking and statistics
3. **Notification Triggers** - Error context for failed notifications
4. **Admin Dashboard** - Real-time monitoring interface

## Benefits

1. **Proactive Issue Detection** - Automatic alerts for high failure rates
2. **Root Cause Analysis** - Detailed error categorization and context
3. **Performance Monitoring** - Track delivery times and success rates
4. **Historical Analysis** - Trends and statistics over time
5. **Operational Visibility** - Admin dashboard for real-time monitoring
6. **Compliance** - Comprehensive logging for audit trails

## Future Enhancements

Potential improvements:
- Email/SMS/Slack notifications for critical alerts
- Advanced analytics and reporting
- Machine learning for anomaly detection
- Integration with external monitoring services (Datadog, New Relic)
- Custom alert rules and thresholds per notification type
- Performance optimization recommendations
