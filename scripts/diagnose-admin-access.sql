-- Diagnostic script to check admin access and RLS policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql

-- 1. Check if get_user_role function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'get_user_role';

-- 2. Test the get_user_role function with your current user
SELECT 
  auth.uid() as current_user_id,
  public.get_user_role(auth.uid()) as user_role;

-- 3. Check your user's metadata directly
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_from_metadata,
  raw_app_meta_data->>'role' as role_from_app_metadata
FROM auth.users
WHERE id = auth.uid();

-- 4. Check profiles table
SELECT 
  id,
  role
FROM public.profiles
WHERE id = auth.uid();

-- 5. List all RLS policies on menu_items
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
WHERE tablename = 'menu_items'
ORDER BY policyname;

-- 6. List all RLS policies on menu_categories
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
WHERE tablename = 'menu_categories'
ORDER BY policyname;
