-- Debug: Check if admin can access their own profile
-- Run this in Supabase SQL Editor

-- 1. Check the admin user exists and has the role
SELECT 
  u.id,
  u.email,
  p.role,
  p.full_name
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';

-- 2. Check all RLS policies on profiles table
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
WHERE tablename = 'profiles';

-- 3. Test if the admin policy works
-- This simulates what the Edge Function does
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "09cf9519-a82a-4a82-afc8-35d3358e6ff3"}'; -- Replace with actual admin user ID

SELECT role FROM public.profiles WHERE id = '09cf9519-a82a-4a82-afc8-35d3358e6ff3';

RESET role;
