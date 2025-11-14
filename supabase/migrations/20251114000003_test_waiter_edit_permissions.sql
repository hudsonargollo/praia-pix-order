-- Test script for waiter edit permissions
-- This script validates the RLS policies and audit logging functionality
-- Run this manually in Supabase SQL Editor after applying the migration

-- ============================================================================
-- SETUP TEST DATA
-- ============================================================================

-- Note: This assumes you have test waiter accounts already created
-- If not, you'll need to create them first through the application

-- Create a test function to validate policies
CREATE OR REPLACE FUNCTION public.test_waiter_edit_permissions()
RETURNS TABLE(
  test_name TEXT,
  test_result TEXT,
  details TEXT
) AS $$
DECLARE
  test_order_id UUID;
  test_waiter_id UUID;
  other_waiter_id UUID;
  audit_count INTEGER;
BEGIN
  -- Get a test waiter ID (first waiter in the system)
  SELECT id INTO test_waiter_id
  FROM auth.users
  WHERE raw_app_meta_data ->> 'role' = 'waiter'
  AND deleted_at IS NULL
  LIMIT 1;

  IF test_waiter_id IS NULL THEN
    RETURN QUERY SELECT 
      'Setup Check'::TEXT,
      'SKIP'::TEXT,
      'No waiter accounts found in system'::TEXT;
    RETURN;
  END IF;

  -- Get another waiter ID for cross-waiter tests
  SELECT id INTO other_waiter_id
  FROM auth.users
  WHERE raw_app_meta_data ->> 'role' = 'waiter'
  AND deleted_at IS NULL
  AND id != test_waiter_id
  LIMIT 1;

  -- Test 1: Check audit log table exists
  BEGIN
    SELECT COUNT(*) INTO audit_count FROM public.order_audit_log;
    RETURN QUERY SELECT 
      'Audit Log Table'::TEXT,
      'PASS'::TEXT,
      format('Audit log table exists with %s records', audit_count)::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Audit Log Table'::TEXT,
      'FAIL'::TEXT,
      SQLERRM::TEXT;
  END;

  -- Test 2: Check can_edit_order function exists
  BEGIN
    PERFORM public.can_edit_order(gen_random_uuid());
    RETURN QUERY SELECT 
      'can_edit_order Function'::TEXT,
      'PASS'::TEXT,
      'Function exists and is callable'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'can_edit_order Function'::TEXT,
      'FAIL'::TEXT,
      SQLERRM::TEXT;
  END;

  -- Test 3: Check editable_orders view exists
  BEGIN
    PERFORM * FROM public.editable_orders LIMIT 1;
    RETURN QUERY SELECT 
      'editable_orders View'::TEXT,
      'PASS'::TEXT,
      'View exists and is queryable'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'editable_orders View'::TEXT,
      'FAIL'::TEXT,
      SQLERRM::TEXT;
  END;

  -- Test 4: Check RLS policies exist on orders table
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'orders' 
      AND policyname = 'Waiters can edit unpaid orders'
    ) THEN
      RETURN QUERY SELECT 
        'Waiter Edit Policy'::TEXT,
        'PASS'::TEXT,
        'RLS policy exists on orders table'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        'Waiter Edit Policy'::TEXT,
        'FAIL'::TEXT,
        'RLS policy not found'::TEXT;
    END IF;
  END;

  -- Test 5: Check RLS policies exist on order_items table
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'order_items' 
      AND policyname IN (
        'Waiters can update order items for unpaid orders',
        'Waiters can delete order items from unpaid orders'
      )
    ) THEN
      RETURN QUERY SELECT 
        'Order Items Policies'::TEXT,
        'PASS'::TEXT,
        'RLS policies exist on order_items table'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        'Order Items Policies'::TEXT,
        'FAIL'::TEXT,
        'One or more RLS policies not found'::TEXT;
    END IF;
  END;

  -- Test 6: Check audit trigger exists
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'audit_order_modifications'
    ) THEN
      RETURN QUERY SELECT 
        'Audit Trigger'::TEXT,
        'PASS'::TEXT,
        'Audit trigger exists on orders table'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        'Audit Trigger'::TEXT,
        'FAIL'::TEXT,
        'Audit trigger not found'::TEXT;
    END IF;
  END;

  -- Test 7: Verify unpaid order statuses are recognized
  BEGIN
    IF EXISTS (
      SELECT 1 FROM public.orders
      WHERE status IN ('pending', 'pending_payment', 'in_preparation')
      LIMIT 1
    ) THEN
      RETURN QUERY SELECT 
        'Unpaid Orders Exist'::TEXT,
        'PASS'::TEXT,
        'Found orders with editable statuses'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        'Unpaid Orders Exist'::TEXT,
        'INFO'::TEXT,
        'No unpaid orders found in system'::TEXT;
    END IF;
  END;

  -- Test 8: Check if waiter has any orders
  BEGIN
    IF EXISTS (
      SELECT 1 FROM public.orders
      WHERE waiter_id = test_waiter_id
      LIMIT 1
    ) THEN
      RETURN QUERY SELECT 
        'Waiter Has Orders'::TEXT,
        'PASS'::TEXT,
        format('Test waiter %s has orders', test_waiter_id)::TEXT;
    ELSE
      RETURN QUERY SELECT 
        'Waiter Has Orders'::TEXT,
        'INFO'::TEXT,
        'Test waiter has no orders yet'::TEXT;
    END IF;
  END;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RUN TESTS
-- ============================================================================

-- Execute the test function
SELECT * FROM public.test_waiter_edit_permissions();

-- ============================================================================
-- MANUAL VERIFICATION QUERIES
-- ============================================================================

-- Query 1: List all RLS policies on orders table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- Query 2: List all RLS policies on order_items table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'order_items'
ORDER BY policyname;

-- Query 3: Check audit log structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'order_audit_log'
ORDER BY ordinal_position;

-- Query 4: List all triggers on orders table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
AND trigger_schema = 'public';

-- Query 5: Count orders by status
SELECT 
  status,
  COUNT(*) as order_count,
  COUNT(CASE WHEN waiter_id IS NOT NULL THEN 1 END) as waiter_orders
FROM public.orders
GROUP BY status
ORDER BY status;

-- Query 6: Show sample of editable orders (if any)
SELECT 
  id,
  order_number,
  status,
  waiter_id,
  created_by_waiter,
  total_amount,
  created_at
FROM public.orders
WHERE status IN ('pending', 'pending_payment', 'in_preparation')
AND waiter_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Query 7: Check if any audit logs exist
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT order_id) as unique_orders,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as first_log,
  MAX(created_at) as last_log
FROM public.order_audit_log;

-- Query 8: Show recent audit logs (if any)
SELECT 
  id,
  order_id,
  user_role,
  action,
  changed_fields,
  order_status,
  created_at
FROM public.order_audit_log
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CLEANUP TEST FUNCTION
-- ============================================================================

-- Drop the test function after running tests
DROP FUNCTION IF EXISTS public.test_waiter_edit_permissions();

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

/*
Expected test results:
1. Audit Log Table: PASS - Table should exist
2. can_edit_order Function: PASS - Function should be callable
3. editable_orders View: PASS - View should be queryable
4. Waiter Edit Policy: PASS - Policy should exist
5. Order Items Policies: PASS - Policies should exist
6. Audit Trigger: PASS - Trigger should exist
7. Unpaid Orders Exist: PASS or INFO - Depends on data
8. Waiter Has Orders: PASS or INFO - Depends on data

All policies should be listed in the manual verification queries.
The audit log should be empty initially (0 records).
*/
