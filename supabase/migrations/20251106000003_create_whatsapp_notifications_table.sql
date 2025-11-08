-- Create WhatsApp notifications table for tracking message delivery
CREATE TABLE whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  phone VARCHAR NOT NULL,
  message_type VARCHAR NOT NULL CHECK (message_type IN ('confirmation', 'ready', 'status_update', 'custom')),
  message_content TEXT,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  whatsapp_message_id VARCHAR, -- ID returned by WhatsApp API
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_whatsapp_notifications_order_id ON whatsapp_notifications(order_id);
CREATE INDEX idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX idx_whatsapp_notifications_message_type ON whatsapp_notifications(message_type);
CREATE INDEX idx_whatsapp_notifications_created_at ON whatsapp_notifications(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_notifications_updated_at 
    BEFORE UPDATE ON whatsapp_notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all notifications
CREATE POLICY "Authenticated users can read whatsapp_notifications" ON whatsapp_notifications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert notifications
CREATE POLICY "Authenticated users can insert whatsapp_notifications" ON whatsapp_notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update notifications
CREATE POLICY "Authenticated users can update whatsapp_notifications" ON whatsapp_notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE whatsapp_notifications IS 'Tracks WhatsApp message delivery status for order notifications';