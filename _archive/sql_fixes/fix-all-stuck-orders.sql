-- Fix all stuck orders immediately

UPDATE orders 
SET 
  status = 'paid', 
  payment_confirmed_at = NOW()
WHERE status = 'pending_payment'
  AND mercadopago_payment_id IS NOT NULL;

-- Show results
SELECT 
  order_number,
  status,
  customer_name,
  payment_confirmed_at
FROM orders
WHERE order_number IN (1, 2, 3, 4)
ORDER BY order_number;
