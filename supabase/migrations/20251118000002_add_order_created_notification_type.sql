-- Add 'order_created' to the allowed notification types
ALTER TABLE whatsapp_notifications 
DROP CONSTRAINT IF EXISTS whatsapp_notifications_notification_type_check;

ALTER TABLE whatsapp_notifications 
ADD CONSTRAINT whatsapp_notifications_notification_type_check 
CHECK (notification_type IN ('order_created', 'payment_confirmed', 'preparing', 'ready', 'custom', 'confirmation', 'status_update'));
