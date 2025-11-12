-- Quick fix: Ensure admin user has admin role in profiles table
-- Run this in Supabase SQL Editor

-- Check current state
SELECT 
  u.id,
  u.email,
  p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';

-- Insert or update admin profile
INSERT INTO public.profiles (id, role, full_name, updated_at)
SELECT 
  id,
  'admin',
  COALESCE(raw_user_meta_data->>'full_name', 'Administrator'),
  NOW()
FROM auth.users
WHERE email = 'admin@cocoloko.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Verify the fix 
SELECT 
  u.id,
  u.email,
  p.role as profile_role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';
