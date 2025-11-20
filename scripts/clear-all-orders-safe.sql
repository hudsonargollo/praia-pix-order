-- Clear All Orders Script (Safe Version - Auto Commit)
-- WARNING: This will delete ALL orders and related data
-- This version commits automatically

-- Delete related data first (to avoid foreign key constraints)
-- Order matters: delete child tables before parent tables

-- 1. Delete WhatsApp error logs (references orders and notifications)
DELETE FROM whatsapp_error_logs WHERE order_id IS NOT NULL;

-- 2. Delete WhatsApp chat messages
DELETE FROM whatsapp_chat_messages;

-- 3. Delete WhatsApp notifications  
DELETE FROM whatsapp_notifications;

-- 4. Delete payment webhooks
DELETE FROM payment_webhooks;

-- 5. Delete payment confirmation logs
DELETE FROM payment_confirmation_log;

-- 6. Delete order audit logs
DELETE FROM order_audit_log;

-- 7. Delete order items
DELETE FROM order_items;

-- 8. Finally, delete all orders
DELETE FROM orders;

-- Display confirmation
SELECT 
  '✅ All orders and related data have been deleted' as status,
  NOW() as deleted_at;

-- Verify deletion (all should show 0)
SELECT 
  'orders' as table_name,
  COUNT(*) as remaining_count 
FROM orders
UNION ALL
SELECT 
  'order_items' as table_name,
  COUNT(*) as remaining_count 
FROM order_items
UNION ALL
SELECT 
  'order_audit_log' as table_name,
  COUNT(*) as remaining_count 
FROM order_audit_log
UNION ALL
SELECT 
  'payment_confirmation_log' as table_name,
  COUNT(*) as remaining_count 
FROM payment_confirmation_log
UNION ALL
SELECT 
  'whatsapp_notifications' as table_name,
  COUNT(*) as remaining_count 
FROM whatsapp_notifications
UNION ALL
SELECT 
  'whatsapp_chat_messages' as table_name,
  COUNT(*) as remaining_count 
FROM whatsapp_chat_messages
UNION ALL
SELECT 
  'whatsapp_error_logs (with order_id)' as table_name,
  COUNT(*) as remaining_count 
FROM whatsapp_error_logs
WHERE order_id IS NOT NULL
UNION ALL
SELECT 
  'payment_webhooks' as table_name,
  COUNT(*) as remaining_count 
FROM payment_webhooks;

