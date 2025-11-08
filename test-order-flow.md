# Test Order Flow with WhatsApp Notifications

## 🔍 Issue Identified

The WhatsApp notification system was using the old Facebook WhatsApp Business API client instead of the new Evolution API client.

## ✅ Fix Applied

Updated `src/integrations/whatsapp/queue-manager.ts` to use `evolutionClient` instead of `whatsappClient`.

## 🚀 New Deployment

**Production URL**: https://1a578392.coco-loko-acaiteria.pages.dev

## 🧪 Testing Steps

### 1. Create a Test Order

1. Go to: https://1a578392.coco-loko-acaiteria.pages.dev
2. Enter a table number (e.g., "5")
3. Add items to cart
4. Go to checkout
5. Enter customer details:
   - Name: Test Customer
   - Phone: **73999548537** (your test number)
6. Submit order

### 2. Complete Payment

1. You'll be redirected to payment page
2. Copy the PIX code or scan QR code
3. Make the payment in your bank app
4. Wait for payment confirmation (polling checks every 5-10 seconds)

### 3. Verify Order Update

After payment is confirmed, check:

**Kitchen Dashboard**: https://1a578392.coco-loko-acaiteria.pages.dev/kitchen
- Order should appear with status "Em Preparação"

**Cashier Dashboard**: https://1a578392.coco-loko-acaiteria.pages.dev/cashier
- Order should be visible with payment confirmed

### 4. Verify WhatsApp Notification

Check your WhatsApp (73999548537) for:
```
🍇 *Coco Loko Açaiteria*

✅ *Pedido Confirmado!*

📋 *Pedido #XXXX*
👤 Cliente: Test Customer
🪑 Mesa: 5

*Itens do Pedido:*
• [Your items]

💰 *Total: R$ XX,XX*

⏱️ Tempo estimado: 15 minutos

Você receberá uma notificação quando seu pedido estiver pronto! 🎉
```

## 🔍 Debugging

### Check Notification Queue

Run this SQL in Supabase:

```sql
-- Check recent notifications
SELECT 
  id,
  order_id,
  notification_type,
  status,
  attempts,
  error_message,
  created_at,
  sent_at
FROM whatsapp_notifications
ORDER BY created_at DESC
LIMIT 10;
```

### Check Order Status

```sql
-- Check recent orders
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status,
  payment_confirmed_at,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

### Check Browser Console

Open browser console (F12) and look for:
- "Payment approved via polling"
- "Payment confirmation notification queued"
- "Notification enqueued"

### Check Evolution API

Test if Evolution API is still connected:

```bash
curl http://wppapi.clubemkt.digital/instance/connectionState/cocooo \
  -H "apikey: DD451E404240-4C45-AF35-BFCA6A976927"
```

Should return:
```json
{
  "instance": {
    "instanceName": "cocooo",
    "state": "open"
  }
}
```

## 🐛 Common Issues

### Issue 1: Order Status Not Updating

**Symptoms**: Payment is confirmed but order stays in "pending_payment"

**Check**:
1. Browser console for polling errors
2. Supabase logs for database errors
3. Order status in database

**Solution**: The polling service should update order status to "in_preparation" after payment approval

### Issue 2: WhatsApp Message Not Sent

**Symptoms**: Order updates but no WhatsApp message received

**Check**:
1. `whatsapp_notifications` table for notification status
2. Evolution API connection status
3. Phone number format (must be 5573999548537)

**Possible Causes**:
- Evolution API disconnected (scan QR code again)
- Phone number encryption/decryption issue
- Notification queue not processing

**Solution**:
```sql
-- Check notification status
SELECT * FROM whatsapp_notifications 
WHERE order_id = 'YOUR_ORDER_ID';

-- If status is 'pending', manually trigger processing
-- (The queue should auto-process, but you can force it)
```

### Issue 3: Payment Polling Not Working

**Symptoms**: Payment made but never detected

**Check**:
1. MercadoPago payment status
2. Browser console for polling logs
3. Network tab for API calls

**Solution**: Payment polling runs for 15 minutes with progressive intervals:
- First 50 seconds: every 5s
- Next 3.5 minutes: every 10s
- Remaining time: every 15s

## 📊 Expected Flow

```
1. Customer creates order
   ↓
2. Order status: "pending_payment"
   ↓
3. Customer pays via PIX
   ↓
4. Polling detects payment (5-30 seconds)
   ↓
5. Order status updated to "in_preparation"
   ↓
6. Notification trigger fires
   ↓
7. Notification queued in database
   ↓
8. Queue manager processes notification
   ↓
9. Evolution API sends WhatsApp message
   ↓
10. Notification status updated to "sent"
    ↓
11. Customer receives WhatsApp confirmation
    ↓
12. Order appears in Kitchen dashboard
```

## 🔧 Manual Testing Commands

### Test Evolution API Directly

```bash
# Send test message
npx tsx send-quick-test.ts
```

### Check Notification Queue Status

```sql
SELECT 
  status,
  COUNT(*) as count
FROM whatsapp_notifications
GROUP BY status;
```

### Retry Failed Notifications

```sql
-- Reset failed notifications to pending
UPDATE whatsapp_notifications
SET status = 'pending', attempts = 0
WHERE status = 'failed' AND attempts < 3;
```

## 📝 Notes

- Phone numbers are encrypted in database for security
- Notifications are queued and processed asynchronously
- Evolution API must be connected (state: "open")
- Payment polling has 15-minute timeout
- Queue processes every 5 seconds automatically

## ✅ Success Criteria

After completing a test order, you should see:

1. ✅ Order appears in Kitchen dashboard
2. ✅ Order status is "in_preparation"
3. ✅ WhatsApp message received on customer phone
4. ✅ Notification status is "sent" in database
5. ✅ No errors in browser console
6. ✅ No failed notifications in database

---

**Current Status**: System updated and redeployed with Evolution API integration.

**Next Step**: Create a test order and verify the complete flow works end-to-end.
