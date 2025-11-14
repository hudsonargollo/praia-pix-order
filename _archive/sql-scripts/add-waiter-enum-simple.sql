-- Add 'waiter' to the app_role enum (simple version)
-- Run this, it will error if 'waiter' already exists, which is fine

ALTER TYPE app_role ADD VALUE 'waiter';
