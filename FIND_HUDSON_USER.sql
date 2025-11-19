-- Find the Hudson user we just created
-- Run this in Supabase SQL Editor

-- Check in auth.users
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users
WHERE email = 'hudsonargollo2@gmail.com';

-- Check in profiles
SELECT id, full_name, role, phone_number, created_at
FROM profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'hudsonargollo2@gmail.com'
);

-- Check in user_roles
SELECT user_id, role
FROM user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'hudsonargollo2@gmail.com'
);
