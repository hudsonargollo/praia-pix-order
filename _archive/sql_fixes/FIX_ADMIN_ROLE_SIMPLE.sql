-- 🔧 QUICK FIX: Set Admin Role
-- Run this in Supabase SQL Editor to fix the admin account

-- Update admin account to have proper role
UPDATE auth.users 
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'),
    '{role}',
    '"admin"'
  ),
  raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'),
    '{role}',
    '"admin"'
  )
WHERE email = 'admin@cocoloko.com.br';

-- Verify the fix
SELECT 
  email, 
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users 
WHERE email = 'admin@cocoloko.com.br';

-- ✅ After running this:
-- 1. Logout from the app
-- 2. Clear browser cache/cookies
-- 3. Login again with admin@cocoloko.com.br / admin123
