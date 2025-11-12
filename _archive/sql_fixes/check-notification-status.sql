-- Quick Diagnostic Queries for WhatsApp Notifications
-- Run these in Supabase SQL Editor to check system status

-- 1. Check recent orders and their status
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.customer_phone,
  o.status,
  o.payment_confirmed_at,
  o.created_at,
  CASE 
    WHEN o.payment_confirmed_at IS NOT NULL THEN '✅ Paid'
    WHEN o.status = 'pending_payment' THEN '⏳ Waiting'
    ELSE '❌ ' || o.status
  END as payment_status
FROM orders o
ORDER BY o.created_at DESC
LIMIT 10;

-- 2. Check recent WhatsApp notifications
SELECT 
  wn.id,
  wn.order_id,
  o.order_number,
  wn.notification_type,
  wn.status,
  wn.attempts,
  wn.error_message,
  wn.created_at,
  wn.sent_at,
  CASE 
    WHEN wn.status = 'sent' THEN '✅ Sent'
    WHEN wn.status = 'pending' THEN '⏳ Pending'
    WHEN wn.status = 'failed' THEN '❌ Failed'
    ELSE '❓ ' || wn.status
  END as notification_status,
  CASE 
    WHEN wn.sent_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (wn.sent_at - wn.created_at)) || ' seconds'
    ELSE 'Not sent'
  END as delivery_time
FROM whatsapp_notifications wn
LEFT JOIN orders o ON o.id = wn.order_id
ORDER BY wn.created_at DESC
LIMIT 10;

-- 3. Check notification queue status
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM whatsapp_notifications
GROUP BY status
ORDER BY count DESC;

-- 4. Check failed notifications with details
SELECT 
  wn.id,
  o.order_number,
  wn.notification_type,
  wn.attempts,
  wn.error_message,
  wn.created_at
FROM whatsapp_notifications wn
LEFT JOIN orders o ON o.id = wn.order_id
WHERE wn.status = 'failed'
ORDER BY wn.created_at DESC
LIMIT 10;

-- 5. Check pending notifications (should be processed quickly)
SELECT 
  wn.id,
  o.order_number,
  wn.notification_type,
  wn.attempts,
  wn.created_at,
  NOW() - wn.created_at as age
FROM whatsapp_notifications wn
LEFT JOIN orders o ON o.id = wn.order_id
WHERE wn.status = 'pending'
ORDER BY wn.created_at ASC;

-- 6. Check delivery rate (last 24 hours)
SELECT 
  COUNT(*) as total_notifications,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as delivery_rate_percent
FROM whatsapp_notifications
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 7. Check average delivery time (last 24 hours)
SELECT 
  AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_delivery_seconds,
  MIN(EXTRACT(EPOCH FROM (sent_at - created_at))) as min_delivery_seconds,
  MAX(EXTRACT(EPOCH FROM (sent_at - created_at))) as max_delivery_seconds
FROM whatsapp_notifications
WHERE status = 'sent' 
  AND created_at > NOW() - INTERVAL '24 hours'
  AND sent_at IS NOT NULL;

-- 8. Check orders without notifications (potential issue)
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.status,
  o.payment_confirmed_at,
  o.created_at
FROM orders o
LEFT JOIN whatsapp_notifications wn ON wn.order_id = o.id
WHERE o.status IN ('in_preparation', 'ready', 'completed')
  AND wn.id IS NULL
  AND o.created_at > NOW() - INTERVAL '24 hours'
ORDER BY o.created_at DESC;

-- 9. Check notification types distribution
SELECT 
  notification_type,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM whatsapp_notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type
ORDER BY count DESC;

-- 10. Check for stuck notifications (pending > 5 minutes)
SELECT 
  wn.id,
  o.order_number,
  wn.notification_type,
  wn.attempts,
  wn.created_at,
  NOW() - wn.created_at as stuck_for
FROM whatsapp_notifications wn
LEFT JOIN orders o ON o.id = wn.order_id
WHERE wn.status = 'pending'
  AND wn.created_at < NOW() - INTERVAL '5 minutes'
ORDER BY wn.created_at ASC;
