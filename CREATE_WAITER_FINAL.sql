-- ============================================
-- Create Waiter Account - Final Working Version
-- ============================================
-- This matches the exact structure of existing users

-- CHANGE THESE VALUES:
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  waiter_email TEXT := 'garcom1@cocoloko.com';
  waiter_password TEXT := 'garcom123';
  waiter_name TEXT := 'Garçom 1';
BEGIN
  -- Insert into auth.users (only required fields)
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
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    waiter_email,
    crypt(waiter_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'waiter'),
    jsonb_build_object('full_name', waiter_name, 'role', 'waiter'),
    NOW(),
    NOW()
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id::text,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', waiter_email, 'email_verified', false, 'phone_verified', false),
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
