# Production Monitoring Setup Guide

## Overview

This guide covers setting up comprehensive monitoring and alerting for the WhatsApp notification system in production.

## Monitoring Components

### 1. Health Check Endpoint

**Endpoint**: `/api/health`

Provides real-time status of all services:
- Cloudflare Functions status
- WhatsApp connection status
- Environment configuration check
- Service availability

**Usage**:
```bash
curl https://your-domain.pages.dev/api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-07T12:00:00Z",
  "services": {
    "functions": {
      "status": "operational"
    },
    "whatsapp": {
      "status": "connected",
      "connectionState": "connected",
      "lastConnected": "2024-11-07T11:55:00Z"
    }
  },
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "hasWhatsAppKey": true,
    "hasWhatsAppSession": true
  }
}
```

### 2. Production Monitoring Dashboard

**Component**: `ProductionMonitoring.tsx`

Features:
- Real-time system health status
- 24-hour notification statistics
- Delivery rate tracking
- Recent error logs
- Automated alerts

**Access**: Add to admin dashboard or create dedicated monitoring page

### 3. Database Monitoring

**Tables to Monitor**:

#### whatsapp_notifications
- Total notifications sent
- Success/failure rates
- Average delivery time
- Queue backlog

**Query Example**:
```sql
-- Delivery rate for last 24 hours
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as delivery_rate
FROM whatsapp_notifications
WHERE created_at > NOW() - INTERVAL '24 hours';
```

#### whatsapp_error_logs
- Error frequency
- Error types
- Error patterns

**Query Example**:
```sql
-- Top errors in last 24 hours
SELECT 
  error_type,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM whatsapp_error_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC
LIMIT 10;
```

#### whatsapp_sessions
- Session health
- Last update time
- Active sessions

**Query Example**:
```sql
-- Check active sessions
SELECT 
  session_id,
  phone_number,
  is_active,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 as hours_since_update
FROM whatsapp_sessions
WHERE is_active = true;
```

## Alerting Setup

### 1. Cloudflare Alerts

Configure alerts in Cloudflare Dashboard:

#### Function Errors
1. Go to Cloudflare Dashboard → Pages → Your Project
2. Navigate to "Alerts" tab
3. Create alert for "Function Errors"
4. Set threshold: > 10 errors in 5 minutes
5. Add notification email/webhook

#### Function Latency
1. Create alert for "Function Latency"
2. Set threshold: > 5 seconds average
3. Add notification channels

### 2. Supabase Alerts

Configure database alerts:

#### High Error Rate
Create a Supabase Edge Function to check error rates:

