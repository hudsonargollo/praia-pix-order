-- Fix waiter accounts that have incorrect roles
-- This updates profiles and user_roles for waiter accounts

-- Update profiles table - set role to 'waiter' for waiter email accounts
UPDATE profiles 
SET role = 'waiter'
WHERE email LIKE '%@cocoloko.com' 
  AND email != 'admin@cocoloko.com'
  AND role != 'admin';

-- Update or insert into user_roles table
INSERT INTO user_roles (user_id, role)
SELECT id, 'waiter'
FROM profiles
WHERE email LIKE '%@cocoloko.com' 
  AND email != 'admin@cocoloko.com'
  AND role = 'waiter'
ON CONFLICT (user_id, role) 
DO NOTHING;

-- Remove incorrect 'customer' role from waiters
DELETE FROM user_roles
WHERE role = 'customer'
  AND user_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE '%@cocoloko.com' 
      AND email != 'admin@cocoloko.com'
  );

-- Verify the changes
SELECT p.email, p.role, ur.role as user_roles_role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email LIKE '%@cocoloko.com'
ORDER BY p.email;
