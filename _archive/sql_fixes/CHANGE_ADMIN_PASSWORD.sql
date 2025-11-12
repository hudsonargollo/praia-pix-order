-- Change password for admin@cocoloko.com
-- Run this in Supabase SQL Editor

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the admin password and set admin role
-- Change '123456' to your desired password
UPDATE auth.users 
SET 
  encrypted_password = crypt('123456', gen_salt('bf')),
  raw_app_meta_data = '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
  raw_user_meta_data = '{"role": "admin", "full_name": "Administrator"}'::jsonb,
  email_confirmed_at = NOW(),
  phone_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@cocoloko.com';

-- Verify the update
SELECT 
  id,
  email,
  raw_app_meta_data ->> 'role' as role,
  raw_user_meta_data ->> 'full_name' as full_name,
  email_confirmed_at,
  phone_confirmed_at,
  updated_at
FROM auth.users 
WHERE email = 'admin@cocoloko.com';