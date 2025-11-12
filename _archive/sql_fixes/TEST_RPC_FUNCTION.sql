-- Test if the RPC function exists and works
SELECT public.get_user_role(id) as role, email
FROM auth.users
WHERE email = 'admin@cocoloko.com.br';

-- If the above fails, run this to create the function:
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT COALESCE(
    raw_user_meta_data->>'role',
    raw_app_meta_data->>'role',
    'default'
  ) INTO user_role
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;

-- Test again
SELECT public.get_user_role(id) as role, email
FROM auth.users
WHERE email = 'admin@cocoloko.com.br';
