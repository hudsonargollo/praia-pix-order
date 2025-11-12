# Deploy Mercado Pago Webhook Handler

## 🎯 Overview
This guide will help you deploy the Mercado Pago webhook handler as a Supabase Edge Function.

---

## Step 1: Apply Database Migration

First, create the payment_webhooks logging table:

```bash
# Apply the migration to your remote database
npx supabase db push --linked
```

Or run manually in Supabase SQL Editor:
```sql
-- Copy contents of:
supabase/migrations/20251111000004_create_payment_webhooks_table.sql
```

---

## Step 2: Set Environment Variables

Add these secrets to your Supabase project:

```bash
# Set Mercado Pago Access Token
npx supabase secrets set MERCADOPAGO_ACCESS_TOKEN=your_access_token_here

# Verify secrets are set
npx supabase secrets list
```

**Where to find your Mercado Pago Access Token:**
1. Go to: https://www.mercadopago.com.br/developers/panel/app
2. Select your application
3. Go to "Credenciais de produção" (Production Credentials)
4. Copy the "Access Token"

---

## Step 3: Deploy the Edge Function

```bash
# Deploy the webhook function
npx supabase functions deploy mercadopago-webhook

# Check deployment status
npx supabase functions list
```

---

## Step 4: Get the Webhook URL

After deployment, your webhook URL will be:
```
https://[your-project-ref].supabase.co/functions/v1/mercadopago-webhook
```

Find your project ref:
```bash
npx supabase status
```

Or check in Supabase Dashboard → Settings → API

---

## Step 5: Configure Mercado Pago Webhook

1. Go to: https://www.mercadopago.com.br/developers/panel/app
2. Select your application
3. Click on "Webhooks" in the left menu
4. Click "Configurar notificações"
5. Add your webhook URL:
   ```
   https://[your-project-ref].supabase.co/functions/v1/mercadopago-webhook
   ```
6. Select events to receive:
   - ✅ Pagamentos (Payments)
7. Click "Salvar"

---

## Step 6: Test the Webhook

### Test with Mercado Pago Simulator:
1. Go to: https://www.mercadopago.com.br/developers/panel/testing
2. Create a test payment
3. Check webhook logs in Supabase

### Check Webhook Logs:
```sql
-- View recent webhook events
SELECT 
  id,
  order_id,
  payment_id,
  payment_status,
  processed_at
FROM payment_webhooks
ORDER BY processed_at DESC
LIMIT 10;
```

### Check Function Logs:
```bash
# View real-time logs
npx supabase functions logs mercadopago-webhook --tail
```

---

## Step 7: Verify Order Updates

After a test payment:

```sql
-- Check if order was updated
SELECT 
  order_number,
  status,
  mercadopago_payment_id,
  payment_confirmed_at
FROM orders
WHERE mercadopago_payment_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔧 Troubleshooting

### Webhook Not Receiving Events
1. Check Mercado Pago webhook configuration
2. Verify webhook URL is correct
3. Check function logs for errors:
   ```bash
   npx supabase functions logs mercadopago-webhook
   ```

### Order Not Updating
1. Check if `confirm_order_payment` function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'confirm_order_payment';
   ```
2. Check RLS policies allow updates
3. Check function logs for database errors

### Access Token Issues
1. Verify token is set:
   ```bash
   npx supabase secrets list
   ```
2. Check token is valid in Mercado Pago dashboard
3. Ensure using production token (not test token)

---

## 📊 Monitoring

### View Webhook Activity:
```sql
-- Webhook success rate
SELECT 
  payment_status,
  COUNT(*) as count,
  MAX(processed_at) as last_received
FROM payment_webhooks
GROUP BY payment_status
ORDER BY count DESC;
```

### View Failed Payments:
```sql
-- Orders with payment issues
SELECT 
  o.order_number,
  o.status,
  o.created_at,
  pw.payment_status,
  pw.processed_at
FROM orders o
LEFT JOIN payment_webhooks pw ON o.id = pw.order_id
WHERE o.status = 'pending_payment'
  AND o.created_at < NOW() - INTERVAL '30 minutes'
ORDER BY o.created_at DESC;
```

---

## ✅ Success Checklist

- [ ] Migration applied (payment_webhooks table created)
- [ ] Environment variables set (MERCADOPAGO_ACCESS_TOKEN)
- [ ] Edge function deployed
- [ ] Webhook URL configured in Mercado Pago
- [ ] Test payment processed successfully
- [ ] Order status updated to 'paid'
- [ ] Webhook logged in payment_webhooks table

---

## 🎉 Done!

Your webhook handler is now live and will automatically update order statuses when customers pay!

**Webhook URL:** `https://[your-project-ref].supabase.co/functions/v1/mercadopago-webhook`
