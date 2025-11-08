-- Create WhatsApp sessions table for storing Baileys session data
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  session_data JSONB NOT NULL,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_whatsapp_sessions_session_id ON whatsapp_sessions(session_id);
CREATE INDEX idx_whatsapp_sessions_phone_number ON whatsapp_sessions(phone_number);
CREATE INDEX idx_whatsapp_sessions_is_active ON whatsapp_sessions(is_active);
CREATE INDEX idx_whatsapp_sessions_created_at ON whatsapp_sessions(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_whatsapp_sessions_updated_at 
    BEFORE UPDATE ON whatsapp_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage sessions (Baileys service needs full access)
CREATE POLICY "Service role can manage whatsapp_sessions" ON whatsapp_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy for authenticated users to read active sessions (for admin dashboard)
CREATE POLICY "Authenticated users can read active whatsapp_sessions" ON whatsapp_sessions
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Add comment to table
COMMENT ON TABLE whatsapp_sessions IS 'Stores encrypted Baileys WhatsApp session data for connection persistence';
COMMENT ON COLUMN whatsapp_sessions.session_data IS 'Encrypted JSONB containing Baileys session state';
COMMENT ON COLUMN whatsapp_sessions.phone_number IS 'WhatsApp phone number associated with this session';