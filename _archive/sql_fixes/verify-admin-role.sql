-- Verify admin role in profiles table
SELECT 
  u.id,
  u.email,
  u.user_metadata->>'role' as user_meta_role,
  u.app_metadata->>'role' as app_meta_role,
  p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';

-- If profile doesn't exist or role is wrong, fix it:
INSERT INTO public.profiles (id, role, full_name)
SELECT 
  id, 
  'admin',
  COALESCE(user_metadata->>'full_name', 'Administrator')
FROM auth.users 
WHERE email = 'admin@cocoloko.com'
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';

-- Verify the fix
SELECT 
  u.id,
  u.email,
  u.user_metadata->>'role' as user_meta_role,
  u.app_metadata->>'role' as app_meta_role,
  p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';
