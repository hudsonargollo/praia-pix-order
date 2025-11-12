-- 🔧 DELETE AND CREATE ADMIN ACCOUNT
-- This will completely remove the old admin and create a fresh one

-- Step 1: Delete the old admin account completely
DELETE FROM auth.users WHERE email = 'admin@cocoloko.com.br';

-- Step 2: Create a fresh admin account with proper role
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
  'admin@cocoloko.com.br',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
  '{"role": "admin", "full_name": "Administrator"}'::jsonb,
  false
);

-- Step 3: Verify the admin account was created correctly
SELECT 
  email, 
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email = 'admin@cocoloko.com.br';

-- ✅ You should see:
-- email: admin@cocoloko.com.br
-- user_role: admin
-- app_role: admin
-- email_confirmed: true

-- 📝 After running this SQL:
-- 1. Go to the app
-- 2. Logout if you're logged in
-- 3. Clear browser cache/cookies (or use incognito mode)
-- 4. Click "Gerente"
-- 5. Login with: admin@cocoloko.com.br / admin123
-- 6. You should see the Admin Panel!
