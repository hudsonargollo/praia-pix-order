-- Check what policies currently exist on orders and order_items tables

SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd, policyname;
