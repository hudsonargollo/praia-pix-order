-- Complete fix for WhatsApp notifications
-- Run this in Supabase SQL Editor to fix all issues

-- 1. Add 'order_created' to the allowed notification types
ALTER TABLE whatsapp_notifications 
DROP CONSTRAINT IF EXISTS whatsapp_notifications_notification_type_check;

ALTER TABLE whatsapp_notifications 
ADD CONSTRAINT whatsapp_notifications_notification_type_check 
CHECK (notification_type IN ('order_created', 'payment_confirmed', 'preparing', 'ready', 'custom', 'confirmation', 'status_update'));

-- 2. Create whatsapp_opt_outs table if it doesn't exist
CREATE TABLE IF NOT EXISTS whatsapp_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_opt_outs_phone ON whatsapp_opt_outs(phone_number);

-- Enable RLS on opt_outs
ALTER TABLE whatsapp_opt_outs ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read opt-outs" ON whatsapp_opt_outs;
DROP POLICY IF EXISTS "Allow authenticated users to insert opt-outs" ON whatsapp_opt_outs;
DROP POLICY IF EXISTS "Allow service role full access to opt-outs" ON whatsapp_opt_outs;
DROP POLICY IF EXISTS "Allow anon users to insert opt-outs" ON whatsapp_opt_outs;

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

-- Allow anonymous users to insert opt-outs (for customer opt-out)
CREATE POLICY "Allow anon users to insert opt-outs"
  ON whatsapp_opt_outs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to opt-outs"
  ON whatsapp_opt_outs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Ensure RLS policies on whatsapp_notifications allow anon inserts
-- Drop and recreate the anon insert policy to ensure it works
DROP POLICY IF EXISTS "Anon users can insert whatsapp_notifications" ON whatsapp_notifications;

CREATE POLICY "Anon users can insert whatsapp_notifications" ON whatsapp_notifications
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Also ensure anon users can update (for retry logic)
DROP POLICY IF EXISTS "Anon users can update whatsapp_notifications" ON whatsapp_notifications;

CREATE POLICY "Anon users can update whatsapp_notifications" ON whatsapp_notifications
    FOR UPDATE 
    TO anon
    USING (true)
    WITH CHECK (true);

-- 4. Update whatsapp_error_logs table schema if it exists
DO $$ 
BEGIN
  -- Add operation column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_error_logs' AND column_name = 'operation'
  ) THEN
    ALTER TABLE whatsapp_error_logs ADD COLUMN operation TEXT;
  END IF;

  -- Add order_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_error_logs' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE whatsapp_error_logs ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
  END IF;

  -- Add customer_phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_error_logs' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE whatsapp_error_logs ADD COLUMN customer_phone TEXT;
  END IF;

  -- Add notification_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_error_logs' AND column_name = 'notification_id'
  ) THEN
    ALTER TABLE whatsapp_error_logs ADD COLUMN notification_id UUID REFERENCES whatsapp_notifications(id) ON DELETE SET NULL;
  END IF;

  -- Add additional_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_error_logs' AND column_name = 'additional_data'
  ) THEN
    ALTER TABLE whatsapp_error_logs ADD COLUMN additional_data JSONB;
  END IF;
END $$;

-- Create indexes for faster lookups (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_created_at ON whatsapp_error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_order_id ON whatsapp_error_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_operation ON whatsapp_error_logs(operation);

-- Enable RLS on error logs
ALTER TABLE whatsapp_error_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read error logs" ON whatsapp_error_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert error logs" ON whatsapp_error_logs;
DROP POLICY IF EXISTS "Allow service role full access to error logs" ON whatsapp_error_logs;
DROP POLICY IF EXISTS "Allow anon users to insert error logs" ON whatsapp_error_logs;

-- Allow authenticated users to read error logs
CREATE POLICY "Allow authenticated users to read error logs"
  ON whatsapp_error_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert error logs
CREATE POLICY "Allow authenticated users to insert error logs"
  ON whatsapp_error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to insert error logs
CREATE POLICY "Allow anon users to insert error logs"
  ON whatsapp_error_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to error logs"
  ON whatsapp_error_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE whatsapp_opt_outs IS 'Tracks customers who have opted out of WhatsApp notifications';
COMMENT ON TABLE whatsapp_error_logs IS 'Logs errors from WhatsApp notification system for debugging';
