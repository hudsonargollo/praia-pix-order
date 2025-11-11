-- Fix admin profile to ensure admin role is set correctly
-- Run this in Supabase SQL Editor

-- First, check if the admin user exists and their current profile
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as user_meta_role,
  u.raw_app_meta_data->>'role' as app_meta_role,
  p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';

-- Insert or update the profile to ensure admin role
INSERT INTO public.profiles (id, role, updated_at)
SELECT 
  id,
  'admin',
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
  u.raw_user_meta_data->>'role' as user_meta_role,
  u.raw_app_meta_data->>'role' as app_meta_role,
  p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';
