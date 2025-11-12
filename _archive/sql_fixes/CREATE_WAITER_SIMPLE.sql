-- ============================================
-- Create Waiter - Simple Version
-- ============================================
-- Run this in Supabase SQL Editor

-- Step 1: Create the user using Supabase's admin function
-- CHANGE THESE VALUES:
SELECT extensions.create_user(
  email := 'garcom1@cocoloko.com',
  password := 'garcom123',
  email_confirm := true,
  user_metadata := '{"full_name": "Garçom 1", "role": "waiter"}'::jsonb,
  app_metadata := '{"role": "waiter"}'::jsonb
);

-- Step 2: Verify the user was created
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as name,
  raw_app_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = 'garcom1@cocoloko.com';
