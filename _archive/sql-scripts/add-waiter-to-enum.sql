-- Add 'waiter' to the app_role enum
-- Run this in Supabase SQL Editor

-- Add waiter to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'waiter';

-- Verify the enum values
SELECT unnest(enum_range(NULL::app_role)) as role_values;

-- Now test creating a waiter again
SELECT public.create_waiter_user(
  'test-waiter3@example.com',
  'testpassword123',
  'Test Waiter 3'
);
