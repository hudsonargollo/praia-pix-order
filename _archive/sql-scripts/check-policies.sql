-- Check if admin policies exist on menu_items and menu_categories
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

-- Check user roles
SELECT ur.role, u.email, u.id
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY u.email;

-- Test if the admin user can select menu items (run this while logged in as admin)
-- This will show if RLS is blocking the query
SELECT COUNT(*) as total_items FROM public.menu_items;
SELECT COUNT(*) as total_categories FROM public.menu_categories;
