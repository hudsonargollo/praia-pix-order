-- Create whatsapp_opt_outs table for tracking customers who don't want notifications
CREATE TABLE IF NOT EXISTS whatsapp_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_opt_outs_phone ON whatsapp_opt_outs(phone_number);

-- Enable RLS
ALTER TABLE whatsapp_opt_outs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read opt-outs
CREATE POLICY "Allow authenticated users to read opt-outs"
  ON whatsapp_opt_outs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert opt-outs
CREATE POLICY "Allow authenticated users to insert opt-outs"
  ON whatsapp_opt_outs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to opt-outs"
  ON whatsapp_opt_outs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
