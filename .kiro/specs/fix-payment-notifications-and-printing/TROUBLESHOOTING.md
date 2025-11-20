# Troubleshooting Guide: Payment Confirmation & Auto-Print

## Common Issues

### Payment Confirmation Issues

#### Issue 1: Duplicate WhatsApp Notifications

**Symptoms**:
- Customer receives multiple WhatsApp messages for same payment
- Multiple entries in `whatsapp_notifications` table for same order

**Diagnosis**:
```sql
-- Check for duplicate notifications
SELECT 
  order_id,
  notification_type,
  COUNT(*) as count,
  array_agg(created_at ORDER BY created_at) as timestamps
FROM whatsapp_notifications
WHERE notification_type = 'payment_confirmed'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY order_id, notification_type
HAVING COUNT(*) > 1;
```

**Possible Causes**:
1. Edge function not being used (old code path still active)
2. Deduplication check failing
3. Multiple payment confirmation sources triggering simultaneously

**Solutions**:

1. **Verify edge function is deployed**:
```bash
cd supabase
supabase functions list
# Should show 'confirm-payment' in the list
```

2. **Check if Cashier panel is using edge function**:
```typescript
// In src/pages/staff/Cashier.tsx
// Should call supabase.functions.invoke('confirm-payment')
// NOT direct database update
```

3. **Verify deduplication index exists**:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'whatsapp_notifications' 
  AND indexname = 'idx_whatsapp_notifications_dedupe';
```

4. **Check payment confirmation logs**:
```sql
SELECT * FROM payment_confirmation_log 
WHERE order_id = 'YOUR_ORDER_ID'
ORDER BY created_at DESC;
```

#### Issue 2: No WhatsApp Notification Sent

**Symptoms**:
- Payment confirmed but customer doesn't receive WhatsApp
- Order status updated but no notification in database

**Diagnosis**:
```sql
-- Check if notification was attempted
SELECT * FROM payment_confirmation_log 
WHERE order_id = 'YOUR_ORDER_ID';

-- Check for errors
SELECT * FROM whatsapp_error_logs 
WHERE order_id = 'YOUR_ORDER_ID'
ORDER BY created_at DESC;
```

**Possible Causes**:
1. Evolution API not configured or down
2. Customer phone number missing or invalid
3. WhatsApp session expired
4. Network connectivity issues

**Solutions**:

1. **Verify Evolution API configuration**:
```bash
# Check environment variables
echo $VITE_EVOLUTION_API_URL
echo $VITE_EVOLUTION_API_KEY
```

2. **Test Evolution API directly**:
```bash
curl -X POST "YOUR_EVOLUTION_API_URL/message/sendText/YOUR_INSTANCE" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Test message"
  }'
```

3. **Check customer phone number**:
```sql
SELECT id, customer_name, customer_phone 
FROM orders 
WHERE id = 'YOUR_ORDER_ID';
```

4. **Verify WhatsApp session**:
```sql
SELECT * FROM whatsapp_sessions 
WHERE instance_name = 'YOUR_INSTANCE'
ORDER BY created_at DESC LIMIT 1;
```

#### Issue 3: Payment Confirmation Fails

**Symptoms**:
- Error message shown to user
- Order status not updated
- No notification sent

**Diagnosis**:
```sql
-- Check payment confirmation attempts
SELECT * FROM payment_confirmation_log 
WHERE order_id = 'YOUR_ORDER_ID'
  AND notification_sent = false;

-- Check order current status
SELECT id, status, payment_status, payment_confirmed_at 
FROM orders 
WHERE id = 'YOUR_ORDER_ID';
```

**Possible Causes**:
1. Database connection issues
2. Invalid order ID
3. Order already confirmed
4. Edge function error

**Solutions**:

1. **Check edge function logs**:
```bash
supabase functions logs confirm-payment --tail
```

2. **Verify order exists and is valid**:
```sql
SELECT * FROM orders WHERE id = 'YOUR_ORDER_ID';
```

3. **Test edge function directly**:
```bash
curl -X POST "YOUR_SUPABASE_URL/functions/v1/confirm-payment" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "YOUR_ORDER_ID",
    "source": "manual"
  }'
