-- Fix waiter deletion by setting waiter_id to NULL when waiter is deleted
-- This allows waiters to be deleted even if they have orders

-- Drop the existing foreign key constraint
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_waiter_id_fkey;

-- Add the constraint back with ON DELETE SET NULL
ALTER TABLE public.orders
ADD CONSTRAINT orders_waiter_id_fkey 
FOREIGN KEY (waiter_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Add a comment explaining the behavior
COMMENT ON COLUMN public.orders.waiter_id IS 'References the waiter who handled the order. Set to NULL if waiter is deleted.';
