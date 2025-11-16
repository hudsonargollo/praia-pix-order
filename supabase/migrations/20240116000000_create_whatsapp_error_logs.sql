-- Create WhatsApp error logs table
CREATE TABLE IF NOT EXISTS whatsapp_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_phone TEXT,
  notification_id UUID,
  is_retryable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create WhatsApp alerts table
CREATE TABLE IF NOT EXISTS whatsapp_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_order_id ON whatsapp_error_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_created_at ON whatsapp_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_category ON whatsapp_error_logs(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_severity ON whatsapp_error_logs(severity);

-- Enable RLS
ALTER TABLE whatsapp_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (staff/admin)
CREATE POLICY "Allow authenticated users to read error logs"
  ON whatsapp_error_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read alerts"
  ON whatsapp_alerts FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert logs
CREATE POLICY "Allow service role to insert error logs"
  ON whatsapp_error_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to insert alerts"
  ON whatsapp_alerts FOR INSERT
  TO service_role
  WITH CHECK (true);
