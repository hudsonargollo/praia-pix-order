-- Check all policies on menu_items and menu_categories
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
WHERE tablename IN ('menu_items', 'menu_categories')
ORDER BY tablename, policyname;
