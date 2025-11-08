-- Create whatsapp_error_logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS whatsapp_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  order_id UUID REFERENCES orders(id),
  customer_phone TEXT,
  notification_id UUID REFERENCES whatsapp_notifications(id),
  is_retryable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_whatsapp_error_logs_created_at ON whatsapp_error_logs(created_at DESC);
CREATE INDEX idx_whatsapp_error_logs_category ON whatsapp_error_logs(category);
CREATE INDEX idx_whatsapp_error_logs_severity ON whatsapp_error_logs(severity);
CREATE INDEX idx_whatsapp_error_logs_order_id ON whatsapp_error_logs(order_id);

-- Create whatsapp_alerts table for alert tracking
CREATE TABLE IF NOT EXISTS whatsapp_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_whatsapp_alerts_created_at ON whatsapp_alerts(created_at DESC);
CREATE INDEX idx_whatsapp_alerts_is_resolved ON whatsapp_alerts(is_resolved);
CREATE INDEX idx_whatsapp_alerts_category ON whatsapp_alerts(category);

-- Add RLS policies for error logs (admin only)
ALTER TABLE whatsapp_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read error logs"
  ON whatsapp_error_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to insert error logs"
  ON whatsapp_error_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add RLS policies for alerts (admin only)
ALTER TABLE whatsapp_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read alerts"
  ON whatsapp_alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update alerts"
  ON whatsapp_alerts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to insert alerts"
  ON whatsapp_alerts
  FOR INSERT
  TO service_role
  WITH CHECK (true);
