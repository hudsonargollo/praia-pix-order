-- Fix orders #1 and #2 immediately

-- Update order #1
UPDATE orders
SET 
  status = 'paid',
  payment_confirmed_at = NOW()
WHERE order_number = 1
  AND status = 'pending_payment';

-- Update order #2
UPDATE orders
SET 
  status = 'paid',
  payment_confirmed_at = NOW()
WHERE order_number = 2
  AND status = 'pending_payment';

-- Verify both orders are fixed
SELECT 
  order_number,
  status,
  payment_confirmed_at,
  customer_name
FROM orders
WHERE order_number IN (1, 2)
ORDER BY order_number;
