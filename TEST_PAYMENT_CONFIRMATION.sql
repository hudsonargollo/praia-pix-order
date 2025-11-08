-- Test Payment Confirmation Script
-- Run this in Supabase SQL Editor to test the payment flow

-- 1. Check recent orders and their status
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status,
  total_amount,
  payment_confirmed_at,
  mercadopago_payment_id,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 2. Find orders stuck in pending_payment
SELECT 
  id,
  order_number,
  customer_name,
  status,
  created_at,
  payment_expires_at,
  CASE 
    WHEN payment_expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as payment_status
FROM orders
WHERE status = 'pending_payment'
ORDER BY created_at DESC;

-- 3. Manually mark an order as paid (for testing)
-- Replace 'YOUR_ORDER_ID' with actual order ID
/*
UPDATE orders
SET 
  status = 'paid',
  payment_confirmed_at = NOW()
WHERE id = 'YOUR_ORDER_ID'
  AND status = 'pending_payment';
*/

-- 4. Check orders that should appear in Kitchen
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status,
  payment_confirmed_at,
  created_at
FROM orders
WHERE status IN ('paid', 'in_preparation', 'ready')
ORDER BY created_at DESC;

-- 5. Check payment webhooks (if using webhooks)
SELECT 
  id,
  order_id,
  payment_id,
  event_type,
  status,
  processed,
  created_at
FROM payment_webhooks
ORDER BY created_at DESC
LIMIT 20;

-- 6. Find orders by phone number
-- Replace '+5573999999999' with actual phone
/*
SELECT 
  id,
  order_number,
  customer_name,
  status,
  total_amount,
  created_at
FROM orders
WHERE customer_phone = '+5573999999999'
ORDER BY created_at DESC;
*/

-- 7. Check order items for a specific order
-- Replace 'YOUR_ORDER_ID' with actual order ID
/*
SELECT 
  oi.id,
  oi.item_name,
  oi.quantity,
  oi.unit_price,
  (oi.quantity * oi.unit_price) as subtotal
FROM order_items oi
WHERE oi.order_id = 'YOUR_ORDER_ID';
*/

-- 8. Summary statistics
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue
FROM orders
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;
