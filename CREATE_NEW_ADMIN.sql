-- Create a NEW admin account with different email
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
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@cocoloko.com',
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email'),
    'role', 'admin'
  ),
  jsonb_build_object(
    'role', 'admin',
    'full_name', 'Administrator'
  ),
  false
);

-- Verify the new account
SELECT 
  email,
  public.get_user_role(id) as role,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email = 'admin@cocoloko.com';

-- Test the RPC function
SELECT public.get_user_role(id) as role, email
FROM auth.users
WHERE email = 'admin@cocoloko.com';
