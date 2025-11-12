-- Complete fix for waiter authentication issue
-- This script will ensure waiters have proper roles and can login correctly

-- First, let's check current waiter status
SELECT 
  'Current waiter status:' as info,
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role,
  created_at
FROM auth.users
WHERE email LIKE '%garcom%' OR email LIKE '%waiter%'
ORDER BY created_at DESC;

-- Update existing waiter with proper role in both metadata fields
UPDATE auth.users 
SET 
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "waiter"}'::jsonb,
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "waiter"}'::jsonb,
  updated_at = now()
WHERE email = 'garcom1@cocoloko.com';

-- If waiter doesn't exist, create one
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) 
SELECT 
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'garcom1@cocoloko.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"role": "waiter"}'::jsonb,
  '{"role": "waiter"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'garcom1@cocoloko.com'
);

-- Ensure the waiter exists in the waiters table
INSERT INTO waiters (id, name, email, commission_rate, created_at, updated_at)
SELECT 
  u.id,
  'Garçom 1',
  'garcom1@cocoloko.com',
  0.10,
  now(),
  now()
FROM auth.users u
WHERE u.email = 'garcom1@cocoloko.com'
AND NOT EXISTS (
  SELECT 1 FROM waiters w WHERE w.email = 'garcom1@cocoloko.com'
);

-- Verify the fix
SELECT 
  'After fix - waiter status:' as info,
  u.id,
  u.email,
  u.raw_user_meta_data,
  u.raw_app_meta_data,
  u.raw_user_meta_data->>'role' as user_role,
  u.raw_app_meta_data->>'role' as app_role,
  w.name as waiter_name,
  w.commission_rate
FROM auth.users u
LEFT JOIN waiters w ON u.id = w.id
WHERE u.email = 'garcom1@cocoloko.com';

-- Create RPC function to get user role (if it doesn't exist)
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- First try to get role from auth.users metadata
  SELECT 
    COALESCE(
      raw_user_meta_data->>'role',
      raw_app_meta_data->>'role'
    ) INTO user_role
  FROM auth.users
  WHERE id = user_id;
  
  -- If no role found in metadata, check specific tables
  IF user_role IS NULL THEN
    -- Check if user is a waiter
    IF EXISTS (SELECT 1 FROM waiters WHERE id = user_id) THEN
      user_role := 'waiter';
    -- Check if user is admin (you can add admin logic here)
    ELSE
      user_role := 'admin'; -- Default fallback
    END IF;
  END IF;
  
  RETURN user_role;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO anon;