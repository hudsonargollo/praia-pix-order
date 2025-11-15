# Payment System Troubleshooting Guide

This guide provides detailed troubleshooting steps for the Waiter Payment Workflow feature.

## Table of Contents

1. [PIX Generation Issues](#pix-generation-issues)
2. [Payment Confirmation Issues](#payment-confirmation-issues)
3. [Commission Calculation Issues](#commission-calculation-issues)
4. [Add Items Issues](#add-items-issues)
5. [Real-time Updates Issues](#real-time-updates-issues)
6. [Database Issues](#database-issues)
7. [Common Error Messages](#common-error-messages)

---

## PIX Generation Issues

### Problem: "Gerar PIX" Button Not Appearing

**Possible Causes:**
- Order already has PIX generated
- Order payment status is not 'pending'
- Order doesn't belong to the waiter
- Order status is not 'in_preparation'

**Solutions:**

1. **Check Order State:**
```sql
SELECT 
  id,
  status,
  payment_status,
  waiter_id,
  pix_generated_at,
  pix_qr_code
FROM orders
WHERE id = 'ORDER_ID';
```

Expected values for button to appear:
- `status = 'in_preparation'`
- `payment_status = 'pending'`
- `pix_qr_code IS NULL` OR `pix_expires_at < NOW()`
- `waiter_id` matches current user

2. **Reset PIX if Expired:**
```sql
UPDATE orders
SET 
  pix_qr_code = NULL,
  pix_generated_at = NULL,
  pix_expires_at = NULL
WHERE id = 'ORDER_ID'
  AND pix_expires_at < NOW();
```

### Problem: PIX Generation Fails with Error

**Possible Causes:**
- MercadoPago API credentials invalid
- Network connectivity issues
- Rate limiting
- Invalid order amount

**Solutions:**

1. **Verify MercadoPago Credentials:**
```bash
# Check environment variables
echo $VITE_MERCADOPAGO_ACCESS_TOKEN
echo $VITE_MERCADOPAGO_PUBLIC_KEY

# Test API access
curl -X GET https://api.mercadopago.com/v1/payment_methods \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

2. **Check Cloudflare Function Logs:**
- Go to Cloudflare Dashboard
- Navigate to Pages > Functions
- Check logs for `/api/orders/generate-pix` endpoint
- Look for error messages and stack traces

3. **Verify Order Amount:**
```sql
SELECT 
  id,
  total_amount,
  status,
  payment_status
FROM orders
WHERE id = 'ORDER_ID';
```

Amount must be > 0 and reasonable (not too large).

4. **Check Rate Limiting:**
```sql
-- Check recent PIX generation attempts
SELECT 
  id,
  pix_generated_at,
  payment_status
FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND pix_generated_at > NOW() - INTERVAL '1 hour'
ORDER BY pix_generated_at DESC;
```

If more than 10 attempts in an hour, wait before retrying.

### Problem: QR Code Displays But Doesn't Work

**Possible Causes:**
- QR code expired
- Invalid QR code data
- MercadoPago payment not created properly

**Solutions:**

1. **Check PIX Expiration:**
```sql
SELECT 
  id,
  pix_generated_at,
  pix_expires_at,
  NOW() as current_time,
  (pix_expires_at > NOW()) as is_valid
FROM orders
WHERE id = 'ORDER_ID';
```

2. **Regenerate PIX:**
- Clear existing PIX data
- Generate new QR code
- Verify expiration is set correctly (typically 30 minutes)

3. **Verify QR Code Format:**
- QR code should be base64 encoded image
- Check that `pix_qr_code` field contains valid data
- Test QR code with multiple scanner apps

---

## Payment Confirmation Issues

### Problem: Payment Completed But Status Not Updating

**Possible Causes:**
- Webhook not configured in MercadoPago
- Webhook endpoint not accessible
- Webhook signature validation failing
- Database update failing

**Solutions:**

1. **Verify Webhook Configuration:**
- Login to MercadoPago dashboard
- Go to Developers > Webhooks
- Ensure webhook URL is: `https://your-domain.pages.dev/api/mercadopago/webhook`
- Verify webhook is active

2. **Check Webhook Logs:**
```sql
-- If you have a webhook_logs table
SELECT * FROM payment_webhooks
WHERE order_id = 'ORDER_ID'
ORDER BY created_at DESC;
```

3. **Test Webhook Manually:**
```bash
# Simulate webhook call
curl -X POST https://your-domain.pages.dev/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: YOUR_SIGNATURE" \
  -d '{
    "action": "payment.updated",
    "data": {
      "id": "PAYMENT_ID"
    }
  }'
```

4. **Check Cloudflare Function Logs:**
- Look for webhook processing errors
- Verify signature validation
- Check database connection

5. **Manual Payment Status Update (Emergency):**
```sql
-- Only use if webhook is confirmed but status not updated
UPDATE orders
SET 
  payment_status = 'confirmed',
  payment_confirmed_at = NOW()
WHERE id = 'ORDER_ID'
  AND payment_status = 'pending';
```

### Problem: Duplicate Payment Confirmations

**Possible Causes:**
- Webhook called multiple times
- Idempotency not working
- Race condition in webhook handler

**Solutions:**

1. **Check for Duplicates:**
```sql
SELECT 
  id,
  payment_status,
  payment_confirmed_at,
  updated_at
FROM orders
WHERE id = 'ORDER_ID';
```

2. **Verify Idempotency Logic:**
- Check webhook handler uses transaction
- Ensure payment_id is checked before update
- Verify no duplicate webhook entries

3. **Add Idempotency Key:**
```javascript
// In webhook handler
const existingPayment = await supabase
  .from('orders')
  .select('payment_status, mercadopago_payment_id')
  .eq('id', orderId)
  .single();

if (existingPayment.payment_status === 'confirmed') {
  return { status: 200, message: 'Already processed' };
}
```

---

## Commission Calculation Issues

### Problem: Commission Shows Incorrect Amount

**Possible Causes:**
- Payment status not filtered correctly
- Date range filter incorrect
- Duplicate orders counted
- Commission rate wrong

**Solutions:**

1. **Verify Commission Calculation:**
```sql
-- Check individual order commissions
SELECT 
  id,
  total_amount,
  commission_amount,
  payment_status,
  created_at
FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- Calculate expected totals
SELECT 
  payment_status,
  COUNT(*) as order_count,
  SUM(total_amount) as total_sales,
  SUM(commission_amount) as total_commission,
  AVG(commission_amount / NULLIF(total_amount, 0) * 100) as avg_commission_rate
FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND created_at >= CURRENT_DATE
GROUP BY payment_status;
```

2. **Check Commission Calculation Logic:**
```typescript
// In commissionUtils.ts
// Confirmed commission should only count payment_status='confirmed'
const confirmedOrders = orders.filter(
  order => order.payment_status === 'confirmed'
);

// Pending commission counts payment_status='pending'
const pendingOrders = orders.filter(
  order => order.payment_status === 'pending'
);
```

3. **Verify Date Filters:**
- Check that date range is applied correctly
- Ensure timezone handling is correct
- Verify "Hoje" (today) filter works as expected

### Problem: Pending vs Confirmed Mismatch

**Possible Causes:**
- Real-time updates not reflecting
- Cache not invalidated
- Payment status not updated

**Solutions:**

1. **Force Refresh:**
```javascript
// In browser console
window.location.reload();
```

2. **Check Real-time Subscription:**
```javascript
// Verify subscription includes payment_status
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    console.log('Order update:', payload);
    // Should include payment_status in payload
  })
  .subscribe();
```

3. **Verify Database State:**
```sql
-- Check for orders stuck in wrong state
SELECT 
  id,
  status,
  payment_status,
  payment_confirmed_at,
  updated_at
FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND payment_status = 'pending'
  AND payment_confirmed_at IS NOT NULL;
```

---

## Add Items Issues

### Problem: "Adicionar Item" Button Disabled

**Possible Causes:**
- Order not in 'in_preparation' status
- Payment already confirmed
- Waiter doesn't own order
- Order completed or cancelled

**Solutions:**

1. **Check Order State:**
```sql
SELECT 
  id,
  status,
  payment_status,
  waiter_id
FROM orders
WHERE id = 'ORDER_ID';
```

Required state:
- `status = 'in_preparation'`
- `payment_status = 'pending'`
- `waiter_id` matches current user

2. **Verify Button Logic:**
```typescript
// Button should be enabled when:
const canAddItems = 
  order.status === 'in_preparation' &&
  order.payment_status === 'pending' &&
  order.waiter_id === currentWaiterId;
```

### Problem: Items Added But Total Not Updating

**Possible Causes:**
- API call failing
- Database trigger not working
- Real-time update not received
- Cache not invalidated

**Solutions:**

1. **Check API Response:**
```javascript
// In browser console, check network tab
// Look for /api/orders/add-items response
// Should return updated order with new total
```

2. **Verify Database Update:**
```sql
-- Check order items
SELECT * FROM order_items
WHERE order_id = 'ORDER_ID'
ORDER BY created_at DESC;

-- Check order total
SELECT 
  id,
  total_amount,
  commission_amount,
  updated_at
FROM orders
WHERE id = 'ORDER_ID';
```

3. **Manual Total Recalculation:**
```sql
-- Recalculate total from items
UPDATE orders
SET 
  total_amount = (
    SELECT COALESCE(SUM(price * quantity), 0)
    FROM order_items
    WHERE order_id = orders.id
  ),
  commission_amount = (
    SELECT COALESCE(SUM(price * quantity), 0) * 0.10
    FROM order_items
    WHERE order_id = orders.id
  )
WHERE id = 'ORDER_ID';
```

### Problem: PIX Not Invalidated After Adding Items

**Possible Causes:**
- API not clearing PIX data
- Logic not checking for existing PIX
- Database update not committed

**Solutions:**

1. **Verify PIX Invalidation Logic:**
```typescript
// In add-items API
if (order.pix_qr_code && order.pix_expires_at > new Date()) {
  await supabase
    .from('orders')
    .update({
      pix_qr_code: null,
      pix_generated_at: null,
      pix_expires_at: null
    })
    .eq('id', orderId);
}
```

2. **Manual PIX Reset:**
```sql
UPDATE orders
SET 
  pix_qr_code = NULL,
  pix_generated_at = NULL,
  pix_expires_at = NULL
WHERE id = 'ORDER_ID';
```

---

## Real-time Updates Issues

### Problem: Changes Not Appearing Automatically

**Possible Causes:**
- WebSocket connection lost
- Subscription not active
- RLS policies blocking updates
- Browser tab inactive

**Solutions:**

1. **Check WebSocket Connection:**
```javascript
// In browser console
console.log('Supabase client:', supabase);
console.log('Realtime status:', supabase.realtime.channels);
```

2. **Verify Subscription:**
```javascript
// Check active subscriptions
const channels = supabase.realtime.channels;
console.log('Active channels:', channels);

// Should see 'orders' channel subscribed
```

3. **Check RLS Policies:**
```sql
-- Verify RLS allows SELECT for real-time
SELECT * FROM pg_policies
WHERE tablename = 'orders'
  AND cmd = 'SELECT';
```

4. **Test Manual Refresh:**
- Refresh browser page
- Check if data appears after refresh
- If yes, real-time subscription is the issue

5. **Reconnect Subscription:**
```javascript
// Force reconnection
supabase.realtime.disconnect();
setTimeout(() => {
  supabase.realtime.connect();
}, 1000);
```

---

## Database Issues

### Problem: Migration Not Applied

**Symptoms:**
- `payment_status` column doesn't exist
- Queries fail with "column does not exist"

**Solutions:**

1. **Check Migration Status:**
```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

2. **Apply Migration Manually:**
```bash
# Using Supabase CLI
supabase db push

# Or apply SQL directly in Supabase dashboard
```

3. **Verify Schema:**
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN (
    'payment_status',
    'payment_confirmed_at',
    'pix_generated_at',
    'pix_qr_code',
    'pix_expires_at'
  );
```

### Problem: Index Missing or Slow Queries

**Symptoms:**
- Slow dashboard loading
- Timeout errors
- High database CPU

**Solutions:**

1. **Check Indexes:**
```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname LIKE '%payment%';
```

2. **Create Missing Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_waiter_payment 
ON orders(waiter_id, payment_status) 
WHERE waiter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_payment 
ON orders(status, payment_status);
```

3. **Analyze Query Performance:**
```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND payment_status = 'pending'
ORDER BY created_at DESC;
```

---

## Common Error Messages

### "Failed to generate PIX"

**Cause:** MercadoPago API error or network issue

**Solution:**
1. Check MercadoPago credentials
2. Verify network connectivity
3. Check Cloudflare Function logs
4. Retry after a few seconds

### "Order not found"

**Cause:** Invalid order ID or order deleted

**Solution:**
1. Verify order ID is correct
2. Check order exists in database
3. Ensure order not soft-deleted (`deleted_at IS NULL`)

### "Unauthorized"

**Cause:** Waiter doesn't own the order

**Solution:**
1. Verify waiter is logged in
2. Check order belongs to waiter
3. Verify authentication token is valid

### "Payment already confirmed"

**Cause:** Trying to modify order with confirmed payment

**Solution:**
1. This is expected behavior
2. Cannot modify orders with confirmed payment
3. Create new order if needed

### "Invalid payment status"

**Cause:** Payment status value not in allowed list

**Solution:**
1. Check database constraint
2. Verify only using: 'pending', 'confirmed', 'failed', 'refunded'
3. Fix any code using invalid values

---

## Emergency Procedures

### Reset Order Payment Status

```sql
-- Use with caution - only for stuck orders
UPDATE orders
SET 
  payment_status = 'pending',
  payment_confirmed_at = NULL,
  pix_qr_code = NULL,
  pix_generated_at = NULL,
  pix_expires_at = NULL
WHERE id = 'ORDER_ID'
  AND payment_status != 'confirmed';
```

### Force Payment Confirmation

```sql
-- Only use if payment verified externally
UPDATE orders
SET 
  payment_status = 'confirmed',
  payment_confirmed_at = NOW()
WHERE id = 'ORDER_ID'
  AND payment_status = 'pending';
```

### Recalculate All Commissions

```sql
-- Recalculate commission for all orders
UPDATE orders
SET commission_amount = total_amount * 0.10
WHERE waiter_id IS NOT NULL
  AND commission_amount IS NULL;
```

---

## Getting Help

If issues persist after trying these solutions:

1. **Check Logs:**
   - Cloudflare Functions logs
   - Browser console errors
   - Supabase logs

2. **Gather Information:**
   - Order ID
   - Waiter ID
   - Error messages
   - Steps to reproduce

3. **Contact Support:**
   - Include all gathered information
   - Provide screenshots if applicable
   - Describe expected vs actual behavior

4. **Temporary Workarounds:**
   - Use manual payment confirmation
   - Create new order if stuck
   - Refresh browser frequently
