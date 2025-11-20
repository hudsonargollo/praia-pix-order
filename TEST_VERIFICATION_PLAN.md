# Payment Notifications and Printing - Test Verification Plan

## Overview
This document provides a comprehensive test plan to verify the complete flow of payment confirmations and kitchen receipt auto-printing.

## Test Environment Setup

### Prerequisites
1. Supabase database with all migrations applied
2. Frontend application running (`npm run dev`)
3. Print server running (if testing actual printing)
4. WhatsApp Evolution API configured (for notification testing)
5. Test orders in various states

### Test Data Requirements
- At least 2 test orders in `pending_payment` status
- At least 1 test order with PIX payment generated
- Test customer phone numbers for WhatsApp notifications
- Access to Cashier panel (`/cashier`)
- Access to Kitchen panel (`/kitchen`)

---

## Test Suite

### Test 1: Manual Payment Confirmation from Cashier

**Objective**: Verify that manual payment confirmation from the Cashier panel works correctly and sends exactly one WhatsApp notification.

**Requirements Tested**: 1.1, 1.3, 3.1

**Steps**:
1. Open Cashier panel (`/cashier`)
2. Navigate to "Aguardando" (Pending) tab
3. Find an order in `pending_payment` status
4. Click "Verificar Pagamento" button
5. In the payment dialog, click "Confirmar Pagamento Manualmente"

**Expected Results**:
- ✅ Order status changes to `in_preparation`
- ✅ Order payment_status changes to `confirmed`
- ✅ Order payment_confirmed_at timestamp is set
- ✅ Success toast appears: "✅ Pagamento confirmado! Pedido enviado para a cozinha e cliente notificado via WhatsApp."
- ✅ Order moves to "Em Preparo" tab
- ✅ Exactly ONE WhatsApp notification is sent to customer
- ✅ One entry in `whatsapp_notifications` table with status 'sent'
- ✅ One entry in `payment_confirmation_log` table with source 'manual'

**Verification Queries**:
```sql
-- Check order status
SELECT id, order_number, status, payment_status, payment_confirmed_at
FROM orders
WHERE id = '<order_id>';

-- Check WhatsApp notifications (should be exactly 1)
SELECT id, notification_type, status, sent_at, created_at
FROM whatsapp_notifications
WHERE order_id = '<order_id>'
AND notification_type IN ('payment_confirmed', 'order_created')
ORDER BY created_at DESC;

-- Check payment confirmation log
SELECT id, source, notification_sent, created_at
FROM payment_confirmation_log
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;
```

**Console Logs to Check**:
- `[PaymentConfirmationService] Payment confirmation requested`
- `[PaymentConfirmationService] Deduplication check passed`
- `[PaymentConfirmationService] Payment confirmation completed successfully`
- `[confirm-payment] Payment confirmation completed successfully`

---

### Test 2: Webhook Payment Confirmation from MercadoPago

**Objective**: Verify that webhook payment confirmation works correctly and sends exactly one WhatsApp notification.

**Requirements Tested**: 1.2, 3.1, 3.2

**Steps**:
1. Create an order with PIX payment
2. Simulate MercadoPago webhook by calling the webhook endpoint:
```bash
curl -X POST https://your-domain.com/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "data": {
      "id": "<mercadopago_payment_id>"
    }
  }'
```

**Expected Results**:
- ✅ Order status changes to `in_preparation`
- ✅ Order payment_status changes to `confirmed`
- ✅ Order payment_confirmed_at timestamp is set
- ✅ Exactly ONE WhatsApp notification is sent to customer
- ✅ One entry in `whatsapp_notifications` table with status 'sent'
- ✅ One entry in `payment_confirmation_log` table with source 'mercadopago'

**Verification Queries**: Same as Test 1

**Console Logs to Check**:
- `[mercadopago-webhook] Payment approved, confirming order`
- `[confirm-payment] Payment confirmation requested`
- `[confirm-payment] Payment confirmation completed successfully`

---

### Test 3: Auto-Print When Kitchen Page is Open

**Objective**: Verify that kitchen receipts print automatically when an order enters preparation while the Kitchen page is open.

**Requirements Tested**: 2.1, 2.2, 4.3, 4.4

**Steps**:
1. Open Kitchen panel (`/kitchen`)
2. Enable auto-print toggle (if not already enabled)
3. From another browser tab/window, open Cashier panel
4. Confirm payment for an order (using Test 1 steps)

**Expected Results**:
- ✅ Kitchen page receives real-time update
- ✅ Order appears in Kitchen view with `in_preparation` status
- ✅ Print dialog opens automatically (or print is sent to printer)
- ✅ Console shows: `[useAutoPrint] Auto-print triggered - status transition`
- ✅ Console shows: `[useAutoPrint] Auto-print completed successfully`

