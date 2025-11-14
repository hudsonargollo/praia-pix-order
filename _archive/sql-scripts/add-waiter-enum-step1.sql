-- Step 1: Add 'waiter' to the app_role enum
-- Run this FIRST, then run step 2 in a separate query

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'waiter';

-- Verify the enum values
SELECT unnest(enum_range(NULL::app_role)) as role_values;
