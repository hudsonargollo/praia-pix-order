-- ============================================
-- Create Waiter Account - Working Version
-- ============================================
-- Run this in Supabase SQL Editor
-- This version handles all constraints properly

-- CHANGE THESE VALUES:
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  waiter_email TEXT := 'garcom1@cocoloko.com';
  waiter_password TEXT := 'garcom123';
  waiter_name TEXT := 'Garçom 1';
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_sent_at,
    confirmed_at,
    email_change,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_sent_at,
    reauthentication_token,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    waiter_email,
    crypt(waiter_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'waiter'),
    jsonb_build_object('full_name', waiter_name, 'role', 'waiter'),
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    NOW(),
    NOW(),
    '',
    '',
    0,
    NULL,
    NOW(),
    '',
    false,
    NULL
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at,
    email
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', waiter_email),
    'email',
    new_user_id::text,
    NOW(),
    NOW(),
    NOW(),
    waiter_email
  );

  RAISE NOTICE '✅ Waiter created successfully!';
  RAISE NOTICE 'Email: %', waiter_email;
  RAISE NOTICE 'Password: %', waiter_password;
  RAISE NOTICE 'User ID: %', new_user_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Login at: /waiter';
END $$;

-- Verify the waiter was created
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'waiter'
ORDER BY created_at DESC
LIMIT 5;
