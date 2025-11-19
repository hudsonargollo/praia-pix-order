-- Clear all orders and order items
-- This migration will delete all existing orders from the database

-- Delete order items first (foreign key constraint)
DELETE FROM order_items;

-- Delete all orders
DELETE FROM orders;

-- Log the action
DO $$
BEGIN
  RAISE NOTICE 'All orders and order items have been deleted';
END $$;
