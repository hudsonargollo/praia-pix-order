-- Test if we can query waiters directly from the database
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role = 'waiter'
ORDER BY created_at DESC;
