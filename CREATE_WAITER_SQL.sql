-- ============================================
-- Create Waiter Account
-- ============================================
-- Run this in Supabase SQL Editor
-- Change the email, password, and name as needed

DO $$
DECLARE
  new_user_id UUID;
  waiter_email TEXT := 'garcom1@cocoloko.com'; -- CHANGE THIS
  waiter_password TEXT := 'garcom123'; -- CHANGE THIS
  waiter_name TEXT := 'Garçom 1'; -- CHANGE THIS
BEGIN
  -- Create the auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    waiter_email,
    crypt(waiter_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email'],
      'role', 'waiter'
    ),
    jsonb_build_object(
      'full_name', waiter_name,
      'role', 'waiter'
    ),
    NOW(),
    NOW(),
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Create identity
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', waiter_email
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Waiter created successfully!';
  RAISE NOTICE 'Email: %', waiter_email;
  RAISE NOTICE 'Password: %', waiter_password;
  RAISE NOTICE 'User ID: %', new_user_id;
  RAISE NOTICE '';
  RAISE NOTICE 'The waiter can now login at /waiter';
END $$;

-- Verify the waiter was created
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'waiter'
ORDER BY created_at DESC;
