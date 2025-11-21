-- Set a user as admin
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql

-- REPLACE 'your-email@example.com' with your actual email address

-- Update user metadata to set role as admin
UPDATE auth.users
SET 
  raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb,
  raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'katramachiproducoes@gmail.com';  -- CHANGE THIS TO YOUR EMAIL

-- Also update or create profile entry
INSERT INTO public.profiles (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'katramachiproducoes@gmail.com'  -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';

-- Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_from_metadata,
  raw_app_meta_data->>'role' as role_from_app_metadata
FROM auth.users
WHERE email = 'katramachiproducoes@gmail.com';  -- CHANGE THIS TO YOUR EMAIL
