-- Final working version of create_waiter_user function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.create_waiter_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
  v_identity_id UUID;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with email % already exists', p_email;
  END IF;

  -- Generate IDs
  v_user_id := gen_random_uuid();
  v_identity_id := gen_random_uuid();
  
  -- Hash the password using pgcrypto from extensions schema
  v_encrypted_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Insert into auth.users
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
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_password,
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_full_name),
    false,
    '',
    '',
    '',
    ''
  );

  -- Insert into auth.identities with all required fields
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_identity_id,
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Add waiter role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'waiter'::app_role);

  -- Also create profile if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (v_user_id, 'waiter', p_full_name)
    ON CONFLICT (id) DO UPDATE SET role = 'waiter', full_name = p_full_name;
  END IF;

  -- Return success with user ID
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating waiter: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_waiter_user(TEXT, TEXT, TEXT) TO authenticated;
