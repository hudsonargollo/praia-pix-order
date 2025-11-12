-- Create waiter account: garcom2@cocoloko.com with password 123456
-- Run this in Supabase SQL Editor

-- First, enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert the waiter user into auth.users
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
  'garcom@cocoloko.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "waiter"}',
  '{"role": "waiter", "full_name": "Garçom 2"}',
  false,
  '',
  '',
  '',
  ''
);

-- Get the user ID for the identity creation
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get the user ID we just created
  SELECT id INTO user_uuid FROM auth.users WHERE email = 'garcom@cocoloko.com';
  
  -- Create identity for the user (required for auth to work properly)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'garcom@cocoloko.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  );
END $$;

-- Verify the account was created
SELECT 
  id,
  email,
  raw_app_meta_data ->> 'role' as role,
  raw_user_meta_data ->> 'full_name' as full_name,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'garcom@cocoloko.com';