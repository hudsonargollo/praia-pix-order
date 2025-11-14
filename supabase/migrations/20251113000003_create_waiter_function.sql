-- Create function to create waiter users
-- This function allows admins to create waiter accounts

CREATE OR REPLACE FUNCTION public.create_waiter_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with email % already exists', p_email;
  END IF;

  -- Generate user ID
  v_user_id := gen_random_uuid();
  
  -- Hash the password using pgcrypto
  v_encrypted_password := crypt(p_password, gen_salt('bf'));

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
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Add waiter role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'waiter');

  -- Also create profile if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_waiter_user(TEXT, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_waiter_user IS 'Creates a new waiter user account with proper authentication and role assignment';
