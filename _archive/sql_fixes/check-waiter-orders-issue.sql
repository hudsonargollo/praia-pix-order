-- Check if waiter_id column exists and has data
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name IN ('waiter_id', 'commission_amount', 'created_by_waiter');

-- Check orders with waiter_id
SELECT 
  id,
  order_number,
  customer_name,
  waiter_id,
  commission_amount,
  total_amount,
  status,
  created_at
FROM orders
WHERE waiter_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Count orders by waiter
SELECT 
  waiter_id,
  COUNT(*) as order_count,
  SUM(total_amount) as total_sales,
  SUM(commission_amount) as total_commission
FROM orders
WHERE waiter_id IS NOT NULL
GROUP BY waiter_id;

-- Check if there are any waiters in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'waiter';

-- Check all orders to see if any have waiter_id
SELECT 
  COUNT(*) as total_orders,
  COUNT(waiter_id) as orders_with_waiter,
  COUNT(*) - COUNT(waiter_id) as orders_without_waiter
FROM orders;
