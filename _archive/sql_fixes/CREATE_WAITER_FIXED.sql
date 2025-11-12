-- ============================================
-- Create Waiter Account - Fixed Version
-- ============================================
-- This matches the exact structure from the staff accounts migration

-- CHANGE THESE VALUES:
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  waiter_email TEXT := 'garcom2@cocoloko.com';
  waiter_password TEXT := 'garcom123';
  waiter_name TEXT := 'Garçom 2';
BEGIN
  -- Insert into auth.users (matching staff accounts migration structure)
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
    new_user_id,
    'authenticated',
    'authenticated',
    waiter_email,
    crypt(waiter_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'waiter'),
    jsonb_build_object('role', 'waiter', 'full_name', waiter_name),
    false,
    '',
    '',
    '',
    ''
  );

  -- Insert into auth.identities
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
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', waiter_email),
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
  RAISE NOTICE 'Login at: /auth';
END $$;

-- Verify the waiter was created
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as name,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as email_confirmed,
  phone_confirmed_at IS NOT NULL as phone_confirmed
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'waiter'
ORDER BY created_at DESC;
