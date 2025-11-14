-- Test the create_waiter_user function directly
-- Run this in Supabase SQL Editor

-- Test creating a waiter
SELECT public.create_waiter_user(
  'test-waiter@example.com',
  'testpassword123',
  'Test Waiter'
);

-- If successful, check if the user was created
SELECT email, raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'test-waiter@example.com';

-- Check if role was assigned
SELECT ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'test-waiter@example.com';
