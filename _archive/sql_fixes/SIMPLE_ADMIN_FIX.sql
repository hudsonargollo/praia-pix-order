-- 🔧 SIMPLE ADMIN FIX
-- Just update the existing admin account to have the proper role

-- Update the admin account
UPDATE auth.users 
SET 
  raw_user_meta_data = '{"role": "admin", "full_name": "Administrator"}'::jsonb,
  raw_app_meta_data = '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb
WHERE email = 'admin@cocoloko.com.br';

-- Verify it worked
SELECT 
  email, 
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users 
WHERE email = 'admin@cocoloko.com.br';

-- ✅ You should see:
-- email: admin@cocoloko.com.br
-- user_role: admin
-- app_role: admin
