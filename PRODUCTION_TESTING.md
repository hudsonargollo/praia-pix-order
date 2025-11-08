# Production Testing Guide

## Overview

This guide provides step-by-step instructions for testing the WhatsApp notification system in production after deployment.

## Pre-Testing Checklist

Before starting tests, verify:

- [ ] Application is deployed to Cloudflare Pages
- [ ] All environment variables are set in Cloudflare Dashboard
- [ ] Database migrations have been applied
- [ ] WhatsApp connection is established (QR code scanned)
- [ ] Test phone number is available (must have WhatsApp)

## Test Environment Setup

### 1. Test Data Preparation

Create a test order with known data:
- Customer name: "Test Customer"
- Phone number: Your test WhatsApp number (format: +5511999999999)
- Order items: Simple test items
- Table number: Test table

### 2. Access Required Pages

Ensure you can access:
- [ ] Customer menu: `https://your-domain.pages.dev/menu`
- [ ] Cashier dashboard: `https://your-domain.pages.dev/cashier`
- [ ] WhatsApp admin: `https://your-domain.pages.dev/whatsapp-admin`
- [ ] Monitoring dashboard: `https://your-domain.pages.dev/monitoring`
- [ ] Health endpoint: `https://your-domain.pages.dev/api/health`

## Test Scenarios

### Test 1: Health Check Verification

**Objective**: Verify all services are operational

**Steps**:
1. Open browser and navigate to health endpoint:
   ```
   https://your-domain.pages.dev/api/health
   ```

2. Verify response contains:
   ```json
   {
     "status": "healthy",
     "services": {
       "functions": { "status": "operational" },
       "whatsapp": { "status": "connected" }
     }
   }
   ```

**Expected Result**:
- ✅ Status is "healthy"
- ✅ WhatsApp service shows "connected"
- ✅ All environment variables are present

**If Failed**:
- Check Cloudflare Functions logs
- Verify environment variables in Cloudflare Dashboard
- Check WhatsApp connection in admin dashboard

---

### Test 2: WhatsApp Connection Status

**Objective**: Verify WhatsApp connection is active and stable

**Steps**:
1. Navigate to WhatsApp Admin page
2. Check connection status indicator
3. Verify phone number is displayed
4. Check last connected timestamp

**Expected Result**:
- ✅ Status shows "Connected"
- ✅ Phone number is displayed
- ✅ Last connected time is recent (< 5 minutes)
- ✅ No error messages displayed

**If Failed**:
- Click "Reconnect" button
- If QR code appears, scan with WhatsApp mobile app
- Check session data in `whatsapp_sessions` table
- Review connection logs in Cloudflare Functions

---

### Test 3: Payment Confirmation Notification

**Objective**: Test automatic notification when order is paid

**Steps**:
1. Create a new order through customer menu
2. Add items to cart
3. Proceed to checkout with test phone number
4. Complete payment (use test payment or real payment)
5. Wait for payment confirmation
6. Check WhatsApp on test phone

**Expected Result**:
- ✅ Order status changes to "paid"
- ✅ WhatsApp notification received within 30 seconds
- ✅ Message contains order number and confirmation
- ✅ Message is in Portuguese
- ✅ Notification logged in `whatsapp_notifications` table with status "sent"

**Verification Queries**:
```sql
-- Check notification was created
SELECT * FROM whatsapp_notifications 
WHERE order_id = 'YOUR_ORDER_ID' 
AND notification_type = 'payment_confirmed';

-- Check notification was sent
SELECT status, sent_at, error_message 
FROM whatsapp_notifications 
WHERE order_id = 'YOUR_ORDER_ID';
```

**If Failed**:
- Check order status in database
- Review notification triggers in code
- Check error logs in `whatsapp_error_logs` table
- Verify phone number format in database
- Check WhatsApp connection status

---

### Test 4: Kitchen Status Notifications

**Objective**: Test notifications for order preparation stages

**Steps**:
1. Use existing paid order from Test 3
2. In Kitchen dashboard, mark order as "Preparing"
3. Check WhatsApp on test phone
4. Mark order as "Ready"
5. Check WhatsApp again

**Expected Result**:
- ✅ "Preparing" notification received within 30 seconds
- ✅ "Ready" notification received within 30 seconds
- ✅ Both messages contain order number
- ✅ Messages indicate correct status
- ✅ Both notifications logged in database

**Verification Queries**:
```sql
-- Check all notifications for order
SELECT 
  notification_type,
  status,
  sent_at,
  EXTRACT(EPOCH FROM (sent_at - created_at)) as delivery_time_seconds
FROM whatsapp_notifications 
WHERE order_id = 'YOUR_ORDER_ID'
ORDER BY created_at;
```

**If Failed**:
- Check kitchen dashboard triggers
- Review notification queue processing
- Check for errors in error logs
- Verify order status changes are saved

---

### Test 5: Manual Notification from Cashier

**Objective**: Test manual notification sending from cashier dashboard

**Steps**:
1. Navigate to Cashier dashboard
2. Find a paid order
3. Click "Send Ready Notification" button
4. Confirm action
5. Check WhatsApp on test phone

**Expected Result**:
- ✅ Notification sent successfully
- ✅ Success message displayed in UI
- ✅ WhatsApp message received
- ✅ Notification status updated in dashboard
- ✅ Last sent time displayed

**If Failed**:
- Check cashier dashboard console for errors
- Verify notification controls component
- Check API endpoint responses
- Review error logs

---

### Test 6: Invalid Phone Number Handling

**Objective**: Test error handling for invalid phone numbers

