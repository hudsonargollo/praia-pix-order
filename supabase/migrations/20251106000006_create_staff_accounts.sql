-- Create staff accounts with confirmed emails
-- This migration creates kitchen and cashier accounts that bypass email confirmation

-- Kitchen staff account
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  updated_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
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
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "kitchen"}',
  '{"role": "kitchen", "full_name": "Kitchen Staff"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Cashier staff account
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  updated_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
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
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "cashier"}',
  '{"role": "cashier", "full_name": "Cashier Staff"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create identities for the users (required for auth to work properly)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email IN ('kitchen@cocoloko.com.br', 'cashier@cocoloko.com.br')
ON CONFLICT (provider, user_id) DO NOTHING;