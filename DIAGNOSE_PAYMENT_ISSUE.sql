-- Diagnose Payment Issue for Order #1
-- Run this to see what happened with the payment

-- Check order details
SELECT 
  id,
  order_number,
  status,
  total_amount,
  mercadopago_payment_id,
  payment_confirmed_at,
  payment_expires_at,
  created_at
FROM orders
WHERE order_number = 1
OR id IN (SELECT id FROM orders ORDER BY created_at DESC LIMIT 5);

-- Check if confirm_order_payment function exists
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'confirm_order_payment';

-- Check RLS policies on orders table
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'orders'
AND cmd = 'UPDATE'
ORDER BY policyname;
