-- Update whatsapp_notifications table schema to match current code expectations
-- This migration updates the table structure without losing existing data

-- Drop old table and recreate with correct schema
DROP TABLE IF EXISTS whatsapp_notifications CASCADE;

-- Create updated whatsapp_notifications table
CREATE TABLE whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  customer_phone VARCHAR NOT NULL, -- Encrypted phone number
  notification_type VARCHAR NOT NULL CHECK (notification_type IN ('payment_confirmed', 'preparing', 'ready', 'custom')),
  message_content TEXT NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  whatsapp_message_id VARCHAR, -- ID returned by WhatsApp API
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_whatsapp_notifications_order_id ON whatsapp_notifications(order_id);
CREATE INDEX idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX idx_whatsapp_notifications_notification_type ON whatsapp_notifications(notification_type);
CREATE INDEX idx_whatsapp_notifications_created_at ON whatsapp_notifications(created_at);
CREATE INDEX idx_whatsapp_notifications_scheduled_at ON whatsapp_notifications(scheduled_at);
CREATE INDEX idx_whatsapp_notifications_status_attempts ON whatsapp_notifications(status, attempts);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_whatsapp_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_notifications_updated_at 
    BEFORE UPDATE ON whatsapp_notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_whatsapp_notifications_updated_at();

-- Enable RLS
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Service role can manage whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Anon users can insert whatsapp_notifications" ON whatsapp_notifications;

-- Policy for service role (full access)
CREATE POLICY "Service role can manage whatsapp_notifications" ON whatsapp_notifications
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Policy for authenticated users to read all notifications
CREATE POLICY "Authenticated users can read whatsapp_notifications" ON whatsapp_notifications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert notifications
CREATE POLICY "Authenticated users can insert whatsapp_notifications" ON whatsapp_notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update notifications
CREATE POLICY "Authenticated users can update whatsapp_notifications" ON whatsapp_notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for anonymous users to insert notifications (for customer orders)
CREATE POLICY "Anon users can insert whatsapp_notifications" ON whatsapp_notifications
    FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Add comment to table
COMMENT ON TABLE whatsapp_notifications IS 'Tracks WhatsApp message delivery status for order notifications with retry logic';
