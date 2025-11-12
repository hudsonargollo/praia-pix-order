# URGENT: Payment System Not Working

## Critical Issue
Payments are not being recognized and orders stay in "pending_payment" status.

## Root Cause
Looking at the errors and Mercado Pago dashboard, the issue is:

1. **Test Mode vs Production Mode**: Mercado Pago might be in test mode
2. **Webhook Not Receiving Calls**: No entries in payment_webhooks table
3. **Polling System Broken**: Frontend errors prevent fallback

## IMMEDIATE FIX (Right Now)

### Step 1: Fix All Stuck Orders
```sql
UPDATE orders 
SET status = 'paid', payment_confirmed_at = NOW()
WHERE status = 'pending_payment' 
  AND mercadopago_payment_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours';

SELECT order_number, status FROM orders ORDER BY order_number DESC LIMIT 10;
```

### Step 2: Check Mercado Pago Mode
- Verify you're using **PRODUCTION** credentials (not test)
- The access token should start with `APP_USR-` (production) not `TEST-` (sandbox)
- Your token: `APP_USR-4813437808298526...` ✅ This is production

### Step 3: Verify Webhook URL
In Mercado Pago, the webhook URL should be:
```
https://cocoloko.clubemkt.digital/api/mercadopago/webhook
```

Make sure it's in **Modo de produção** (Production Mode), not test mode.

## Why Webhooks Might Not Be Working

1. **Mercado Pago hasn't sent any webhooks yet**
   - Check: Run `SELECT * FROM payment_webhooks;` 
   - If empty, webhooks aren't being received

2. **Webhook URL is wrong**
   - Should be: `https://cocoloko.clubemkt.digital/api/mercadopago/webhook`
   - NOT: `https://sntxekdwdllwkszclpiq.supabase.co/...`

3. **Payments are in test mode**
   - Test payments don't trigger production webhooks

## ALTERNATIVE SOLUTION

Since webhooks aren't working reliably, let's use a **Database Trigger** instead:

This will automatically check payment status every minute for pending orders.

Would you like me to implement this? It's more reliable than webhooks.

## Quick Test

To verify webhook is working, check Cloudflare logs:
1. Go to Cloudflare Dashboard
2. Select coco-loko-acaiteria
3. Go to Functions tab
4. Look for `/api/mercadopago/webhook` calls

If you see NO calls, Mercado Pago isn't sending webhooks.

## Recommendation

**Use Database Trigger + Scheduled Job** instead of webhooks:
- More reliable
- Works even if webhook fails
- Checks payment status automatically
- No dependency on Mercado Pago webhook delivery

Should I implement this?
