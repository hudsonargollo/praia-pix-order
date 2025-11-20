# Manual Testing Guide - Payment Notifications and Printing

## Quick Start

This guide provides step-by-step instructions for manually testing the payment confirmation and auto-print features.

---

## Prerequisites

Before starting, ensure you have:

1. ✅ Frontend running: `npm run dev` (http://localhost:8080)
2. ✅ Database access (Supabase dashboard or SQL client)
3. ✅ Two browser windows/tabs ready:
   - Window 1: Cashier panel (`/cashier`)
   - Window 2: Kitchen panel (`/kitchen`)
4. ✅ Browser console open (F12) for monitoring logs
5. ✅ Test order(s) in `pending_payment` status

---

## Test 1: Manual Payment Confirmation

### Goal
Verify that manual payment confirmation works and sends exactly one WhatsApp notification.

### Steps

1. **Open Cashier Panel**
   - Navigate to `/cashier`
   - Click on "Aguardando" (Pending) tab
   - You should see orders waiting for payment

2. **Select an Order**
   - Find an order in `pending_payment` status
   - Note the order number (e.g., #123)
   - Note the customer name and phone

3. **Confirm Payment**
   - Click "Verificar Pagamento" button
   - A dialog should appear
   - Click "Confirmar Pagamento Manualmente"

4. **Verify Success**
   - ✅ Success toast appears: "✅ Pagamento confirmado! Pedido enviado para a cozinha e cliente notificado via WhatsApp."
   - ✅ Order disappears from "Aguardando" tab
   - ✅ Order appears in "Em Preparo" tab

5. **Check Console Logs**
   Open browser console and look for:
   ```
   [PaymentConfirmationService] Payment confirmation requested
   [PaymentConfirmationService] Deduplication check passed
   [PaymentConfirmationService] Payment confirmation completed successfully
   ```

6. **Verify Database**
   Run this query in Supabase SQL Editor:
   ```sql
   -- Replace <order_id> with your order ID
   SELECT 
     o.order_number,
     o.status,
     o.payment_status,
     o.payment_confirmed_at,
     COUNT(wn.id) as notification_count
   FROM orders o
   LEFT JOIN whatsapp_notifications wn ON wn.order_id = o.id
     AND wn.notification_type IN ('payment_confirmed', 'order_created')
     AND wn.status = 'sent'
   WHERE o.id = '<order_id>'
   GROUP BY o.id, o.order_number, o.status, o.payment_status, o.payment_confirmed_at;
   ```
   
   Expected result:
   - `status` = 'in_preparation'
   - `payment_status` = 'confirmed'
   - `payment_confirmed_at` = (timestamp)
   - `notification_count` = 1

### ✅ Pass Criteria
- Order status updated correctly
- Exactly ONE WhatsApp notification sent
- Success message displayed
- Console logs show correct flow

---

## Test 2: Auto-Print (Kitchen Page Open)

### Goal
Verify that kitchen receipts print automatically when an order enters preparation while the Kitchen page is open.

### Steps

1. **Open Kitchen Panel**
   - Navigate to `/kitchen` in a separate browser window/tab
   - Ensure auto-print toggle is ENABLED (green)
   - Keep this window visible

2. **Open Cashier Panel**
   - In another window/tab, navigate to `/cashier`
   - Go to "Aguardando" tab

3. **Confirm Payment**
   - Select an order
   - Click "Verificar Pagamento"
   - Click "Confirmar Pagamento Manualmente"

4. **Watch Kitchen Panel**
   - Switch to Kitchen window
   - ✅ Order should appear immediately
   - ✅ Print dialog should open automatically (or print sent to printer)

5. **Check Console Logs (Kitchen Window)**
   ```
   [useAutoPrint] Order status change detected
   [useAutoPrint] Auto-print triggered - status transition
   [useAutoPrint] Auto-print completed successfully
   ```

### ✅ Pass Criteria
- Order appears in Kitchen view
- Print dialog opens automatically
- Console logs show auto-print triggered
- No errors in console

---

## Test 3: Auto-Print (Kitchen Page Loads After)

### Goal
Verify that kitchen receipts print automatically when the Kitchen page loads and there are orders already in preparation.

### Steps

1. **Close Kitchen Panel**
   - If Kitchen panel is open, close it completely

2. **Confirm Payment from Cashier**
   - Open Cashier panel (`/cashier`)
   - Confirm payment for an order
   - Wait for success message
   - Verify order is in "Em Preparo" tab

3. **Open Kitchen Panel**
   - Navigate to `/kitchen`
   - Enable auto-print toggle if not already enabled

4. **Verify Auto-Print**
   - ✅ Order should be visible in Kitchen view
   - ✅ Print dialog should open automatically
   - ✅ Console shows initialization logs

5. **Check Console Logs**
   ```
   [useAutoPrint] Initializing order tracking...
   [useAutoPrint] Tracking X existing orders
   [useAutoPrint] New order inserted
   [useAutoPrint] Auto-print triggered - new order in preparation
   [useAutoPrint] Auto-print completed successfully for new order
   ```

### ✅ Pass Criteria
- Order visible when Kitchen page loads
- Print triggered automatically on load
- Console logs show initialization
- No errors in console

---

## Test 4: No Duplicate Notifications

### Goal
Verify that the deduplication mechanism prevents duplicate WhatsApp notifications.

### Steps

1. **Confirm Payment**
   - Confirm payment for an order using Test 1 steps
   - Note the order ID

2. **Wait 10 Seconds**
   - Wait for 10 seconds

3. **Check Database**
   Run this query:
   ```sql
   -- Replace <order_id> with your order ID
   SELECT 
     id,
     notification_type,
     status,
     sent_at,
     dedupe_key,
     created_at
   FROM whatsapp_notifications
   WHERE order_id = '<order_id>'
   AND notification_type IN ('payment_confirmed', 'order_created')
   ORDER BY created_at DESC;
   ```
   
   Expected: Exactly ONE row with status = 'sent'

4. **Check Payment Confirmation Log**
   ```sql
   -- Replace <order_id> with your order ID
   SELECT 
     id,
     source,
     notification_sent,
     notification_error,
     created_at
   FROM payment_confirmation_log
   WHERE order_id = '<order_id>'
   ORDER BY created_at DESC;
   ```
   
   Expected: One or more rows, but only ONE with `notification_sent = true`

### ✅ Pass Criteria
- Only ONE notification in database
- Deduplication working correctly
- No duplicate messages sent to customer

---

## Test 5: Error Handling - Print Failure

### Goal
Verify that print failures don't block the order workflow.

### Steps

1. **Simulate Print Failure**
   - Disconnect printer or disable print server
   - OR: Block print dialog in browser settings

2. **Open Kitchen Panel**
   - Navigate to `/kitchen`
   - Enable auto-print toggle

3. **Confirm Payment**
   - From Cashier panel, confirm payment for an order

4. **Verify Graceful Failure**
   - ✅ Order still appears in Kitchen view
   - ✅ Order status is `in_preparation`
   - ✅ Error toast appears: "Erro na impressão automática. Tente imprimir manualmente."
   - ✅ Workflow continues normally

5. **Check Console**
   ```
   [useAutoPrint] Auto-print failed
   Error: [print error details]
   ```

### ✅ Pass Criteria
- Order workflow not blocked
- Error message displayed
- User can manually print later
- No critical errors

---

## Test 6: Error Handling - WhatsApp Failure

### Goal
Verify that WhatsApp notification failures don't block payment confirmation.

### Steps

1. **Simulate WhatsApp Failure**
   - Use an invalid phone number (e.g., "1234567890")
   - OR: Temporarily disable WhatsApp Evolution API

2. **Confirm Payment**
   - From Cashier panel, confirm payment for the order

3. **Verify Graceful Failure**
   - ✅ Order status still updated to `in_preparation`
   - ✅ Payment confirmed (payment_confirmed_at set)
   - ✅ Success toast appears with note about notification
   - ✅ Order appears in "Em Preparo" tab

4. **Check Database**
   ```sql
   -- Replace <order_id> with your order ID
   SELECT 
     id,
     source,
     notification_sent,
     notification_error,
     created_at
   FROM payment_confirmation_log
   WHERE order_id = '<order_id>'
   ORDER BY created_at DESC;
   ```
   
   Expected: `notification_sent = false`, `notification_error` contains error message

5. **Check Error Logs**
   ```sql
   -- Replace <order_id> with your order ID
   SELECT 
     id,
     error_type,
     error_message,
     operation,
     created_at
   FROM whatsapp_error_logs
   WHERE order_id = '<order_id>'
   ORDER BY created_at DESC;
   ```
   
   Expected: Error logged with details

### ✅ Pass Criteria
- Payment confirmed despite notification failure
- Error logged appropriately
- User-friendly error message
- Workflow not blocked

---

## Quick Health Check

Run this query to get an overview of system health:

```sql
SELECT 
  'Payment Confirmations (Last Hour)' as metric,
  COUNT(*)::text as value
FROM payment_confirmation_log
WHERE created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'WhatsApp Notifications Sent (Last Hour)',
  COUNT(*)::text
FROM whatsapp_notifications
WHERE status = 'sent'
AND created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'Duplicate Notifications (Last Hour)',
  COUNT(*)::text
FROM (
  SELECT order_id
  FROM whatsapp_notifications
  WHERE notification_type IN ('payment_confirmed', 'order_created')
  AND status = 'sent'
  AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY order_id
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 
  'Orders in Preparation',
  COUNT(*)::text
FROM orders
WHERE status = 'in_preparation'

UNION ALL

SELECT 
  'Recent Errors (Last Hour)',
  COUNT(*)::text
FROM whatsapp_error_logs
WHERE created_at > NOW() - INTERVAL '1 hour';
```

Expected results:
- Payment Confirmations: > 0 (if you've tested)
- WhatsApp Notifications Sent: > 0 (if you've tested)
- Duplicate Notifications: 0 (MUST be 0)
- Orders in Preparation: > 0 (if you've tested)
- Recent Errors: 0 (ideally)

---

## Troubleshooting

### Issue: Auto-print not triggering

**Check:**
1. Auto-print toggle is enabled (green)
2. Browser console for errors
3. Real-time subscription is connected
4. Print server is running

**Debug:**
```javascript
// In browser console
localStorage.getItem('kitchen_auto_print') // Should be 'true'
```

### Issue: Duplicate notifications

**Check:**
1. Database for duplicate entries
2. Console logs for deduplication messages
3. Payment confirmation log for multiple attempts

**Debug:**
```sql
-- Check for duplicates
SELECT 
  order_id,
  COUNT(*) as count
FROM whatsapp_notifications
WHERE notification_type IN ('payment_confirmed', 'order_created')
AND status = 'sent'
GROUP BY order_id
HAVING COUNT(*) > 1;
```

### Issue: Payment confirmation fails

**Check:**
1. Supabase edge function logs
2. Browser console for errors
3. Network tab for failed requests
4. Database RLS policies

**Debug:**
```javascript
// In browser console
// Check if edge function is accessible
fetch('https://your-supabase-url.supabase.co/functions/v1/confirm-payment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'test-order-id',
    source: 'manual'
  })
})
```

---

## Test Completion Checklist

- [ ] Test 1: Manual Payment Confirmation ✅
- [ ] Test 2: Auto-Print (Kitchen Open) ✅
- [ ] Test 3: Auto-Print (Kitchen Loads After) ✅
- [ ] Test 4: No Duplicate Notifications ✅
- [ ] Test 5: Error Handling - Print Failure ✅
- [ ] Test 6: Error Handling - WhatsApp Failure ✅
- [ ] Quick Health Check ✅
- [ ] All database queries return expected results ✅
- [ ] No unexpected errors in console ✅
- [ ] All requirements verified ✅

---

## Success!

If all tests pass, the payment confirmation and auto-print system is working correctly! 🎉

The system now:
- ✅ Sends exactly one WhatsApp notification per payment confirmation
- ✅ Automatically prints kitchen receipts when orders enter preparation
- ✅ Handles errors gracefully without blocking workflows
- ✅ Logs all events for debugging and monitoring
- ✅ Prevents duplicate notifications through deduplication

---

## Next Steps

1. Monitor production for a few days
2. Check error logs regularly
3. Verify customer feedback on notifications
4. Adjust deduplication window if needed (currently 5 minutes)
5. Consider adding metrics dashboard for monitoring
