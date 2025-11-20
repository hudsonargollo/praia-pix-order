# WhatsApp Conversational UI - End-to-End Testing Guide

This guide provides comprehensive manual testing procedures for the WhatsApp Conversational UI feature.

## Prerequisites

- Evolution API instance configured and running
- Webhook URL configured in Evolution API settings
- Active orders in the database
- Access to admin dashboard
- WhatsApp account for testing

## Test Environment Setup

1. Ensure Evolution API is connected:
   ```bash
   # Check Evolution API status
   curl -X GET "${VITE_EVOLUTION_API_URL}/instance/connectionState/${VITE_EVOLUTION_INSTANCE_NAME}" \
     -H "apikey: ${VITE_EVOLUTION_API_KEY}"
   ```

2. Verify webhook is configured:
   ```bash
   # Check webhook configuration
   curl -X GET "${VITE_EVOLUTION_API_URL}/webhook/find/${VITE_EVOLUTION_INSTANCE_NAME}" \
     -H "apikey: ${VITE_EVOLUTION_API_KEY}"
   ```

3. Create test orders with known phone numbers

## Test Scenarios

### 1. Inbound Message Flow with Audio Notification

**Objective**: Verify customer messages appear in admin UI with audio notification

**Steps**:
1. Create an active order with phone number `5573999988888`
2. Open the order in the admin dashboard (Order Details view)
3. From a WhatsApp account with number `5573999988888`, send message: "Quanto tempo para o pedido?"
4. Observe the admin UI

**Expected Results**:
- ✅ Message appears in the chat panel within 2 seconds
- ✅ Audio notification plays (beep sound)
- ✅ Message is aligned to the left (customer message)
- ✅ Message has white background
- ✅ Timestamp is displayed
- ✅ "Novo" badge appears in chat header
- ✅ Unread indicator appears on order card (if viewing from order list)

**Verification Query**:
```sql
SELECT * FROM whatsapp_chat_messages 
WHERE phone_number = '5573999988888' 
AND direction = 'inbound'
ORDER BY created_at DESC LIMIT 1;
```

---

### 2. Outbound Message Flow

**Objective**: Verify staff messages are sent to customer via WhatsApp

**Steps**:
1. Open an order with active chat
2. Type message in input field: "Seu pedido estará pronto em 15 minutos!"
3. Click send button (or press Enter)
4. Check customer's WhatsApp

**Expected Results**:
- ✅ Message appears in chat panel immediately
- ✅ Message is aligned to the right (staff message)
- ✅ Message has purple gradient background
- ✅ Message shows status indicator (✓ for sent)
- ✅ Customer receives message on WhatsApp
- ✅ Success toast notification appears
- ✅ Input field is cleared after sending

**Verification Query**:
```sql
SELECT * FROM whatsapp_chat_messages 
WHERE order_id = '<order_id>' 
AND direction = 'outbound'
ORDER BY created_at DESC LIMIT 1;
```

---

### 3. Order Association with Various Phone Number Formats

**Objective**: Verify phone number normalization works correctly

**Test Cases**:

| Format | Example | Should Match |
|--------|---------|--------------|
| Normalized | `5573999988888` | ✅ |
| With parentheses | `(55) 73 99998-8888` | ✅ |
| With country code | `+55 73 99998-8888` | ✅ |
| With spaces | `55 73 99998 8888` | ✅ |
| With dashes | `55-73-99998-8888` | ✅ |

**Steps for each format**:
1. Create order with phone in specific format
2. Send WhatsApp message from that number
3. Verify message is associated with correct order

**Expected Results**:
- ✅ All formats are normalized to digits only
- ✅ Messages are correctly associated regardless of format
- ✅ No duplicate messages created

**Verification Script**:
```bash
# Test webhook with different phone formats
node scripts/test-whatsapp-webhook.js
```

---

### 4. Multiple Active Orders Scenario

**Objective**: Verify message associates with most recent order

**Steps**:
1. Create two active orders for phone `5573999988888`:
   - Order A: Created at 10:00 AM, status: `pending`
   - Order B: Created at 11:00 AM, status: `pending`
2. Send WhatsApp message from `5573999988888`: "Qual pedido?"
3. Check which order received the message

**Expected Results**:
- ✅ Message is associated with Order B (most recent)
- ✅ Message appears in Order B's chat panel
- ✅ Message does NOT appear in Order A's chat panel
- ✅ Only one message record is created in database

**Verification Query**:
```sql
SELECT cm.*, o.created_at as order_created_at
FROM whatsapp_chat_messages cm
JOIN orders o ON cm.order_id = o.id
WHERE cm.phone_number = '5573999988888'
AND cm.content = 'Qual pedido?'
ORDER BY cm.created_at DESC LIMIT 1;
```

---

### 5. No Active Orders Scenario

**Objective**: Verify messages are ignored when no active orders exist

