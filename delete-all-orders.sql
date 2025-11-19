-- ============================================
-- DELETE ALL ORDERS AND RELATED DATA
-- ============================================
-- WARNING: This will permanently delete all orders!
-- Make sure you want to do this before running.

-- Step 1: Delete all order items first (due to foreign key constraints)
DELETE FROM order_items;

-- Step 2: Delete all orders
DELETE FROM orders;

-- Step 3: Reset the order number sequence (optional - starts numbering from 1 again)
-- This assumes you have a sequence for order_number
-- ALTER SEQUENCE orders_order_number_seq RESTART WITH 1;

-- Step 4: Verify deletion
SELECT COUNT(*) as remaining_orders FROM orders;
SELECT COUNT(*) as remaining_order_items FROM order_items;

-- ============================================
-- RESULT: All orders and order items deleted
-- ============================================
