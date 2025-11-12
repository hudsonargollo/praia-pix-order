-- Add update waiter function to allow editing name and password

CREATE OR REPLACE FUNCTION public.update_waiter_user(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_password text DEFAULT NULL
)
RETURNS json
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_role text;
  v_encrypted_password text;
  v_updated_fields text[] := ARRAY[]::text[];
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

  -- Update full name if provided
  IF p_full_name IS NOT NULL THEN
    UPDATE auth.users
    SET 
      raw_user_meta_data = jsonb_set(raw_user_meta_data, '{full_name}', to_jsonb(p_full_name)),
      updated_at = now()
    WHERE id = p_user_id;
    
    v_updated_fields := array_append(v_updated_fields, 'full_name');
  END IF;

  -- Update password if provided
  IF p_password IS NOT NULL THEN
    IF length(p_password) < 6 THEN
      RAISE EXCEPTION 'Password must be at least 6 characters';
    END IF;

    v_encrypted_password := extensions.crypt(p_password, extensions.gen_salt('bf'));
    
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_password,
      updated_at = now()
    WHERE id = p_user_id;
    
    v_updated_fields := array_append(v_updated_fields, 'password');
  END IF;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'updated_fields', v_updated_fields,
    'message', 'Waiter updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating waiter: %', SQLERRM;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.update_waiter_user(uuid, text, text) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ update_waiter_user() function created!';
  RAISE NOTICE 'Usage: SELECT update_waiter_user(user_id, full_name, password)';
END $$;