**Steps**:
1. Ensure phone `5573999999999` has NO active orders (only completed/cancelled)
2. Send WhatsApp message from `5573999999999`: "Olá"
3. Check database and admin UI

**Expected Results**:
- ✅ Message is NOT stored in database
- ✅ Webhook returns 200 OK with "No active orders" message
- ✅ No error is logged
- ✅ Message does not appear in any order's chat panel

**Verification Query**:
```sql
-- Should return 0 rows
SELECT * FROM whatsapp_chat_messages 
WHERE phone_number = '5573999999999'
AND content = 'Olá';
```

**Webhook Log Check**:
```bash
# Check Cloudflare function logs
# Should see: "No active orders found, ignoring message"
```

---

### 6. Completed Order Scenario

**Objective**: Verify messages are ignored after order completion

**Steps**:
1. Create order with phone `5573999988888`, status: `pending`
2. Send message: "Teste 1" (should be stored)
3. Complete the order (change status to `completed`)
4. Send message: "Teste 2" (should be ignored)
5. Check database

**Expected Results**:
- ✅ "Teste 1" is stored and visible in chat
- ✅ "Teste 2" is NOT stored in database
- ✅ Webhook returns "No active orders" for "Teste 2"
- ✅ Chat panel shows only "Teste 1"

**Verification Query**:
```sql
SELECT * FROM whatsapp_chat_messages 
WHERE phone_number = '5573999988888'
AND content IN ('Teste 1', 'Teste 2')
ORDER BY created_at;
```

---

### 7. Real-Time Updates Across Multiple Browser Tabs

**Objective**: Verify real-time synchronization works

**Steps**:
1. Open admin dashboard in two browser tabs (Tab A and Tab B)
2. In both tabs, open the same order
3. In Tab A, send a message: "Mensagem do Tab A"
4. Observe Tab B
5. From customer WhatsApp, send: "Resposta do cliente"
6. Observe both tabs

**Expected Results**:
- ✅ Message from Tab A appears in Tab B within 2 seconds
- ✅ Customer message appears in both tabs simultaneously
- ✅ Audio notification plays in both tabs for customer message
- ✅ Message order is consistent across tabs
- ✅ No duplicate messages appear
- ✅ Unread count updates in both tabs

**Performance Check**:
- Real-time latency should be < 2 seconds
- No UI freezing or lag

---

### 8. Audio Notification Behavior

**Objective**: Verify audio plays only for inbound messages

**Test Cases**:

| Scenario | Audio Should Play |
|----------|-------------------|
| New inbound message arrives | ✅ Yes |
| Staff sends outbound message | ❌ No |
| System notification appears | ❌ No |
| Page loads with existing messages | ❌ No |
| Multiple inbound messages arrive | ✅ Yes (for each) |

**Steps**:
1. Open order with chat panel
2. Test each scenario above
3. Listen for audio notification

**Expected Results**:
- ✅ Audio plays only for new inbound messages
- ✅ Audio does not play on initial page load
- ✅ Audio is audible but not too loud
- ✅ Audio plays even if tab is in background

---

### 9. Message Status Updates

**Objective**: Verify message status indicators work correctly

**Steps**:
1. Send outbound message from admin
2. Observe status indicator changes
3. Have customer read the message
4. Observe status updates

**Expected Status Flow**:
```
pending (⏳) → sent (✓) → delivered (✓✓) → read (✓✓)
```

**Expected Results**:
- ✅ Status starts as "pending" while sending
- ✅ Changes to "sent" after Evolution API confirms
- ✅ Shows double checkmark for delivered
- ✅ Status persists after page refresh
- ✅ Failed messages show ❌ indicator

**Note**: Read receipts depend on Evolution API configuration and customer settings.

---

### 10. Error Handling for Failed Message Sends

**Objective**: Verify graceful error handling

**Test Scenarios**:

#### A. Evolution API Unavailable
**Steps**:
1. Stop Evolution API service
2. Try to send message from admin
3. Observe behavior

**Expected Results**:
- ✅ Error toast appears: "Erro ao enviar mensagem"
- ✅ Message is marked as "failed" in database
- ✅ Retry button is available
- ✅ UI remains responsive

#### B. Invalid Phone Number
**Steps**:
1. Create order with invalid phone: `123`
2. Try to send message
3. Observe behavior

**Expected Results**:
- ✅ Error message appears
- ✅ Message is not sent
- ✅ User is informed of the issue

#### C. Network Timeout
**Steps**:
1. Simulate slow network (Chrome DevTools)
2. Send message
3. Observe behavior

**Expected Results**:
- ✅ Loading indicator shows
- ✅ Timeout after reasonable duration
- ✅ Error message appears
- ✅ User can retry

---

## Unified Timeline Testing

### Test: System Notifications + Chat Messages

**Objective**: Verify unified timeline displays both message types correctly

