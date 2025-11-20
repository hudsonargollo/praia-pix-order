-- Clear All Orders Script
-- WARNING: This will delete ALL orders and related data
-- Use with caution - this action cannot be undone!

-- Start transaction for safety
BEGIN;

-- Display count before deletion
SELECT 
  'Orders to delete:' as info,
  COUNT(*) as count 
FROM orders;

-- Delete related data first (to avoid foreign key constraints)

-- 1. Delete WhatsApp chat messages
DELETE FROM whatsapp_chat_messages;
SELECT 'Deleted WhatsApp chat messages' as status;

-- 2. Delete WhatsApp notifications
DELETE FROM whatsapp_notifications;
SELECT 'Deleted WhatsApp notifications' as status;

-- 3. Delete payment webhooks
DELETE FROM payment_webhooks;
SELECT 'Deleted payment webhooks' as status;

-- 4. Delete order audit logs
DELETE FROM order_audit_log;
SELECT 'Deleted order audit logs' as status;

-- 5. Delete order items
DELETE FROM order_items;
SELECT 'Deleted order items' as status;

-- 6. Finally, delete all orders
DELETE FROM orders;
SELECT 'Deleted all orders' as status;

-- Display final counts
SELECT 
  'Remaining orders:' as info,
  COUNT(*) as count 
FROM orders;

SELECT 
  'Remaining order items:' as info,
  COUNT(*) as count 
FROM order_items;

SELECT 
  'Remaining WhatsApp notifications:' as info,
  COUNT(*) as count 
FROM whatsapp_notifications;

SELECT 
  'Remaining WhatsApp chat messages:' as info,
  COUNT(*) as count 
FROM whatsapp_chat_messages;

SELECT 
  'Remaining order audit logs:' as info,
  COUNT(*) as count 
FROM order_audit_log;

-- Commit the transaction
-- IMPORTANT: Review the output above before committing!
-- If everything looks correct, run: COMMIT;
-- If you want to cancel, run: ROLLBACK;

-- Uncomment the line below to auto-commit (use with caution!)
-- COMMIT;

-- For safety, we leave it uncommitted so you can review first
SELECT '⚠️  Transaction is open. Review the results above.' as warning;
SELECT '✅ If correct, run: COMMIT;' as next_step;
SELECT '❌ To cancel, run: ROLLBACK;' as cancel_option;

