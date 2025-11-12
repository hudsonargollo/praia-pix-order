-- Check waiter role and metadata
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users
WHERE email = 'garcom1@cocoloko.com';