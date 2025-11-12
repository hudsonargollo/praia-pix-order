-- Create the get_user_role function that's being referenced
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Try to get role from profiles table first
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- If not found in profiles, try user metadata
  IF user_role IS NULL THEN
    SELECT 
      COALESCE(
        raw_user_meta_data->>'role',
        raw_app_meta_data->>'role',
        'customer'
      ) INTO user_role
    FROM auth.users
    WHERE id = user_id;
  END IF;
  
  RETURN COALESCE(user_role, 'customer');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;

-- Test the function
SELECT 
  u.email,
  public.get_user_role(u.id) as role
FROM auth.users u
WHERE u.email = 'admin@cocoloko.com';
