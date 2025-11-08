# ✅ WhatsApp Payment Notification Checklist

## Current Status: CONFIGURED ✅

All components are in place for WhatsApp notifications to be sent when payment is confirmed.

## 🔍 Verification Checklist

### 1. Environment Variables ✅
- [x] `VITE_EVOLUTION_API_URL` = http://wppapi.clubemkt.digital
- [x] `VITE_EVOLUTION_API_KEY` = DD451E404240-4C45-AF35-BFCA6A976927
- [x] `VITE_EVOLUTION_INSTANCE_NAME` = cocooo
- [x] Variables set in `.env`
- [x] Variables set in `wrangler.toml`

### 2. Evolution API Client ✅
**File**: `src/integrations/whatsapp/evolution-client.ts`
- [x] Properly configured with environment variables
- [x] Fallback to hardcoded values if env vars missing
- [x] `sendTextMessage()` method implemented
- [x] Phone number formatting (adds 55 prefix for Brazil)
- [x] Error handling implemented

### 3. Queue Manager ✅
**File**: `src/integrations/whatsapp/queue-manager.ts`
- [x] Uses `evolutionClient` (line 7)
- [x] `enqueue()` method creates notification records
- [x] `processPendingNotifications()` sends queued messages
- [x] Calls `evolutionClient.sendTextMessage()` (line 207)
- [x] Retry logic with exponential backoff
- [x] Automatic processing enabled