**Console Logs to Check**:
```
[useAutoPrint] Order status change detected
[useAutoPrint] Auto-print triggered - status transition
[useAutoPrint] Auto-print completed successfully
```

---

### Test 4: Auto-Print When Kitchen Page Loads After Confirmation

**Objective**: Verify that kitchen receipts print automatically when the Kitchen page loads and there are orders already in preparation.

**Requirements Tested**: 2.1, 2.2, 4.1, 4.2

**Steps**:
1. Ensure Kitchen page is CLOSED
2. From Cashier panel, confirm payment for an order
3. Wait for order to reach `in_preparation` status
4. Open Kitchen panel (`/kitchen`)
5. Enable auto-print toggle (if not already enabled)

**Expected Results**:
- ✅ Kitchen page loads and shows order in `in_preparation` status
- ✅ Auto-print initializes order tracking
- ✅ Print dialog opens automatically for the order (or print is sent to printer)
- ✅ Console shows: `[useAutoPrint] Initializing order tracking`
- ✅ Console shows: `[useAutoPrint] Auto-print triggered - new order in preparation`
- ✅ Console shows: `[useAutoPrint] Auto-print completed successfully for new order`

**Console Logs to Check**:
```
[useAutoPrint] Initializing order tracking...
[useAutoPrint] Tracking X existing orders
[useAutoPrint] New order inserted
[useAutoPrint] Auto-print triggered - new order in preparation
[useAutoPrint] Auto-print completed successfully for new order
```

---

### Test 5: No Duplicate WhatsApp Notifications

**Objective**: Verify that the deduplication mechanism prevents duplicate WhatsApp notifications.

**Requirements Tested**: 1.5, 3.3, 3.4

**Steps**:
1. Confirm payment for an order using manual confirmation
2. Wait 10 seconds
3. Try to confirm payment again for the same order (if possible)
4. Check database for duplicate notifications

**Expected Results**:
- ✅ Second confirmation attempt is blocked by deduplication
- ✅ Console shows: `[PaymentConfirmationService] Payment confirmation skipped - notification recently sent`
- ✅ Only ONE notification in `whatsapp_notifications` table
- ✅ Two entries in `payment_confirmation_log` table (one successful, one duplicate attempt)

**Verification Queries**:
```sql
-- Should return exactly 1 notification
SELECT COUNT(*) as notification_count
FROM whatsapp_notifications
WHERE order_id = '<order_id>'
AND notification_type IN ('payment_confirmed', 'order_created')
AND status = 'sent';

-- Should show duplicate attempt
SELECT id, source, notification_sent, notification_error, created_at
FROM payment_confirmation_log
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;
```

---

### Test 6: Single Notification in Database

**Objective**: Verify that only one notification record exists in the database per payment confirmation.

**Requirements Tested**: 1.5, 3.3, 3.4

**Steps**:
1. Confirm payment for an order
2. Query the database to check notification records

**Expected Results**:
- ✅ Exactly ONE record in `whatsapp_notifications` table for the order
- ✅ Notification has `notification_type` = 'payment_confirmed' or 'order_created'
- ✅ Notification has `status` = 'sent'
- ✅ Notification has `sent_at` timestamp
- ✅ Notification has `dedupe_key` populated

**Verification Queries**:
```sql
-- Should return exactly 1 row
SELECT 
  id,
  order_id,
  notification_type,
  status,
  sent_at,
  dedupe_key,
  created_at
FROM whatsapp_notifications
WHERE order_id = '<order_id>'
AND notification_type IN ('payment_confirmed', 'order_created')
ORDER BY created_at DESC;

-- Check dedupe_key format (should be: order_id:notification_type:date)
SELECT 
  dedupe_key,
  notification_type,
  created_at
FROM whatsapp_notifications
WHERE order_id = '<order_id>'
AND notification_type IN ('payment_confirmed', 'order_created');
```

---

### Test 7: Error Handling - Print Failure

**Objective**: Verify that print failures don't block the order workflow.

**Requirements Tested**: 2.5

**Steps**:
1. Disconnect print server or disable printer
2. Open Kitchen panel with auto-print enabled
3. Confirm payment for an order from Cashier panel

**Expected Results**:
- ✅ Order still appears in Kitchen view
- ✅ Order status is correctly updated to `in_preparation`
- ✅ Error toast appears: "Erro na impressão automática. Tente imprimir manualmente."
- ✅ Console shows error but workflow continues
- ✅ User can manually trigger print later

**Console Logs to Check**:
```
[useAutoPrint] Auto-print failed
Error: Print server unavailable
```

---

### Test 8: Error Handling - WhatsApp Notification Failure

**Objective**: Verify that WhatsApp notification failures don't block payment confirmation.

**Requirements Tested**: 1.4, 3.4

**Steps**:
1. Disable WhatsApp Evolution API or use invalid phone number
2. Confirm payment for an order from Cashier panel

