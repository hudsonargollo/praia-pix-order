-- Simple Order Testing Queries
-- These queries work with the basic orders table structure

-- 1. Check all recent orders
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status,
  total_amount,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 2. Find orders by status
SELECT 
  order_number,
  customer_name,
  customer_phone,
  status,
  total_amount,
  created_at
FROM orders
WHERE status = 'pending_payment'  -- Change to: paid, in_preparation, ready, completed
ORDER BY created_at DESC;

-- 3. Manually mark an order as paid (for testing)
-- Replace 123 with your actual order number
/*
UPDATE orders
SET 
  status = 'paid'
WHERE order_number = 123
  AND status = 'pending_payment';
*/

-- 4. Check orders that should appear in Kitchen
SELECT 
  order_number,
  customer_name,
  customer_phone,
  status,
  total_amount,
  created_at
FROM orders
WHERE status IN ('paid', 'in_preparation', 'ready')
ORDER BY created_at DESC;

-- 5. Find orders by phone number
-- Replace with actual phone number
/*
SELECT 
  order_number,
  customer_name,
  status,
  total_amount,
  created_at
FROM orders
WHERE customer_phone = '+5573999999999'
ORDER BY created_at DESC;
*/

-- 6. Check order items for a specific order
-- Replace 123 with your actual order number
/*
SELECT 
  oi.item_name,
  oi.quantity,
  oi.unit_price,
  (oi.quantity * oi.unit_price) as subtotal
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.order_number = 123;
*/

-- 7. Summary of orders by status (last 24 hours)
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue
FROM orders
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;

-- 8. All orders with their items (last 10)
SELECT 
  o.order_number,
  o.customer_name,
  o.status,
  o.total_amount,
  o.created_at,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.customer_name, o.status, o.total_amount, o.created_at
ORDER BY o.created_at DESC
LIMIT 10;

-- 9. Find the most recent order
SELECT 
  order_number,
  customer_name,
  customer_phone,
  status,
  total_amount,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;

-- 10. Count orders by status
SELECT 
  status,
  COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;
