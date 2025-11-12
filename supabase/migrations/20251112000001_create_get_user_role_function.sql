-- Create get_user_role function for role-based access control
-- This function is used throughout the application to determine user roles
-- Referenced in: ProtectedRoute.tsx, Auth.tsx, WaiterDiagnostic.tsx

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  user_role text;
BEGIN
  -- Try to get role from profiles table first
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- If not found in profiles, try user metadata as fallback
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
  
  -- Default to customer if no role found
  RETURN COALESCE(user_role, 'customer');
END;
$;

-- Grant execute permissions to authenticated and anonymous users
-- This allows the function to be called from the frontend
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_role(uuid) IS 
  'Returns the role of a user by checking profiles table first, then auth metadata. Used for role-based access control throughout the application.';
