-- Manual fix for stuck order
-- Replace ORDER_NUMBER with the actual order number

-- Check the order first
SELECT 
  id,
  order_number,
  status,
  mercadopago_payment_id,
  payment_confirmed_at,
  created_at
FROM orders
WHERE order_number = ORDER_NUMBER; -- Replace with actual number

-- If payment was confirmed in Mercado Pago, manually update:
UPDATE orders
SET 
  status = 'paid',
  payment_confirmed_at = NOW()
WHERE order_number = ORDER_NUMBER -- Replace with actual number
  AND status = 'pending_payment';

-- Verify the update
SELECT 
  order_number,
  status,
  payment_confirmed_at
FROM orders
WHERE order_number = ORDER_NUMBER; -- Replace with actual number