**Steps**:
1. Create order with invalid phone number (e.g., "1234567890")
2. Complete payment
3. Check error logs

**Expected Result**:
- ✅ Order is created successfully
- ✅ Notification attempt is logged
- ✅ Error is recorded in `whatsapp_error_logs`
- ✅ Error type is "invalid_phone_number"
- ✅ System continues processing other notifications

**Verification Queries**:
```sql
-- Check error was logged
SELECT * FROM whatsapp_error_logs 
WHERE error_type = 'invalid_phone_number'
ORDER BY created_at DESC 
LIMIT 1;
```

**If Failed**:
- Review phone number validation logic
- Check error handling in notification service
- Verify error logging is working

---

### Test 7: Connection Recovery

**Objective**: Test automatic reconnection after disconnect

**Steps**:
1. In WhatsApp Admin, click "Disconnect"
2. Wait 30 seconds
3. Check connection status
4. Create a test order and complete payment
5. Verify notification is queued and sent after reconnection

**Expected Result**:
- ✅ Connection shows "disconnected"
- ✅ Automatic reconnection attempt starts
- ✅ Connection restored within 2 minutes
- ✅ Queued notifications are processed
- ✅ No notifications are lost

**If Failed**:
- Check reconnection logic in connection manager
- Review retry configuration
- Check health monitoring logs
- Verify session persistence

---

### Test 8: High Load Handling

**Objective**: Test system under multiple concurrent notifications

**Steps**:
1. Create 5-10 orders quickly
2. Mark all as paid simultaneously
3. Monitor notification delivery
4. Check delivery times

**Expected Result**:
- ✅ All notifications are queued
- ✅ All notifications are delivered
- ✅ Average delivery time < 30 seconds
- ✅ No errors in error logs
- ✅ Queue processes in FIFO order

**Verification Queries**:
```sql
-- Check delivery performance
SELECT 
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_delivery_seconds,
  MAX(EXTRACT(EPOCH FROM (sent_at - created_at))) as max_delivery_seconds
FROM whatsapp_notifications 
WHERE created_at > NOW() - INTERVAL '10 minutes'
AND status = 'sent';
```

**If Failed**:
- Review queue processing logic
- Check for bottlenecks
- Verify concurrent request handling
- Consider optimizing database queries

---

### Test 9: Monitoring Dashboard

**Objective**: Verify monitoring dashboard displays accurate data

**Steps**:
1. Navigate to Monitoring dashboard
2. Review system health status
3. Check 24-hour statistics
4. Review recent errors
5. Refresh data

**Expected Result**:
- ✅ System health shows "healthy"
- ✅ WhatsApp connection status is accurate
- ✅ Statistics match database queries
- ✅ Recent errors are displayed
- ✅ Refresh updates data correctly

**If Failed**:
- Check monitoring component queries
- Verify Supabase connection
- Review health endpoint
- Check for console errors

---

### Test 10: End-to-End Customer Flow

**Objective**: Test complete customer journey with notifications

**Steps**:
1. Scan QR code at table (or navigate to menu)
2. Browse menu and add items
3. Proceed to checkout
4. Enter phone number
5. Complete payment
6. Receive payment confirmation on WhatsApp
7. Wait for order preparation
8. Receive "preparing" notification
9. Receive "ready" notification
10. Pick up order

**Expected Result**:
- ✅ All steps complete without errors
- ✅ Three WhatsApp notifications received
- ✅ Notifications are timely and accurate
- ✅ Customer experience is smooth
- ✅ All data is logged correctly

**If Failed**:
- Review complete flow logs
- Check each component individually
- Verify integration points
- Test each notification type separately

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| Notification Delivery Time | < 10s | < 30s | > 30s |
| Delivery Rate | > 95% | > 90% | < 90% |
| Connection Uptime | > 99% | > 95% | < 95% |
| Error Rate | < 1% | < 5% | > 5% |
| Health Check Response | < 500ms | < 1s | > 1s |

### Measuring Performance

```sql
-- Delivery rate (last 24 hours)
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as delivery_rate
FROM whatsapp_notifications
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Average delivery time
SELECT 
  AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_seconds,
  MIN(EXTRACT(EPOCH FROM (sent_at - created_at))) as min_seconds,
  MAX(EXTRACT(EPOCH FROM (sent_at - created_at))) as max_seconds
FROM whatsapp_notifications
WHERE status = 'sent'
AND created_at > NOW() - INTERVAL '24 hours';

-- Error rate
SELECT 
  COUNT(*) as total_errors,
  COUNT(DISTINCT DATE_TRUNC('hour', created_at)) as hours_with_errors
FROM whatsapp_error_logs
WHERE created_at > NOW() - INTERVAL '24 hours';
```

## Post-Testing Verification

After completing all tests:

- [ ] All test scenarios passed
- [ ] Performance metrics meet targets
- [ ] No critical errors in logs
- [ ] Monitoring dashboard is accurate
- [ ] Documentation is updated
- [ ] Team is trained on system usage

## Rollback Criteria

Rollback deployment if:

- ❌ Delivery rate < 80%
- ❌ Connection cannot be established
- ❌ Critical errors in > 10% of requests
- ❌ Data loss or corruption detected
- ❌ Security vulnerabilities identified

## Sign-Off

- [ ] All tests completed: _________________ Date: _________
- [ ] Performance verified: _________________ Date: _________
- [ ] Monitoring confirmed: _________________ Date: _________
- [ ] Production approved: _________________ Date: _________

## Notes

Record any issues, observations, or special configurations:

```
[Add testing notes here]
```
