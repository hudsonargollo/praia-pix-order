-- Minimal waiter creation - just create the user with proper metadata
-- Run this in Supabase SQL Editor

-- Delete existing waiter if exists
DELETE FROM auth.users WHERE email = 'garcom1@cocoloko.com';

-- Create waiter with proper metadata
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'garcom1@cocoloko.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"role": "waiter"}'::jsonb,
  '{"role": "waiter"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Verify creation
SELECT 
  'Waiter created:' as status,
  id,
  email,
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users
WHERE email = 'garcom1@cocoloko.com';