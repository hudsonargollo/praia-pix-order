-- Payment Notifications and Printing - Database Verification Queries
-- Run these queries to verify the complete flow is working correctly

-- ============================================================================
-- 1. Check Recent Payment Confirmations
-- ============================================================================
-- Shows all payment confirmations in the last hour with their notification status
SELECT 
  pcl.id,
  pcl.order_id,
  o.order_number,
  o.customer_name,
  pcl.source,
  pcl.payment_method,
  pcl.notification_sent,
  pcl.notification_error,
  pcl.created_at,
  o.status as order_status,
  o.payment_status,
  o.payment_confirmed_at
FROM payment_confirmation_log pcl
JOIN orders o ON o.id = pcl.order_id
WHERE pcl.created_at > NOW() - INTERVAL '1 hour'
ORDER BY pcl.created_at DESC;

-- ============================================================================
-- 2. Check WhatsApp Notifications for Recent Orders
-- ============================================================================
-- Shows all WhatsApp notifications sent for recently confirmed payments
SELECT 
  wn.id,
  wn.order_id,
  o.order_number,
  o.customer_name,
  wn.notification_type,
  wn.status,
  wn.sent_at,
  wn.dedupe_key,
  wn.created_at,
  wn.attempts,
  wn.error_message
FROM whatsapp_notifications wn
JOIN orders o ON o.id = wn.order_id
WHERE wn.notification_type IN ('payment_confirmed', 'order_created')
AND wn.created_at > NOW() - INTERVAL '1 hour'
ORDER BY wn.created_at DESC;

-- ============================================================================
-- 3. Check for Duplicate Notifications (Should be EMPTY)
-- ============================================================================
-- This query should return NO results if deduplication is working correctly
SELECT 
  order_id,
  COUNT(*) as notification_count,
  STRING_AGG(id::text, ', ') as notification_ids,
  STRING_AGG(notification_type, ', ') as types,
  STRING_AGG(status, ', ') as statuses
FROM whatsapp_notifications
WHERE notification_type IN ('payment_confirmed', 'order_created')
AND status = 'sent'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY order_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- 4. Check Specific Order Payment Flow
-- ============================================================================
-- Replace <order_id> with the actual order ID you want to check
-- This shows the complete payment confirmation flow for a specific order

-- Order details
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status,
  payment_status,
  payment_method,
  payment_confirmed_at,
  created_at,
  total_amount
FROM orders
WHERE id = '<order_id>';

-- Payment confirmation log
SELECT 
  id,
  source,
  payment_method,
  payment_id,
  notification_sent,
  notification_error,
  created_at
FROM payment_confirmation_log
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;

-- WhatsApp notifications
SELECT 
  id,
  notification_type,
  status,
  sent_at,
  dedupe_key,
  attempts,
  error_message,
  created_at
FROM whatsapp_notifications
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;

-- WhatsApp errors (if any)
SELECT 
  id,
  error_type,
  error_message,
  operation,
  created_at
FROM whatsapp_error_logs
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;

-- ============================================================================
-- 5. Check Deduplication Effectiveness
-- ============================================================================
-- Shows orders with multiple confirmation attempts (deduplication working)
SELECT 
  pcl.order_id,
  o.order_number,
  COUNT(*) as confirmation_attempts,
  SUM(CASE WHEN pcl.notification_sent THEN 1 ELSE 0 END) as notifications_sent,
  STRING_AGG(pcl.source, ', ' ORDER BY pcl.created_at) as sources,
  MIN(pcl.created_at) as first_attempt,
  MAX(pcl.created_at) as last_attempt
FROM payment_confirmation_log pcl
JOIN orders o ON o.id = pcl.order_id
WHERE pcl.created_at > NOW() - INTERVAL '1 hour'
GROUP BY pcl.order_id, o.order_number
HAVING COUNT(*) > 1
ORDER BY last_attempt DESC;

-- ============================================================================
-- 6. Check Orders in Preparation (for Auto-Print Testing)
-- ============================================================================
-- Shows all orders currently in preparation that should trigger auto-print
SELECT 
  id,
  order_number,
  customer_name,
  status,
  payment_status,
  payment_confirmed_at,
  created_at,
  total_amount,
  EXTRACT(EPOCH FROM (NOW() - payment_confirmed_at))/60 as minutes_since_payment
FROM orders
WHERE status = 'in_preparation'
AND payment_confirmed_at IS NOT NULL
ORDER BY payment_confirmed_at DESC
LIMIT 20;

-- ============================================================================
-- 7. Check Notification Success Rate
-- ============================================================================
-- Shows overall notification success rate for the last hour
SELECT 
  notification_type,
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY notification_type), 2) as percentage
FROM whatsapp_notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY notification_type, status
ORDER BY notification_type, status;

-- ============================================================================
-- 8. Check Payment Confirmation Success Rate
-- ============================================================================
-- Shows overall payment confirmation success rate
SELECT 
  source,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN notification_sent THEN 1 ELSE 0 END) as successful_notifications,
  SUM(CASE WHEN notification_error IS NOT NULL THEN 1 ELSE 0 END) as failed_notifications,
  ROUND(SUM(CASE WHEN notification_sent THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM payment_confirmation_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY source
ORDER BY source;

-- ============================================================================
-- 9. Check for Orphaned Notifications (Should be EMPTY)
-- ============================================================================
-- Notifications without corresponding payment confirmation log entries
SELECT 
  wn.id,
  wn.order_id,
  o.order_number,
  wn.notification_type,
  wn.status,
  wn.created_at
FROM whatsapp_notifications wn
JOIN orders o ON o.id = wn.order_id
LEFT JOIN payment_confirmation_log pcl ON pcl.order_id = wn.order_id
WHERE wn.notification_type IN ('payment_confirmed', 'order_created')
AND wn.created_at > NOW() - INTERVAL '1 hour'
AND pcl.id IS NULL;

-- ============================================================================
-- 10. Check Recent Errors
-- ============================================================================
-- Shows all recent errors in the WhatsApp notification system
SELECT 
  wel.id,
  wel.error_type,
  wel.error_message,
  wel.operation,
  wel.order_id,
  o.order_number,
  wel.customer_phone,
  wel.created_at
FROM whatsapp_error_logs wel
LEFT JOIN orders o ON o.id = wel.order_id
WHERE wel.created_at > NOW() - INTERVAL '1 hour'
ORDER BY wel.created_at DESC;

-- ============================================================================
-- QUICK HEALTH CHECK
-- ============================================================================
-- Run this to get a quick overview of the system health

SELECT 
  'Payment Confirmations (Last Hour)' as metric,
  COUNT(*)::text as value
FROM payment_confirmation_log
WHERE created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'WhatsApp Notifications Sent (Last Hour)',
  COUNT(*)::text
FROM whatsapp_notifications
WHERE status = 'sent'
AND created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'Duplicate Notifications (Last Hour)',
  COUNT(*)::text
FROM (
  SELECT order_id
  FROM whatsapp_notifications
  WHERE notification_type IN ('payment_confirmed', 'order_created')
  AND status = 'sent'
  AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY order_id
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 
  'Orders in Preparation',
  COUNT(*)::text
FROM orders
WHERE status = 'in_preparation'

UNION ALL

SELECT 
  'Recent Errors (Last Hour)',
  COUNT(*)::text
FROM whatsapp_error_logs
WHERE created_at > NOW() - INTERVAL '1 hour';