**Steps**:
1. Create new order (generates "Order Created" notification)
2. Accept order (generates "Order Accepted" notification)
3. Customer sends message: "Quanto tempo?"
4. Staff replies: "15 minutos"
5. Mark order ready (generates "Ready for Pickup" notification)
6. Open order chat panel

**Expected Timeline**:
```
[System] Pedido Criado ✓
[System] Pedido Aceito ✓
[Customer] Quanto tempo?
[Staff] 15 minutos ✓
[System] Pronto para Retirada ✓
```

**Expected Results**:
- ✅ All messages appear in chronological order
- ✅ System messages are centered, gray, italicized
- ✅ Customer messages are left-aligned, white background
- ✅ Staff messages are right-aligned, purple background
- ✅ Timestamps are accurate
- ✅ Auto-scroll to bottom works

---

## Performance Testing

### Load Test: Multiple Messages

**Steps**:
1. Send 50 messages rapidly from customer
2. Observe admin UI performance

**Expected Results**:
- ✅ All messages appear in order
- ✅ No UI lag or freezing
- ✅ Scroll performance is smooth
- ✅ Memory usage remains stable

### Stress Test: Multiple Orders

**Steps**:
1. Create 10 active orders with different phones
2. Send messages to all orders simultaneously
3. Open each order's chat panel

**Expected Results**:
- ✅ Each message associates with correct order
- ✅ No cross-contamination between orders
- ✅ Real-time updates work for all orders
- ✅ Database queries remain fast

---

## Security Testing

### Test: Unauthorized Webhook Access

**Steps**:
1. Send webhook request without proper authentication
2. Send malformed payload
3. Attempt SQL injection in phone number

**Expected Results**:
- ✅ Invalid requests are rejected
- ✅ No data is stored from malicious requests
- ✅ Errors are logged but don't expose sensitive info
- ✅ Phone numbers are properly sanitized

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] Existing WhatsApp notifications still work
- [ ] Order creation flow is unaffected
- [ ] Payment notifications are not impacted
- [ ] Kitchen dashboard displays orders correctly
- [ ] Cashier panel functions normally
- [ ] Database migrations apply cleanly
- [ ] No breaking changes to API contracts

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test messages
DELETE FROM whatsapp_chat_messages 
WHERE phone_number IN ('5573999988888', '5573999999999');

-- Delete test orders
DELETE FROM orders 
WHERE customer_phone IN ('5573999988888', '5573999999999');
```

---

## Troubleshooting

### Messages Not Appearing

1. Check webhook configuration:
   ```bash
   curl -X GET "${VITE_EVOLUTION_API_URL}/webhook/find/${VITE_EVOLUTION_INSTANCE_NAME}" \
     -H "apikey: ${VITE_EVOLUTION_API_KEY}"
   ```

2. Check Cloudflare function logs for errors

3. Verify database connection:
   ```sql
   SELECT COUNT(*) FROM whatsapp_chat_messages;
   ```

4. Check real-time subscription status in browser console

### Audio Not Playing

1. Check browser audio permissions
2. Verify Web Audio API is supported
3. Check browser console for errors
4. Test in different browser

### Real-Time Not Working

1. Check Supabase real-time is enabled
2. Verify RLS policies allow subscriptions
3. Check network tab for WebSocket connection
4. Restart browser/clear cache

---

## Success Criteria

All tests pass when:

- ✅ Inbound messages appear in admin UI with audio notification
- ✅ Outbound messages are sent to customer via WhatsApp
- ✅ Phone number normalization works for all formats
- ✅ Messages associate with most recent active order
- ✅ Messages are ignored when no active orders exist
- ✅ Messages are ignored for completed orders
- ✅ Real-time updates work across multiple tabs
- ✅ Audio plays only for inbound messages
- ✅ Message status indicators display correctly
- ✅ Error handling is graceful and user-friendly
- ✅ Performance is acceptable under load
- ✅ Security measures prevent unauthorized access

---

## Test Execution Log

Use this template to track test execution:

```
Test Date: _______________
Tester: _______________
Environment: _______________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Inbound Message Flow | ⬜ Pass ⬜ Fail | |
| 2 | Outbound Message Flow | ⬜ Pass ⬜ Fail | |
| 3 | Phone Normalization | ⬜ Pass ⬜ Fail | |
| 4 | Multiple Active Orders | ⬜ Pass ⬜ Fail | |
| 5 | No Active Orders | ⬜ Pass ⬜ Fail | |
| 6 | Completed Order | ⬜ Pass ⬜ Fail | |
| 7 | Real-Time Updates | ⬜ Pass ⬜ Fail | |
| 8 | Audio Notification | ⬜ Pass ⬜ Fail | |
| 9 | Message Status | ⬜ Pass ⬜ Fail | |
| 10 | Error Handling | ⬜ Pass ⬜ Fail | |

Overall Result: ⬜ All Pass ⬜ Some Failures

Issues Found:
_______________________________________
_______________________________________
```
