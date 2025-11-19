-- ============================================
-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- ============================================
-- Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql/new
-- Paste this entire content and click "Run"

-- Delete order items first (foreign key constraint)
DELETE FROM order_items;

-- Delete all orders
DELETE FROM orders;

-- Show results
SELECT 
    'Orders deleted' as status,
    (SELECT COUNT(*) FROM orders) as remaining_orders,
    (SELECT COUNT(*) FROM order_items) as remaining_items;
