-- Check if webhook received any events
SELECT 
  id,
  order_id,
  mercadopago_payment_id,
  payment_status,
  webhook_type,
  processed_at
FROM payment_webhooks
ORDER BY processed_at DESC
LIMIT 10;

-- Check recent orders and their payment status
SELECT 
  order_number,
  status,
  mercadopago_payment_id,
  payment_confirmed_at,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Check if confirm_order_payment function exists
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'confirm_order_payment';
