-- Create enums for message direction and status
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- Create whatsapp_chat_messages table
CREATE TABLE whatsapp_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  direction message_direction NOT NULL,
  content TEXT NOT NULL,
  status message_status DEFAULT 'sent',
  evolution_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_chat_phone ON whatsapp_chat_messages(phone_number);
CREATE INDEX idx_chat_order ON whatsapp_chat_messages(order_id);
CREATE INDEX idx_chat_created_at ON whatsapp_chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated staff users can read all chat messages
CREATE POLICY "Staff can read all chat messages"
  ON whatsapp_chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated staff users can insert outbound messages
CREATE POLICY "Staff can insert outbound messages"
  ON whatsapp_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (direction = 'outbound');

-- Policy: Service role has full access for backend operations
CREATE POLICY "Service role has full access"
  ON whatsapp_chat_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Anonymous role can insert inbound messages (for webhook)
CREATE POLICY "Webhook can insert inbound messages"
  ON whatsapp_chat_messages
  FOR INSERT
  TO anon
  WITH CHECK (direction = 'inbound');

-- Add comment to table
COMMENT ON TABLE whatsapp_chat_messages IS 'Stores two-way chat messages between staff and customers via WhatsApp';
COMMENT ON COLUMN whatsapp_chat_messages.order_id IS 'Associated order ID, can be null if message cannot be linked';
COMMENT ON COLUMN whatsapp_chat_messages.phone_number IS 'Customer phone number in normalized format (digits only)';
COMMENT ON COLUMN whatsapp_chat_messages.direction IS 'Message direction: inbound (customer to staff) or outbound (staff to customer)';
COMMENT ON COLUMN whatsapp_chat_messages.content IS 'Message text content';
COMMENT ON COLUMN whatsapp_chat_messages.status IS 'Message delivery status';
COMMENT ON COLUMN whatsapp_chat_messages.evolution_id IS 'Evolution API message ID for tracking';
