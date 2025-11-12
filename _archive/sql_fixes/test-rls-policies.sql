-- Test RLS Policies for Customer Order Creation
-- Run this file to verify the migration was applied correctly

-- ============================================================================
-- STEP 1: Verify RLS is enabled
-- ============================================================================

SELECT 
  'orders' as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'orders'
UNION ALL
SELECT 
  'order_items' as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'order_items';

-- ============================================================================
-- STEP 2: List all policies on orders table
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;

-- ============================================================================
-- STEP 3: List all policies on order_items table
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY cmd, policyname;

-- ============================================================================
-- STEP 4: Test INSERT as anonymous user (simulated)
-- ============================================================================

-- Note: This test simulates anonymous access by checking if the policy allows it
-- In a real test, you would need to use the Supabase client without authentication

-- Check if INSERT policies exist that allow public access
SELECT 
  COUNT(*) as public_insert_policies,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Public INSERT policies exist'
    ELSE '❌ Missing public INSERT policies'
  END as status
FROM pg_policies
WHERE tablename = 'orders'
  AND cmd = 'INSERT'
  AND (policyname LIKE '%Public%' OR policyname LIKE '%Authenticated%');

SELECT 
  COUNT(*) as public_insert_policies,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Public INSERT policies exist'
    ELSE '❌ Missing public INSERT policies'
  END as status
FROM pg_policies
WHERE tablename = 'order_items'
  AND cmd = 'INSERT'
  AND (policyname LIKE '%Public%' OR policyname LIKE '%Authenticated%');

-- ============================================================================
-- STEP 5: Verify UPDATE policies are restrictive (staff only)
-- ============================================================================

SELECT 
  COUNT(*) as staff_update_policies,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ Staff UPDATE policies exist'
    ELSE '❌ Missing staff UPDATE policies'
  END as status
FROM pg_policies
WHERE tablename = 'orders'
  AND cmd = 'UPDATE'
  AND policyname LIKE '%Staff%';

SELECT 
  COUNT(*) as staff_update_policies,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ Staff UPDATE policies exist'
    ELSE '❌ Missing staff UPDATE policies'
  END as status
FROM pg_policies
WHERE tablename = 'order_items'
  AND cmd = 'UPDATE'
  AND policyname LIKE '%Staff%';

-- ============================================================================
-- STEP 6: Verify DELETE policies are restrictive (admin only)
-- ============================================================================

SELECT 
  COUNT(*) as admin_delete_policies,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ Admin DELETE policies exist'
    ELSE '❌ Missing admin DELETE policies'
  END as status
FROM pg_policies
WHERE tablename = 'orders'
  AND cmd = 'DELETE'
  AND policyname LIKE '%Admin%';

SELECT 
  COUNT(*) as admin_delete_policies,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ Admin DELETE policies exist'
    ELSE '❌ Missing admin DELETE policies'
  END as status
FROM pg_policies
WHERE tablename = 'order_items'
  AND cmd = 'DELETE'
  AND policyname LIKE '%Admin%';

-- ============================================================================
-- STEP 7: Summary Report
-- ============================================================================

SELECT 
  '=== RLS POLICY VERIFICATION SUMMARY ===' as report;

SELECT 
  'Orders Table' as table_name,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'orders'
UNION ALL
SELECT 
  'Order Items Table' as table_name,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'order_items';

-- ============================================================================
-- STEP 8: Check has_role function exists
-- ============================================================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') 
    THEN '✅ has_role function exists'
    ELSE '❌ has_role function missing - UPDATE/DELETE policies will fail'
  END as has_role_status;
