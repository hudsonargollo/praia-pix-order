-- 🔧 Basic Staff Account Creation
-- This is the simplest possible approach

-- Check current users first
SELECT email, email_confirmed_at FROM auth.users;

-- Create kitchen account (basic approach)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'kitchen@cocoloko.com.br',
  crypt('kitchen123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Create cashier account (basic approach)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'cashier@cocoloko.com.br',
  crypt('cashier123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Verify accounts were created
SELECT email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users 
WHERE email LIKE '%cocoloko.com.br';