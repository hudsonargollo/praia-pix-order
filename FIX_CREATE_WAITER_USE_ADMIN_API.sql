-- Updated create_waiter_user function using proper Supabase patterns
-- This version doesn't directly manipulate auth tables

CREATE OR REPLACE FUNCTION public.create_waiter_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone_number TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with email % already exists', p_email;
  END IF;

  -- Note: The actual user creation should be done via the Edge Function
  -- using Supabase Admin API (auth.admin.createUser)
  -- This function just handles the profile creation
  
  -- For now, we'll return an error asking to use the proper API
  RAISE EXCEPTION 'Please use the Edge Function API to create users. Direct SQL user creation is not supported.';
  
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_waiter_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
