-- Alternative waiter management using database functions
-- This bypasses the Auth Admin API which has permission issues

-- ============================================================================
-- PART 1: Create waiter user function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_waiter_user(
  p_email text,
  p_password text,
  p_full_name text
)
RETURNS json
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_password text;
BEGIN
  -- Validate inputs
  IF p_email IS NULL OR p_password IS NULL OR p_full_name IS NULL THEN
    RAISE EXCEPTION 'Email, password, and full name are required';
  END IF;

  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;

  -- Generate UUID for new user
  v_user_id := extensions.uuid_generate_v4();

  -- Encrypt password using crypt
  v_encrypted_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    aud,
    role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    v_encrypted_password,
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'waiter'),
    jsonb_build_object('full_name', p_full_name, 'role', 'waiter'),
    now(),
    now(),
    '',
    'authenticated',
    'authenticated'
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
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    now(),
    now(),
    now()
  );

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'full_name', p_full_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating waiter: %', SQLERRM;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_waiter_user(text, text, text) TO authenticated;

-- ============================================================================
-- PART 2: Delete waiter user function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_waiter_user(
  p_user_id uuid
)
RETURNS json
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Check if user exists and is a waiter
  SELECT raw_user_meta_data->>'role' INTO v_user_role
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user_role != 'waiter' THEN
    RAISE EXCEPTION 'User is not a waiter';
  END IF;

  -- Delete from auth.identities first (foreign key constraint)
  DELETE FROM auth.identities WHERE user_id = p_user_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = p_user_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'message', 'Waiter deleted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting waiter: %', SQLERRM;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_waiter_user(uuid) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ WAITER MANAGEMENT FUNCTIONS CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 create_waiter_user(email, password, full_name)';
  RAISE NOTICE '🗑️  delete_waiter_user(user_id)';
  RAISE NOTICE '📋 list_waiter_users() - Already exists';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  These functions bypass the Auth Admin API';
  RAISE NOTICE '   and work directly with the database';
  RAISE NOTICE '';
END $$;