**Expected Results**:
- ✅ Order status is still updated to `in_preparation`
- ✅ Payment is confirmed (payment_confirmed_at is set)
- ✅ Success toast appears with note about notification
- ✅ Error is logged in `whatsapp_error_logs` table
- ✅ Entry in `payment_confirmation_log` shows `notification_sent = false`

**Verification Queries**:
```sql
-- Check payment confirmation log
SELECT id, source, notification_sent, notification_error, created_at
FROM payment_confirmation_log
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;

-- Check error logs
SELECT id, error_type, error_message, operation, created_at
FROM whatsapp_error_logs
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;
```

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Database migrations applied
- [ ] Frontend running on port 8080
- [ ] Print server running (if testing printing)
- [ ] WhatsApp Evolution API configured
- [ ] Test orders created in database
- [ ] Browser console open for log monitoring

### Test Execution
- [ ] Test 1: Manual Payment Confirmation ✅
- [ ] Test 2: Webhook Payment Confirmation ✅
- [ ] Test 3: Auto-Print (Kitchen Open) ✅
- [ ] Test 4: Auto-Print (Kitchen Loads After) ✅
- [ ] Test 5: No Duplicate Notifications ✅
- [ ] Test 6: Single Notification in DB ✅
- [ ] Test 7: Print Failure Handling ✅
- [ ] Test 8: WhatsApp Failure Handling ✅

### Post-Test Verification
- [ ] All database queries return expected results
- [ ] Console logs show correct flow
- [ ] No unexpected errors in browser console
- [ ] No unexpected errors in Supabase logs
- [ ] All requirements verified

---

## Common Issues and Troubleshooting

### Issue: Auto-print not triggering
**Possible Causes**:
- Auto-print toggle is disabled
- Print server not running
- Browser blocking print dialog
- Real-time subscription not connected

**Debug Steps**:
1. Check auto-print toggle state in localStorage: `localStorage.getItem('kitchen_auto_print')`
2. Check console for `[useAutoPrint]` logs
3. Verify real-time subscription is connected
4. Check browser console for print-related errors

### Issue: Duplicate notifications
**Possible Causes**:
- Deduplication check failing
- Multiple confirmation sources triggering simultaneously
- Database trigger still active

**Debug Steps**:
1. Check `whatsapp_notifications` table for duplicate entries
2. Check `payment_confirmation_log` for multiple confirmation attempts
3. Verify deduplication window (5 minutes)
4. Check console for `[PaymentConfirmationService] Recent notification found`

### Issue: Payment confirmation fails
**Possible Causes**:
- Edge function not deployed
- Authentication issues
- Database permissions
- Network connectivity

**Debug Steps**:
1. Check Supabase edge function logs
2. Verify authentication token is valid
3. Check database RLS policies
4. Test edge function directly with curl

---

## Success Criteria

All tests must pass with the following criteria:

1. **Payment Confirmation**:
   - ✅ Order status updates correctly
   - ✅ Payment timestamps are set
   - ✅ Exactly one WhatsApp notification sent
   - ✅ Confirmation logged in database

2. **Auto-Print**:
   - ✅ Prints when Kitchen page is open
   - ✅ Prints when Kitchen page loads after confirmation
   - ✅ Handles print failures gracefully
   - ✅ Respects auto-print toggle setting

3. **Deduplication**:
   - ✅ Prevents duplicate notifications
   - ✅ Logs duplicate attempts
   - ✅ Works across different confirmation sources

4. **Error Handling**:
   - ✅ Print failures don't block workflow
   - ✅ Notification failures don't block payment
   - ✅ Errors are logged appropriately
   - ✅ User-friendly error messages shown

---

## Test Report Template

```
# Test Execution Report
Date: [DATE]
Tester: [NAME]
Environment: [PRODUCTION/STAGING/LOCAL]

## Test Results

### Test 1: Manual Payment Confirmation
Status: [PASS/FAIL]
Notes: [Any observations]

### Test 2: Webhook Payment Confirmation
Status: [PASS/FAIL]
Notes: [Any observations]

### Test 3: Auto-Print (Kitchen Open)
Status: [PASS/FAIL]
Notes: [Any observations]

### Test 4: Auto-Print (Kitchen Loads After)
Status: [PASS/FAIL]
Notes: [Any observations]

### Test 5: No Duplicate Notifications
Status: [PASS/FAIL]
Notes: [Any observations]

### Test 6: Single Notification in DB
Status: [PASS/FAIL]
Notes: [Any observations]

### Test 7: Print Failure Handling
Status: [PASS/FAIL]
Notes: [Any observations]

### Test 8: WhatsApp Failure Handling
Status: [PASS/FAIL]
Notes: [Any observations]

## Overall Result
[PASS/FAIL]

## Issues Found
[List any issues discovered during testing]

## Recommendations
[Any recommendations for improvements]
```
