-- Check recent webhook activity and orders

-- Check if any webhooks were received
SELECT 
  'Webhooks Received' as check_type,
  COUNT(*) as count,
  MAX(processed_at) as last_received
FROM payment_webhooks;

-- Check recent orders
SELECT 
  order_number,
  status,
  mercadopago_payment_id,
  payment_confirmed_at,
  created_at,
  CASE 
    WHEN status = 'paid' THEN '✅ Paid'
    WHEN status = 'pending_payment' THEN '⏳ Pending'
    ELSE status
  END as status_icon
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Check if webhook URL is correct in latest orders
SELECT 
  order_number,
  mercadopago_payment_id,
  created_at
FROM orders
WHERE mercadopago_payment_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
