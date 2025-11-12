-- 👨‍🍳 Staff Account Creation Script (SIMPLIFIED)
-- Run this in your Supabase SQL Editor to create staff accounts

-- First, check if accounts already exist
SELECT email FROM auth.users WHERE email IN ('kitchen@cocoloko.com.br', 'cashier@cocoloko.com.br');

-- Kitchen staff account
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
  'kitchen@cocoloko.com.br',
  crypt('kitchen123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "kitchen", "full_name": "Kitchen Staff"}',
  false
);

-- Cashier staff account
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
  'cashier@cocoloko.com.br',
  crypt('cashier123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "cashier", "full_name": "Cashier Staff"}',
  false
);

-- Verify the accounts were created
SELECT 
  email, 
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE email IN ('kitchen@cocoloko.com.br', 'cashier@cocoloko.com.br');