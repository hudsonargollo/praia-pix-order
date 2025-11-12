-- 👨‍💼 Admin Account Creation Script
-- Run this in your Supabase SQL Editor to create the admin account

-- Check if admin account already exists
SELECT email FROM auth.users WHERE email = 'admin@cocoloko.com.br';

-- Create admin account
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@cocoloko.com.br',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin", "full_name": "Administrator"}',
  false
);

-- Verify the account was created
SELECT 
  email, 
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users 
WHERE email = 'admin@cocoloko.com.br';

-- 📝 Admin Account Credentials:
-- Email: admin@cocoloko.com.br
-- Password: admin123
-- 
-- ⚠️ IMPORTANT: Change this password after first login!