```

4. **Check database permissions**:
```sql
-- Verify RLS policies allow updates
SELECT * FROM orders WHERE id = 'YOUR_ORDER_ID';
UPDATE orders SET status = 'in_preparation' WHERE id = 'YOUR_ORDER_ID';
```

### Auto-Print Issues

#### Issue 4: Kitchen Receipt Not Printing

**Symptoms**:
- Payment confirmed but receipt doesn't print
- Auto-print toggle is enabled
- No error message shown

**Diagnosis**:
```javascript
// Check browser console for logs
// Should see: "Auto-print initialized with orders: X"
// Should see: "Order status changed: ..." when payment confirmed
// Should see: "Triggering auto-print for order: ..."
```

**Possible Causes**:
1. Auto-print toggle disabled
2. Print server not running
3. Order status transition not detected
4. useAutoPrint hook not initialized

**Solutions**:

1. **Verify auto-print is enabled**:
```javascript
// Check localStorage
localStorage.getItem('autoPrintEnabled')
// Should return 'true'
```

2. **Check print server status**:
```bash
# If using local print server
curl http://localhost:3001/health
```

3. **Verify order status tracking**:
```javascript
// In browser console on Kitchen page
// Check if orders are being tracked
console.log('Current orders:', orders);
```

4. **Test print function directly**:
```javascript
// In browser console on Kitchen page
handlePrint('YOUR_ORDER_ID');
```

5. **Check useAutoPrint initialization**:
```typescript
// In src/hooks/useAutoPrint.ts
// Add debug logging
console.log('useAutoPrint initialized:', { enabled, isAutoPrintEnabled });
```

#### Issue 5: Auto-Print Triggers Multiple Times

**Symptoms**:
- Same order prints multiple times
- Multiple print jobs for single order

**Diagnosis**:
```javascript
// Check browser console for duplicate logs
// Look for multiple "Triggering auto-print for order: X" messages
```

**Possible Causes**:
1. Multiple Kitchen page instances open
2. Order status changing multiple times
3. Real-time subscription receiving duplicate events

**Solutions**:

1. **Close duplicate tabs**:
- Ensure only one Kitchen page is open
- Check for background tabs

2. **Verify status tracking logic**:
```typescript
// In useAutoPrint.ts
// Should only trigger when transitioning TO 'in_preparation'
if (order.status === 'in_preparation' && previousStatus !== 'in_preparation') {
  triggerPrint(order.id);
}
```

3. **Add print deduplication**:
```typescript
const printedOrdersRef = useRef(new Set<string>());

const triggerPrint = (orderId: string) => {
  if (printedOrdersRef.current.has(orderId)) {
    console.log('Order already printed, skipping:', orderId);
    return;
  }
  
  printedOrdersRef.current.add(orderId);
  handlePrint(orderId);
};
```

#### Issue 6: Auto-Print Not Working After Page Reload

**Symptoms**:
- Auto-print works initially
- After page reload, receipts don't print
- Orders confirmed before page load don't print

**Diagnosis**:
```javascript
// Check if initial order tracking is running
// Should see: "Auto-print initialized with orders: X" in console
```

**Possible Causes**:
1. Initial order tracking not running
2. Orders not fetched on mount
3. Status tracking not initialized

**Solutions**:

1. **Verify initializeOrderTracking is called**:
```typescript
// In useAutoPrint.ts
useEffect(() => {
  if (enabled && isAutoPrintEnabled) {
    console.log('Initializing order tracking...');
    initializeOrderTracking();
  }
}, [enabled, isAutoPrintEnabled]);
```

2. **Check order fetch query**:
```typescript
const initializeOrderTracking = async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['pending_payment', 'in_preparation', 'ready']);
    
  console.log('Fetched orders for tracking:', orders?.length, error);
  
  orders?.forEach(order => {
    previousOrderStatusesRef.current.set(order.id, order.status);
  });
};
```

3. **Verify orders in 'in_preparation' are printed**:
```typescript
const handleOrderInsert = (order: Order) => {
  console.log('Order inserted:', order.id, order.status);
  previousOrderStatusesRef.current.set(order.id, order.status);
  
  if (order.status === 'in_preparation') {
    console.log('Printing newly inserted order:', order.id);
    triggerPrint(order.id);
  }
};
```

### Database Issues

#### Issue 7: Missing Tables or Columns

**Symptoms**:
- SQL errors in console
- Edge function fails with database errors
- Missing `payment_confirmation_log` table

**Diagnosis**:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payment_confirmation_log', 'whatsapp_notifications');

-- Check if dedupe_key column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_notifications' 
  AND column_name = 'dedupe_key';
```

**Solutions**:

1. **Run migration to create tables**:
```bash
# Apply the migration
supabase db push
```

2. **Manually create missing table**:
```sql
CREATE TABLE IF NOT EXISTS payment_confirmation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  source TEXT NOT NULL,
  payment_method TEXT,
  payment_id TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_confirmation_log_order 
ON payment_confirmation_log(order_id, created_at DESC);
```

3. **Add missing column**:
```sql
ALTER TABLE whatsapp_notifications 
ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_dedupe 
ON whatsapp_notifications(dedupe_key, created_at);
```

#### Issue 8: RLS Policy Blocking Updates

