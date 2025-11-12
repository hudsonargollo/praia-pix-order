# Fix Payment Status Update Issue

## 🚨 Problem
Customer paid for order #1 via Mercado Pago, but:
1. Order status was NOT updated in the panel
2. Customer was redirected to "Status do pagamento com erro" (payment error status)

## 🔍 Root Causes

### Possible Issues:
1. **RPC Function Missing**: `confirm_order_payment` function not applied to database
2. **RLS Policy Blocking**: UPDATE policies preventing status change
3. **Polling Timeout**: Payment polling stopped before Mercado Pago confirmed
4. **Webhook Not Configured**: Mercado Pago webhook not sending notifications

## ✅ Solutions

### Solution 1: Verify RPC Function Exists
Run this in Supabase SQL Editor:
```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'confirm_order_payment';
```

**Expected**: Should return 1 row with `is_security_definer = true`

**If missing**, run migration:
`supabase/migrations/20251108000002_fix_order_update_rls.sql`

### Solution 2: Check Order Status
```sql
SELECT 
  order_number,
  status,
  mercadopago_payment_id,
  payment_confirmed_at
FROM orders
WHERE order_number = 1;
```

**If status is still `pending_payment`**, manually update:
```sql
UPDATE orders
SET 
  status = 'paid',
  payment_confirmed_at = NOW()
WHERE order_number = 1;
```

### Solution 3: Configure Mercado Pago Webhook
The webhook handler exists but needs to be deployed as a serverless function.

**File**: `src/api/mercadopago-webhook.ts`

**Deploy to**: Cloudflare Workers or Vercel Functions

**Webhook URL**: `https://your-domain.com/api/mercadopago-webhook`

**Configure in Mercado Pago**:
1. Go to: https://www.mercadopago.com.br/developers/panel/app
2. Navigate to: Webhooks
3. Add URL: Your webhook endpoint
4. Select events: `payment`

### Solution 4: Increase Polling Timeout
Current timeout: 15 minutes
Current interval: 5-15 seconds

**If payments take longer**, increase in:
`src/integrations/mercadopago/polling.ts`

```typescript
maxAttempts = 120, // 20 minutes
timeoutMs = 20 * 60 * 1000, // 20 minutes
```

## 🔧 Immediate Fix for Order #1

Run this NOW in Supabase SQL Editor:
```sql
-- Fix order #1 status
UPDATE orders
SET 
  status = 'paid',
  payment_confirmed_at = NOW()
WHERE order_number = 1
AND status != 'paid';

-- Verify it worked
SELECT order_number, status, payment_confirmed_at
FROM orders
WHERE order_number = 1;
```

## 📊 Prevention

### 1. Deploy Webhook Handler
- Deploy `src/api/mercadopago-webhook.ts` as serverless function
- Configure webhook URL in Mercado Pago dashboard
- Test webhook with Mercado Pago simulator

### 2. Monitor Payment Polling
- Check browser console for polling logs
- Look for errors in payment status checks
- Verify Mercado Pago API credentials

### 3. Add Logging
Create a payment_logs table to track all payment attempts:
```sql
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  payment_id TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Next Steps

1. **Immediate**: Fix order #1 status manually (SQL above)
2. **Short-term**: Deploy webhook handler
3. **Long-term**: Add payment logging and monitoring
