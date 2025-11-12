-- ============================================================================
-- VERIFY WAITER ORDERS FIX
-- ============================================================================
-- Quick verification queries to check if waiter orders are working correctly
-- Run this after applying fix-waiter-orders-tracking.sql
-- ============================================================================

-- 1. Check if all required columns exist
-- ============================================================================
SELECT 
  'Column Check' as test_name,
  column_name, 
  data_type,
  CASE 
    WHEN column_name IN ('waiter_id', 'commission_amount', 'created_by_waiter', 'order_notes') 
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name IN ('waiter_id', 'commission_amount', 'created_by_waiter', 'order_notes')
ORDER BY column_name;

-- 2. Check for waiters in the system
-- ============================================================================
SELECT 
  '👥 Waiters' as test_name,
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'waiter'
ORDER BY created_at DESC;

-- 3. Check orders with waiter_id
-- ============================================================================
SELECT 
  '📦 Waiter Orders' as test_name,
  COUNT(*) as total_waiter_orders,
  COUNT(CASE WHEN commission_amount > 0 THEN 1 END) as orders_with_commission,
  COUNT(CASE WHEN commission_amount IS NULL OR commission_amount = 0 THEN 1 END) as orders_without_commission,
  SUM(total_amount) as total_sales,
  SUM(commission_amount) as total_commissions
FROM orders
WHERE waiter_id IS NOT NULL;

-- 4. Recent waiter orders with details
-- ============================================================================
SELECT 
  '📋 Recent Orders' as test_name,
  o.order_number,
  o.customer_name,
  o.total_amount,
  o.commission_amount,
  ROUND((o.commission_amount / o.total_amount * 100)::numeric, 2) as commission_percentage,
  o.status,
  o.created_at,
  u.email as waiter_email,
  (u.raw_user_meta_data->>'full_name') as waiter_name
FROM orders o
JOIN auth.users u ON o.waiter_id = u.id
WHERE o.waiter_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- 5. Waiter performance summary
-- ============================================================================
SELECT 
  '📊 Waiter Stats' as test_name,
  u.email as waiter_email,
  (u.raw_user_meta_data->>'full_name') as waiter_name,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN o.status IN ('paid', 'in_preparation', 'ready', 'completed') THEN 1 END) as paid_orders,
  COALESCE(SUM(o.total_amount), 0) as gross_sales,
  COALESCE(SUM(o.commission_amount), 0) as total_commission,
  CASE 
    WHEN COUNT(o.id) > 0 
    THEN ROUND((SUM(o.total_amount) / COUNT(o.id))::numeric, 2)
    ELSE 0
  END as avg_order_value
FROM auth.users u
LEFT JOIN orders o ON u.id = o.waiter_id
WHERE u.raw_user_meta_data->>'role' = 'waiter'
GROUP BY u.id, u.email, u.raw_user_meta_data
ORDER BY gross_sales DESC;

-- 6. Check for orders missing commission
-- ============================================================================
SELECT 
  '⚠️  Missing Commission' as test_name,
  o.id,
  o.order_number,
  o.customer_name,
  o.total_amount,
  o.commission_amount,
  (o.total_amount * 0.10) as expected_commission,
  o.waiter_id
FROM orders o
WHERE o.waiter_id IS NOT NULL
  AND (o.commission_amount IS NULL OR o.commission_amount = 0)
ORDER BY o.created_at DESC
LIMIT 10;

-- 7. Verify commission calculation is correct
-- ============================================================================
SELECT 
  '🧮 Commission Accuracy' as test_name,
  o.order_number,
  o.total_amount,
  o.commission_amount as actual_commission,
  (o.total_amount * 0.10) as expected_commission,
  CASE 
    WHEN ABS(o.commission_amount - (o.total_amount * 0.10)) < 0.01 
    THEN '✅ CORRECT'
    ELSE '❌ INCORRECT'
  END as status
FROM orders o
WHERE o.waiter_id IS NOT NULL
  AND o.commission_amount IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- 8. Check trigger exists
-- ============================================================================
SELECT 
  '🔧 Trigger Check' as test_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'calculate_waiter_commission_trigger'
  AND event_object_table = 'orders';

-- 9. Overall health check
-- ============================================================================
SELECT 
  '✅ Health Check' as test_name,
  (SELECT COUNT(*) FROM orders WHERE waiter_id IS NOT NULL) as total_waiter_orders,
  (SELECT COUNT(*) FROM orders WHERE waiter_id IS NOT NULL AND commission_amount > 0) as orders_with_commission,
  (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'role' = 'waiter') as total_waiters,
  CASE 
    WHEN (SELECT COUNT(*) FROM orders WHERE waiter_id IS NOT NULL) = 
         (SELECT COUNT(*) FROM orders WHERE waiter_id IS NOT NULL AND commission_amount > 0)
    THEN '✅ ALL ORDERS HAVE COMMISSION'
    ELSE '⚠️  SOME ORDERS MISSING COMMISSION'
  END as commission_status;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
DECLARE
  waiter_count int;
  order_count int;
  commission_count int;
BEGIN
  SELECT COUNT(*) INTO waiter_count FROM auth.users WHERE raw_user_meta_data->>'role' = 'waiter';
  SELECT COUNT(*) INTO order_count FROM orders WHERE waiter_id IS NOT NULL;
  SELECT COUNT(*) INTO commission_count FROM orders WHERE waiter_id IS NOT NULL AND commission_amount > 0;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WAITER ORDERS VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Waiters in system: %', waiter_count;
  RAISE NOTICE 'Orders with waiter_id: %', order_count;
  RAISE NOTICE 'Orders with commission: %', commission_count;
  RAISE NOTICE '';
  
  IF waiter_count = 0 THEN
    RAISE NOTICE '⚠️  No waiters found - create waiter accounts first';
  ELSIF order_count = 0 THEN
    RAISE NOTICE '⚠️  No waiter orders found - waiters need to create orders';
  ELSIF commission_count < order_count THEN
    RAISE NOTICE '⚠️  % orders missing commission - run backfill query', (order_count - commission_count);
  ELSE
    RAISE NOTICE '✅ All checks passed! Waiter orders are working correctly.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
