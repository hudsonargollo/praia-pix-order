-- Fix Hudson waiter role
-- Run this in Supabase SQL Editor

-- Check current status
SELECT 
    au.id,
    au.email,
    p.role as profile_role,
    ur.role as user_role
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE au.email = 'hudsonargollo2@gmail.com';

-- Add waiter role if missing
INSERT INTO user_roles (user_id, role)
SELECT id, 'waiter'
FROM auth.users
WHERE email = 'hudsonargollo2@gmail.com'
AND id NOT IN (SELECT user_id FROM user_roles WHERE role = 'waiter')
ON CONFLICT DO NOTHING;

-- Update profile role if missing
UPDATE profiles
SET role = 'waiter'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'hudsonargollo2@gmail.com')
AND (role IS NULL OR role != 'waiter');

-- Verify fix
SELECT 
    au.id,
    au.email,
    p.role as profile_role,
    p.full_name,
    ur.role as user_role
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE au.email = 'hudsonargollo2@gmail.com';
