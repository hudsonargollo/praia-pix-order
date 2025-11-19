-- Check what waiters exist in the database
-- Run this in Supabase SQL Editor

-- Check profiles table
SELECT 
    p.id,
    p.full_name,
    p.phone_number,
    p.role,
    p.created_at,
    au.email
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.role = 'waiter'
ORDER BY p.created_at DESC;

-- Also check user_roles table
SELECT 
    ur.user_id,
    ur.role,
    p.full_name,
    au.email
FROM user_roles ur
LEFT JOIN profiles p ON p.id = ur.user_id
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.role = 'waiter';
