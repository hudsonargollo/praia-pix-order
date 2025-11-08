-- Update WhatsApp notifications table to match design requirements for queue management
-- Add missing columns for queue management and retry logic

-- Add new columns for queue management
ALTER TABLE whatsapp_notifications 
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS notification_type TEXT,
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update existing columns to match design
ALTER TABLE whatsapp_notifications 
ALTER COLUMN phone SET NOT NULL,
ALTER COLUMN message_type DROP NOT NULL;

-- Update phone column name for consistency (if needed)
UPDATE whatsapp_notifications SET customer_phone = phone WHERE customer_phone IS NULL;

-- Update notification_type from message_type for consistency
UPDATE whatsapp_notifications SET notification_type = message_type WHERE notification_type IS NULL;

-- Update status check constraint to include new statuses
ALTER TABLE whatsapp_notifications DROP CONSTRAINT IF EXISTS whatsapp_notifications_status_check;
ALTER TABLE whatsapp_notifications 
ADD CONSTRAINT whatsapp_notifications_status_check 
CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));

-- Update message_type check constraint for notification_type
ALTER TABLE whatsapp_notifications DROP CONSTRAINT IF EXISTS whatsapp_notifications_message_type_check;
ALTER TABLE whatsapp_notifications 
ADD CONSTRAINT whatsapp_notifications_notification_type_check 
CHECK (notification_type IN ('payment_confirmed', 'preparing', 'ready', 'custom', 'confirmation', 'status_update'));

-- Add new indexes for queue management
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_phone ON whatsapp_notifications(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_notification_type ON whatsapp_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_attempts ON whatsapp_notifications(attempts);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_scheduled_at ON whatsapp_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status_scheduled ON whatsapp_notifications(status, scheduled_at);

-- Add foreign key constraint for order_id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'whatsapp_notifications_order_id_fkey'
    ) THEN
        ALTER TABLE whatsapp_notifications 
        ADD CONSTRAINT whatsapp_notifications_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update table comment
COMMENT ON TABLE whatsapp_notifications IS 'Queue and tracking system for WhatsApp message delivery with retry logic';
COMMENT ON COLUMN whatsapp_notifications.customer_phone IS 'Customer phone number in international format (+55XXXXXXXXXXX)';
COMMENT ON COLUMN whatsapp_notifications.notification_type IS 'Type of notification: payment_confirmed, preparing, ready, custom';
COMMENT ON COLUMN whatsapp_notifications.attempts IS 'Number of delivery attempts made';
COMMENT ON COLUMN whatsapp_notifications.scheduled_at IS 'When the notification should be sent';
COMMENT ON COLUMN whatsapp_notifications.error_message IS 'Error details if delivery failed';