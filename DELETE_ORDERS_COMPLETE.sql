-- Complete order deletion with all constraints handled
-- Run this as a superuser or with proper permissions

BEGIN;

-- Temporarily disable triggers
SET session_replication_role = replica;

-- Delete from all related tables
DELETE FROM order_audit_log;
DELETE FROM whatsapp_notifications WHERE order_id IN (SELECT id FROM orders);
DELETE FROM payment_webhooks WHERE order_id IN (SELECT id FROM orders);
DELETE FROM order_items;
DELETE FROM orders;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;

-- Verify deletion
SELECT 
    'Deletion complete' as status,
    (SELECT COUNT(*) FROM orders) as remaining_orders,
    (SELECT COUNT(*) FROM order_items) as remaining_items,
    (SELECT COUNT(*) FROM order_audit_log) as remaining_audit_logs;
