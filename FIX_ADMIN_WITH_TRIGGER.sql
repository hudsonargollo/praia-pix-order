-- 🔧 FIX ADMIN WITH PROPER JWT CLAIMS
-- This ensures the role is included in the JWT token

-- Step 1: Delete old admin
DELETE FROM auth.users WHERE email = 'admin@cocoloko.com.br';

-- Step 2: Create admin with role in BOTH metadata fields
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

-- Step 3: Verify
SELECT 
  email,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users 
WHERE email = 'admin@cocoloko.com.br';

-- ✅ After running this:
-- 1. Logout completely
-- 2. Close all browser tabs
-- 3. Clear browser cache/cookies
-- 4. Open new incognito/private window
-- 5. Go to the app and login
-- 6. Should work!
