-- Check if waiters exist in profiles table
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role = 'waiter'
ORDER BY created_at DESC;

-- Also check auth.users to see if the user exists there
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%waiter%' OR email LIKE '%garcom%'
ORDER BY created_at DESC;