**Symptoms**:
- Edge function fails with permission error
- Order status not updating
- "new row violates row-level security policy" error

**Diagnosis**:
```sql
-- Check RLS policies on orders table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders';
```

**Solutions**:

1. **Verify service role is being used**:
```typescript
// Edge function should use service role client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // Service role bypasses RLS
);
```

2. **Check if RLS is enabled**:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders';
```

3. **Temporarily disable RLS for testing** (not recommended for production):
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
-- Test the operation
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

### Integration Issues

#### Issue 9: MercadoPago Webhook Not Triggering

**Symptoms**:
- PIX payment completed but order not confirmed
- No webhook logs in database
- Payment status not updating

**Diagnosis**:
```sql
-- Check webhook logs
SELECT * FROM payment_webhooks 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if webhook URL is configured in MercadoPago
-- Should be: YOUR_SUPABASE_URL/functions/v1/mercadopago-webhook
```

**Solutions**:

1. **Verify webhook URL in MercadoPago dashboard**:
- Go to MercadoPago developer settings
- Check webhook URL configuration
- Ensure URL is publicly accessible

2. **Test webhook endpoint**:
```bash
curl -X POST "YOUR_SUPABASE_URL/functions/v1/mercadopago-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "data": {
      "id": "TEST_PAYMENT_ID"
    }
  }'
```

3. **Check webhook function logs**:
```bash
supabase functions logs mercadopago-webhook --tail
```

4. **Verify webhook signature validation**:
```typescript
// In mercadopago-webhook function
// Ensure signature validation is not blocking valid requests
```

#### Issue 10: Evolution API Connection Issues

**Symptoms**:
- WhatsApp notifications not sending
- "Connection refused" or timeout errors
- Evolution API health check fails

**Diagnosis**:
```bash
# Test Evolution API health
curl YOUR_EVOLUTION_API_URL/health

# Test instance status
curl -H "apikey: YOUR_API_KEY" \
  YOUR_EVOLUTION_API_URL/instance/connectionState/YOUR_INSTANCE
```

**Solutions**:

1. **Verify Evolution API is running**:
```bash
# If self-hosted
docker ps | grep evolution-api
```

2. **Check API credentials**:
```bash
# Verify environment variables
echo $VITE_EVOLUTION_API_URL
echo $VITE_EVOLUTION_API_KEY
echo $VITE_EVOLUTION_INSTANCE_NAME
```

3. **Reconnect WhatsApp instance**:
```bash
curl -X POST \
  -H "apikey: YOUR_API_KEY" \
  YOUR_EVOLUTION_API_URL/instance/connect/YOUR_INSTANCE
```

4. **Check network connectivity**:
```bash
# From server where edge functions run
ping YOUR_EVOLUTION_API_HOST
telnet YOUR_EVOLUTION_API_HOST 8080
```

## Debugging Tools

### Browser Console Commands

```javascript
// Check auto-print status
localStorage.getItem('autoPrintEnabled')

// Enable auto-print
localStorage.setItem('autoPrintEnabled', 'true')

// Disable auto-print
localStorage.setItem('autoPrintEnabled', 'false')

// Check current orders
console.log(orders)

// Test print function
handlePrint('ORDER_ID')
```

### SQL Debugging Queries

```sql
-- Recent payment confirmations
SELECT * FROM payment_confirmation_log 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Recent WhatsApp notifications
SELECT * FROM whatsapp_notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Recent errors
SELECT * FROM whatsapp_error_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Orders pending payment
SELECT id, table_number, status, payment_status, created_at 
FROM orders 
WHERE status = 'pending_payment'
ORDER BY created_at DESC;

-- Orders in preparation
SELECT id, table_number, status, payment_confirmed_at, created_at 
FROM orders 
WHERE status = 'in_preparation'
ORDER BY created_at DESC;
```

### Edge Function Testing

```bash
# Test confirm-payment function
curl -X POST "YOUR_SUPABASE_URL/functions/v1/confirm-payment" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "YOUR_ORDER_ID",
    "source": "manual"
  }'

# View function logs
supabase functions logs confirm-payment --tail

# Deploy function
supabase functions deploy confirm-payment
```

## Getting Help

If you're still experiencing issues after trying these troubleshooting steps:

1. **Collect diagnostic information**:
   - Browser console logs
   - Edge function logs
   - Database query results
   - Error messages

2. **Check recent changes**:
   - Recent deployments
   - Configuration changes
   - Database migrations

3. **Review implementation guide**:
   - See IMPLEMENTATION_GUIDE.md for architecture details
   - Verify all components are properly integrated

4. **Contact support**:
   - Provide diagnostic information
   - Include steps to reproduce
   - Specify environment (production/staging/local)
