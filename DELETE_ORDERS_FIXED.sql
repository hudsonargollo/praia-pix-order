-- Delete all orders and related data
-- This handles all foreign key constraints properly

-- Step 1: Delete order audit logs (if they exist)
DELETE FROM order_audit_log;

-- Step 2: Delete order items
DELETE FROM order_items;

-- Step 3: Delete orders
DELETE FROM orders;

-- Verify deletion
SELECT 
    'Deletion complete' as status,
    (SELECT COUNT(*) FROM orders) as remaining_orders,
    (SELECT COUNT(*) FROM order_items) as remaining_items,
    (SELECT COUNT(*) FROM order_audit_log) as remaining_audit_logs;