```typescript
// supabase/functions/check-error-rate/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check error rate in last hour
  const { data, error } = await supabase
    .from('whatsapp_error_logs')
    .select('id')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if (error) throw error;

  const errorCount = data?.length || 0;
  const threshold = 50; // Alert if more than 50 errors per hour

  if (errorCount > threshold) {
    // Send alert (implement your notification method)
    console.error(`High error rate detected: ${errorCount} errors in last hour`);
    
    // Example: Send to webhook
    await fetch('YOUR_WEBHOOK_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert: 'High WhatsApp error rate',
        count: errorCount,
        threshold,
        timestamp: new Date().toISOString()
      })
    });
  }

  return new Response(JSON.stringify({ errorCount, threshold }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Schedule this function to run every hour using Supabase Cron:
```sql
SELECT cron.schedule(
  'check-whatsapp-errors',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/check-error-rate',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### 3. Custom Monitoring Script

Create a monitoring script that runs periodically:

```javascript
// scripts/monitor-production.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHealth() {
  const alerts = [];

  // Check delivery rate
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: notifications } = await supabase
    .from('whatsapp_notifications')
    .select('status')
    .gte('created_at', oneDayAgo);

  const total = notifications?.length || 0;
  const successful = notifications?.filter(n => n.status === 'sent').length || 0;
  const deliveryRate = total > 0 ? (successful / total) * 100 : 100;

  if (deliveryRate < 90 && total > 10) {
    alerts.push({
      severity: 'warning',
      message: `Low delivery rate: ${deliveryRate.toFixed(1)}%`,
      metric: 'delivery_rate',
      value: deliveryRate
    });
  }

  // Check connection status
  const healthResponse = await fetch('https://your-domain.pages.dev/api/health');
  const health = await healthResponse.json();

  if (health.services.whatsapp?.status !== 'connected') {
    alerts.push({
      severity: 'critical',
      message: 'WhatsApp is not connected',
      metric: 'connection_status',
      value: health.services.whatsapp?.status
    });
  }

  // Check for recent errors
  const { data: errors } = await supabase
    .from('whatsapp_error_logs')
    .select('id')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

  const errorCount = errors?.length || 0;
  if (errorCount > 20) {
    alerts.push({
      severity: 'warning',
      message: `High error rate: ${errorCount} errors in last hour`,
      metric: 'error_rate',
      value: errorCount
    });
  }

  // Send alerts if any
  if (alerts.length > 0) {
    await sendAlerts(alerts);
  }

  return { healthy: alerts.length === 0, alerts };
}

async function sendAlerts(alerts) {
  if (!WEBHOOK_URL) {
    console.error('No webhook URL configured');
    return;
  }

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'WhatsApp Notifications',
      alerts
    })
  });
}

// Run check
checkHealth()
  .then(result => {
    console.log('Health check complete:', result);
    process.exit(result.healthy ? 0 : 1);
  })
  .catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
```

Run this script periodically using cron:
```bash
# Add to crontab (every 15 minutes)
*/15 * * * * cd /path/to/project && node scripts/monitor-production.js
```

## Metrics to Monitor

### Critical Metrics

1. **WhatsApp Connection Status**
   - Alert: Connection down for > 5 minutes
   - Check: Every 1 minute
   - Action: Automatic reconnection, manual intervention if fails

2. **Delivery Rate**
   - Alert: < 90% over 1 hour with > 10 messages
   - Check: Every 15 minutes
   - Action: Investigate error logs, check phone number validity

3. **Error Rate**
   - Alert: > 20 errors per hour
   - Check: Every 15 minutes
   - Action: Review error types, check for patterns

4. **Function Availability**
   - Alert: > 5% error rate
   - Check: Continuous (Cloudflare)
   - Action: Check logs, verify environment variables

### Performance Metrics

1. **Average Response Time**
   - Target: < 2 seconds
   - Alert: > 5 seconds average
   - Action: Optimize queries, check database performance

2. **Queue Processing Time**
   - Target: < 30 seconds
   - Alert: > 60 seconds
   - Action: Check queue backlog, optimize processing

3. **Database Query Performance**
   - Target: < 100ms per query
   - Alert: > 500ms average
   - Action: Add indexes, optimize queries

## Logging Best Practices

### 1. Structured Logging

Use consistent log format:
```javascript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  service: 'whatsapp',
  action: 'send_message',
  orderId: '123',
  phone: '+5511999999999',
  status: 'success',
  duration: 1234
}));
```

### 2. Log Levels

- **ERROR**: System errors, failed operations
- **WARN**: Degraded performance, retries
- **INFO**: Normal operations, state changes
- **DEBUG**: Detailed debugging information

### 3. Log Retention

- Cloudflare Functions: 24 hours (default)
- Database logs: 30 days (configure cleanup)
- Archive important logs for compliance

## Dashboard Setup

### 1. Create Monitoring Page

Add route in `App.tsx`:
```typescript
<Route path="/monitoring" element={
  <ProtectedRoute requiredRole="admin">
    <MonitoringPage />
  </ProtectedRoute>
} />
```

### 2. Monitoring Page Component

```typescript
// src/pages/Monitoring.tsx
import { ProductionMonitoring } from '@/components/ProductionMonitoring';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Production Monitoring</h1>
      <ProductionMonitoring />
    </div>
  );
}
```

### 3. Add to Navigation

Add monitoring link to admin navigation menu.

## Incident Response

### Response Procedures

1. **WhatsApp Disconnected**
   - Check health endpoint
   - Review connection logs
   - Attempt manual reconnection
   - Re-scan QR code if needed

2. **High Error Rate**
   - Review error logs
   - Identify error patterns
   - Check phone number validity
   - Verify WhatsApp account status

3. **Low Delivery Rate**
   - Check connection status
   - Review failed notifications
   - Verify phone number formatting
   - Check for rate limiting

4. **Function Errors**
   - Check Cloudflare logs
   - Verify environment variables
   - Check database connectivity
   - Review recent deployments

## Maintenance Tasks

### Daily
- [ ] Check connection status
- [ ] Review delivery rates
- [ ] Check for critical errors

### Weekly
- [ ] Review error patterns
- [ ] Check queue performance
- [ ] Verify session health
- [ ] Review performance metrics

### Monthly
- [ ] Clean up old logs (> 30 days)
- [ ] Review and update thresholds
- [ ] Analyze trends
- [ ] Update documentation

## Resources

- Cloudflare Dashboard: https://dash.cloudflare.com
- Supabase Dashboard: https://app.supabase.com
- Health Endpoint: https://your-domain.pages.dev/api/health
- Admin Dashboard: https://your-domain.pages.dev/whatsapp-admin
- Monitoring Dashboard: https://your-domain.pages.dev/monitoring
