-- 🔧 CREATE OR UPDATE ADMIN ACCOUNT
-- This will either create a new admin account or update the existing one

-- First, delete the old admin account if it exists (to start fresh)
DELETE FROM auth.users WHERE email = 'admin@cocoloko.com.br';

-- Now create a fresh admin account with proper role
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
  confirmation_sent_at,
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
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
  '{"role": "admin", "full_name": "Administrator"}'::jsonb,
  false
);

-- Verify the admin account was created correctly
SELECT 
  id,
  email, 
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role,
  email_confirmed_at IS NOT NULL as email_confirmed,
  confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email = 'admin@cocoloko.com.br';

-- ✅ After running this:
-- 1. Go to the app
-- 2. Click "Gerente"
-- 3. Login with: admin@cocoloko.com.br / admin123
-- 4. You should see the Admin Panel
