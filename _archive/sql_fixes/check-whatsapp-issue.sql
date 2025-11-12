-- Check recent orders and their phone numbers
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Check WhatsApp notification attempts
SELECT 
  id,
  order_id,
  customer_phone,
  notification_type,
  status,
  attempts,
  error_message,
  created_at
FROM whatsapp_notifications
ORDER BY created_at DESC
LIMIT 10;
