-- Fix infinite recursion by disabling RLS on user_roles table
-- The user_roles table should not have RLS since it's only used for permission checks
-- Run this in Supabase SQL Editor

-- Disable RLS on user_roles to prevent recursion
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_roles';

-- Now test the policies work
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('menu_items', 'menu_categories')
ORDER BY tablename, policyname;
