-- Simple RLS Policy Verification
-- Run this in Supabase SQL Editor after applying the migration

-- ============================================================================
-- STEP 1: Check if RLS is enabled
-- ============================================================================

SELECT 
  '🔒 RLS Status' as check_type,
  CASE 
    WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'orders') 
    THEN '✅ RLS enabled on orders'
    ELSE '❌ RLS NOT enabled on orders'
  END as orders_status,
  CASE 
    WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'order_items') 
    THEN '✅ RLS enabled on order_items'
    ELSE '❌ RLS NOT enabled on order_items'
  END as order_items_status;

-- ============================================================================
-- STEP 2: Count policies by type
-- ============================================================================

SELECT 
  '📊 Policy Count Summary' as summary,
  tablename,
  cmd as operation,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- ============================================================================
-- STEP 3: List all policies with details
-- ============================================================================

SELECT 
  '📋 Orders Table Policies' as section,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%Public%' THEN '🌐 Public Access'
    WHEN policyname LIKE '%Authenticated%' THEN '🔐 Authenticated Access'
    WHEN policyname LIKE '%Staff%' THEN '👔 Staff Only'
    WHEN policyname LIKE '%Admin%' THEN '👑 Admin Only'
    ELSE '❓ Other'
  END as access_level
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;

SELECT 
  '📋 Order Items Table Policies' as section,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%Public%' THEN '🌐 Public Access'
    WHEN policyname LIKE '%Authenticated%' THEN '🔐 Authenticated Access'
    WHEN policyname LIKE '%Staff%' THEN '👔 Staff Only'
    WHEN policyname LIKE '%Admin%' THEN '👑 Admin Only'
    ELSE '❓ Other'
  END as access_level
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY cmd, policyname;

-- ============================================================================
-- STEP 4: Verify expected policies exist
-- ============================================================================

SELECT 
  '✅ Expected Policies Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'orders' 
      AND cmd = 'INSERT' 
      AND policyname LIKE '%Public%'
    ) THEN '✅ Public can insert orders'
    ELSE '❌ Missing: Public can insert orders'
  END as public_insert_orders,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'orders' 
      AND cmd = 'UPDATE' 
      AND policyname LIKE '%Staff%'
    ) THEN '✅ Staff can update orders'
    ELSE '❌ Missing: Staff can update orders'
  END as staff_update_orders,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'orders' 
      AND cmd = 'DELETE' 
      AND policyname LIKE '%Admin%'
    ) THEN '✅ Admin can delete orders'
    ELSE '❌ Missing: Admin can delete orders'
  END as admin_delete_orders;

SELECT 
  '✅ Expected Policies Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'order_items' 
      AND cmd = 'INSERT' 
      AND policyname LIKE '%Public%'
    ) THEN '✅ Public can insert order_items'
    ELSE '❌ Missing: Public can insert order_items'
  END as public_insert_items,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'order_items' 
      AND cmd = 'UPDATE' 
      AND policyname LIKE '%Staff%'
    ) THEN '✅ Staff can update order_items'
    ELSE '❌ Missing: Staff can update order_items'
  END as staff_update_items,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'order_items' 
      AND cmd = 'DELETE' 
      AND policyname LIKE '%Admin%'
    ) THEN '✅ Admin can delete order_items'
    ELSE '❌ Missing: Admin can delete order_items'
  END as admin_delete_items;

-- ============================================================================
-- STEP 5: Check has_role function
-- ============================================================================

SELECT 
  '🔧 Function Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') 
    THEN '✅ has_role function exists'
    ELSE '❌ has_role function missing (UPDATE/DELETE will fail!)'
  END as has_role_status;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT 
  '🎯 FINAL VERIFICATION' as summary,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'orders' AND cmd = 'INSERT') as orders_insert_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'orders' AND cmd = 'SELECT') as orders_select_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'orders' AND cmd = 'UPDATE') as orders_update_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'orders' AND cmd = 'DELETE') as orders_delete_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'order_items' AND cmd = 'INSERT') as items_insert_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'order_items' AND cmd = 'SELECT') as items_select_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'order_items' AND cmd = 'UPDATE') as items_update_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'order_items' AND cmd = 'DELETE') as items_delete_policies;

-- Expected results:
-- orders: 2 INSERT, 2 SELECT, 1 UPDATE, 1 DELETE
-- order_items: 2 INSERT, 2 SELECT, 1 UPDATE, 1 DELETE
