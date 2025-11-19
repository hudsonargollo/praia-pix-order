-- ============================================
-- CLEAR ALL ORDERS - QUICK VERSION
-- ============================================
-- Copy and paste this into Supabase SQL Editor
-- or run: supabase db execute -f CLEAR_ORDERS.sql

BEGIN;

-- Delete order items first (foreign key constraint)
DELETE FROM order_items;
RAISE NOTICE 'Deleted % order items', (SELECT COUNT(*) FROM order_items);

-- Delete all orders
DELETE FROM orders;
RAISE NOTICE 'Deleted % orders', (SELECT COUNT(*) FROM orders);

-- Verify
SELECT 
    (SELECT COUNT(*) FROM orders) as remaining_orders,
    (SELECT COUNT(*) FROM order_items) as remaining_items;

COMMIT;

-- ============================================
-- Done! All orders cleared.
-- ============================================
