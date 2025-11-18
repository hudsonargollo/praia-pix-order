-- Drop existing tables if they exist (to recreate with correct schema)
DROP TABLE IF EXISTS whatsapp_error_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_alerts CASCADE;

-- Create whatsapp_error_logs table for tracking WhatsApp notification errors
CREATE TABLE whatsapp_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_phone TEXT,
  notification_id UUID REFERENCES whatsapp_notifications(id) ON DELETE SET NULL,
  is_retryable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_whatsapp_error_logs_order_id ON whatsapp_error_logs(order_id);
CREATE INDEX idx_whatsapp_error_logs_created_at ON whatsapp_error_logs(created_at DESC);
CREATE INDEX idx_whatsapp_error_logs_category ON whatsapp_error_logs(category);
CREATE INDEX idx_whatsapp_error_logs_severity ON whatsapp_error_logs(severity);

-- Create whatsapp_alerts table for tracking alert thresholds
CREATE TABLE whatsapp_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_whatsapp_alerts_created_at ON whatsapp_alerts(created_at DESC);
CREATE INDEX idx_whatsapp_alerts_category ON whatsapp_alerts(category);

-- Add RLS policies
ALTER TABLE whatsapp_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_alerts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read error logs
CREATE POLICY "Allow authenticated users to read error logs"
  ON whatsapp_error_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert error logs
CREATE POLICY "Allow service role to insert error logs"
  ON whatsapp_error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read alerts
CREATE POLICY "Allow authenticated users to read alerts"
  ON whatsapp_alerts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert alerts
CREATE POLICY "Allow service role to insert alerts"
  ON whatsapp_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
