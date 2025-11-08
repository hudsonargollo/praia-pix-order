-- Create WhatsApp opt-out table for customer preferences
-- Allows customers to opt-out of WhatsApp notifications

CREATE TABLE whatsapp_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_whatsapp_opt_outs_customer_phone ON whatsapp_opt_outs(customer_phone);
CREATE INDEX idx_whatsapp_opt_outs_opted_out_at ON whatsapp_opt_outs(opted_out_at);

-- Create updated_at trigger
CREATE TRIGGER update_whatsapp_opt_outs_updated_at 
    BEFORE UPDATE ON whatsapp_opt_outs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE whatsapp_opt_outs ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage opt-outs
CREATE POLICY "Service role can manage whatsapp_opt_outs" ON whatsapp_opt_outs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy for authenticated users to read opt-outs (for admin dashboard)
CREATE POLICY "Authenticated users can read whatsapp_opt_outs" ON whatsapp_opt_outs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE whatsapp_opt_outs IS 'Tracks customers who have opted out of WhatsApp notifications';
COMMENT ON COLUMN whatsapp_opt_outs.customer_phone IS 'Encrypted customer phone number in international format';
COMMENT ON COLUMN whatsapp_opt_outs.reason IS 'Optional reason for opting out';
