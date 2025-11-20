-- Clear All Orders Script (Force Version)
-- WARNING: This will delete ALL orders and related data
-- This version disables triggers temporarily to force deletion

-- Temporarily disable triggers to avoid audit log issues
SET session_replication_role = 'replica';

-- Delete in proper order to avoid foreign key constraints

-- 1. Delete WhatsApp error logs (references orders)
DELETE FROM whatsapp_error_logs WHERE order_id IS NOT NULL;

-- 2. Delete WhatsApp chat messages
DELETE FROM whatsapp_chat_messages;

-- 3. Delete WhatsApp notifications  
DELETE FROM whatsapp_notifications;

-- 4. Delete payment webhooks
DELETE FROM payment_webhooks;

-- 5. Delete payment confirmation logs (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_confirmation_log') THEN
    DELETE FROM payment_confirmation_log;
  END IF;
END $$;

-- 6. Delete order audit logs
DELETE FROM order_audit_log;

-- 7. Delete order items
DELETE FROM order_items;

-- 8. Finally, delete all orders
DELETE FROM orders;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Confirmation
SELECT '✅ All orders and related data deleted' as status, NOW() as deleted_at;

-- Verify (all should show 0)
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'order_audit_log', COUNT(*) FROM order_audit_log
UNION ALL SELECT 'whatsapp_notifications', COUNT(*) FROM whatsapp_notifications
UNION ALL SELECT 'whatsapp_chat_messages', COUNT(*) FROM whatsapp_chat_messages
UNION ALL SELECT 'whatsapp_error_logs (orders)', COUNT(*) FROM whatsapp_error_logs WHERE order_id IS NOT NULL
UNION ALL SELECT 'payment_webhooks', COUNT(*) FROM payment_webhooks;

