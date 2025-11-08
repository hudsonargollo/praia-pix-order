-- ============================================================================
-- VERIFY SYSTEM SETUP
-- ============================================================================
-- Run this to check if everything is configured correctly
-- ============================================================================

-- 1. Check if functions exist
SELECT 
  routine_name, 
  routine_type,
  security_type,
  'Function exists' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('confirm_order_payment', 'mark_order_ready', 'mark_order_completed')
ORDER BY routine_name;

-- Should return 3 rows

-- 2. Check if realtime is enabled for orders table
SELECT 
  schemaname,
  tablename,
  'Realtime enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'orders';

-- Should return 1 row

-- 3. Check if whatsapp_notifications table exists
SELECT 
  table_name,
  'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'whatsapp_notifications';

-- Should return 1 row

-- 4. Test confirm_order_payment function (dry run - will fail but shows it exists)
-- Don't actually run this, just shows the function signature
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  'Ready to use' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('confirm_order_payment', 'mark_order_ready', 'mark_order_completed');

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If all queries return results, your system is ready!
-- ============================================================================
