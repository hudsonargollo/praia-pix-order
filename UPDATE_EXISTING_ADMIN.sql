-- Just update the existing admin account's role without deleting
UPDATE auth.users 
SET 
  raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'full_name', 'Administrator'
  ),
  raw_app_meta_data = jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email'),
    'role', 'admin'
  )
WHERE email = 'admin@cocoloko.com.br';

-- Verify
SELECT 
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  public.get_user_role(id) as role_from_function
FROM auth.users 
WHERE email = 'admin@cocoloko.com.br';
