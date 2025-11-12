-- ============================================
-- WhatsApp Sessions Table Setup
-- ============================================
-- This table stores WhatsApp session data for Baileys
-- Run this in Supabase SQL Editor

-- Create the sessions table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  session_id TEXT PRIMARY KEY,
  session_data JSONB NOT NULL,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_updated 
ON whatsapp_sessions(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can manage sessions" 
ON whatsapp_sessions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_whatsapp_sessions_timestamp ON whatsapp_sessions;
CREATE TRIGGER update_whatsapp_sessions_timestamp
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_session_timestamp();

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone 
ON whatsapp_sessions(phone_number) WHERE is_active = true;

-- Create index for active sessions
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_active 
ON whatsapp_sessions(is_active, updated_at DESC);

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'whatsapp_sessions'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'WhatsApp sessions table created successfully!';
  RAISE NOTICE 'You can now connect WhatsApp from the /whatsapp-admin page';
END $$;
