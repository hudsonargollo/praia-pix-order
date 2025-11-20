-- Clear All Orders Script (Safe Version - Auto Commit)
-- WARNING: This will delete ALL orders and related data
-- This version commits automatically

-- Delete related data first (to avoid foreign key constraints)

-- 1. Delete WhatsApp chat messages
DELETE FROM whatsapp_chat_messages;

-- 2. Delete WhatsApp notifications  
DELETE FROM whatsapp_notifications;

-- 3. Delete payment webhooks
DELETE FROM payment_webhooks;

-- 4. Delete order audit logs (if exists)
DELETE FROM order_audit_log;

-- 5. Delete order items
DELETE FROM order_items;

-- 6. Finally, delete all orders
DELETE FROM orders;

-- Display confirmation
SELECT 
  '✅ All orders and related data have been deleted' as status,
  NOW() as deleted_at;

-- Verify deletion
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
  'payment_webhooks' as table_name,
  COUNT(*) as remaining_count 
FROM payment_webhooks;

