-- Step 2: Test creating a waiter (run AFTER step 1 completes)
-- Run this in a SEPARATE query after step 1

SELECT public.create_waiter_user(
  'test-waiter4@example.com',
  'testpassword123',
  'Test Waiter 4'
);

-- Verify the user was created
SELECT email, raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'test-waiter4@example.com';

-- Check if role was assigned
SELECT ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'test-waiter4@example.com';