### 4. Notification Triggers ✅
**File**: `src/integrations/whatsapp/notification-triggers.ts`
- [x] `onPaymentConfirmed()` method implemented
- [x] Fetches order data with items
- [x] Queues payment confirmation notification
- [x] Error handling (doesn't break payment flow)

### 5. Payment Polling Service ✅
**File**: `src/integrations/mercadopago/polling.ts`
- [x] Calls `notificationTriggers.onPaymentConfirmed()` (line 186)
- [x] Triggered when payment status = 'approved'
- [x] Uses RPC function `confirm_order_payment`
- [x] Proper error handling

### 6. Message Templates ✅
**File**: `src/integrations/whatsapp/templates.ts`
- [x] `generateOrderConfirmation()` creates payment message
- [x] Includes order details, items, total
- [x] Professional formatting with emojis
- [x] Estimated time included

### 7. Database Functions ✅
**SQL**: `RUN_ALL_FUNCTIONS.sql`
- [x] `confirm_order_payment()` function exists
- [x] Updates order status to 'in_preparation'
- [x] Sets `payment_confirmed_at` timestamp
- [x] Security definer (bypasses RLS)

### 8. Cloudflare Function Proxy ✅
**File**: `functions/api/whatsapp/send-message.ts`
- [x] CORS proxy for Evolution API
- [x] Handles browser CORS restrictions
- [x] Forwards requests to Evolution API

## 🧪 How to Test

### Option 1: Run Test Script
```bash
npx tsx test-payment-notification.ts
```

This will:
1. Create a test order
2. Confirm payment via RPC
3. Verify notification is queued
4. Wait for notification to be sent
5. Show message content

### Option 2: Manual Test
1. Go to: https://1a9f2218.coco-loko-acaiteria.pages.dev
2. Create an order (use table TEST-1)
3. Use customer phone: 73999548537
4. Generate PIX payment
5. In Supabase, manually approve payment:
```sql
SELECT confirm_order_payment(
  '<order_id>', 
  '<payment_id>'
);
```
6. Check `whatsapp_notifications` table:
```sql
SELECT * FROM whatsapp_notifications 
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;
```

### Option 3: Check Existing Orders
```sql
-- Find recent orders with payments
SELECT 
  o.id,
  o.order_number,
  o.customer_phone,
  o.status,
  o.payment_confirmed_at,
  COUNT(wn.id) as notification_count
FROM orders o
LEFT JOIN whatsapp_notifications wn ON wn.order_id = o.id
WHERE o.payment_confirmed_at IS NOT NULL
GROUP BY o.id
ORDER BY o.payment_confirmed_at DESC
LIMIT 10;
```

## 🔄 Flow Diagram

```
Customer Pays with PIX
         ↓
MercadoPago Payment Status = 'approved'
         ↓
Payment Polling Service detects approval
         ↓
Calls confirm_order_payment() RPC
         ↓
Order status → 'in_preparation'
         ↓
Calls notificationTriggers.onPaymentConfirmed()
         ↓
Fetches order data with items
         ↓
Generates message from template
         ↓
queueManager.enqueue() creates record
         ↓
Auto-processing picks up notification
         ↓
evolutionClient.sendTextMessage()
         ↓
Evolution API sends WhatsApp message
         ↓
Notification status → 'sent'
         ↓
Customer receives WhatsApp message! 📱
```

## 🐛 Troubleshooting

### If notifications aren't being sent:

1. **Check Evolution API Connection**
```bash
curl http://wppapi.clubemkt.digital/instance/connectionState/cocooo \
  -H "apikey: DD451E404240-4C45-AF35-BFCA6A976927"
```
Expected: `{"state": "open"}`

2. **Check Queue Processing**
```sql
-- See pending notifications
SELECT * FROM whatsapp_notifications 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- See failed notifications
SELECT * FROM whatsapp_notifications 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

3. **Check Browser Console**
- Open DevTools → Console
- Look for Evolution API logs
- Check for errors in queue processing

4. **Verify RPC Function**
```sql
-- Test the function directly
SELECT confirm_order_payment(
  '<test_order_id>',
  '<test_payment_id>'
);
```

5. **Check Phone Number Format**
- Must be in format: 5573999548537 (country code + number)
- Evolution API expects Brazilian numbers with 55 prefix
- Client automatically adds prefix if missing

## 📊 Monitoring Queries

### Check notification success rate
```sql
SELECT 
  notification_type,
  status,
  COUNT(*) as count,
  ROUND(AVG(attempts), 2) as avg_attempts
FROM whatsapp_notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type, status
ORDER BY notification_type, status;
```

### Recent notifications
```sql
SELECT 
  wn.id,
  o.order_number,
  wn.notification_type,
  wn.status,
  wn.attempts,
  wn.created_at,
  wn.sent_at,
  wn.error_message
FROM whatsapp_notifications wn
JOIN orders o ON o.id = wn.order_id
ORDER BY wn.created_at DESC
LIMIT 20;
```

### Failed notifications with details
```sql
SELECT 
  wn.id,
  o.order_number,
  o.customer_phone,
  wn.notification_type,
  wn.attempts,
  wn.error_message,
  wn.created_at
FROM whatsapp_notifications wn
JOIN orders o ON o.id = wn.order_id
WHERE wn.status = 'failed'
ORDER BY wn.created_at DESC
LIMIT 10;
```

## ✅ Expected Behavior

When a payment is confirmed:

1. **Immediate** (< 1 second):
   - Order status changes to 'in_preparation'
   - Notification record created in database
   - Status: 'pending'

2. **Within 5 seconds**:
   - Queue manager processes notification
   - Message sent via Evolution API
   - Status changes to 'sent'

3. **Customer receives**:
   - WhatsApp message with order confirmation
   - Order details and items
   - Estimated preparation time
   - Professional formatting

## 🎯 Success Indicators

✅ Notification record exists in `whatsapp_notifications` table
✅ Status = 'sent'
✅ `sent_at` timestamp is set
✅ `whatsapp_message_id` is populated
✅ Customer receives message on WhatsApp
✅ No errors in browser console
✅ Evolution API connection state = 'open'

## 📝 Notes

- Notifications are queued and processed asynchronously
- Failed notifications are automatically retried (max 3 attempts)
- Phone numbers are encrypted in database for privacy
- Messages use professional templates with emojis
- System handles rate limiting and temporary failures
- All errors are logged for debugging

---

**Status**: All components configured and ready ✅
**Last Updated**: November 8, 2025
**Production URL**: https://1a9f2218.coco-loko-acaiteria.pages.dev
