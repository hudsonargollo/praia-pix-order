-- Set admin role in user metadata so Edge Functions can access it
-- Run this in Supabase SQL Editor

-- Update admin user metadata to include role
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  ),
  raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  ),
  updated_at = NOW()
WHERE email = 'admin@cocoloko.com';

-- Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as user_meta_role,
  raw_app_meta_data->>'role' as app_meta_role
FROM auth.users
WHERE email = 'admin@cocoloko.com';
