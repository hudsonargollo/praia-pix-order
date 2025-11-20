-- Migration: Create payment confirmation tracking infrastructure
-- This migration adds:
-- 1. payment_confirmation_log table for tracking all payment confirmation attempts
-- 2. dedupe_key column to whatsapp_notifications for deduplication
-- 3. RLS policies for the new table

-- ============================================================================
-- 1. Add dedupe_key column to whatsapp_notifications table
-- ============================================================================

-- Add dedupe_key column for notification deduplication
ALTER TABLE whatsapp_notifications 
ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

-- Create index for efficient deduplication lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_dedupe 
ON whatsapp_notifications(dedupe_key, created_at DESC);

-- Add comment explaining the dedupe_key format
COMMENT ON COLUMN whatsapp_notifications.dedupe_key IS 
'Deduplication key format: {order_id}:{notification_type}:{date}. Example: "abc-123:payment_confirmed:2025-11-19"';

-- ============================================================================
-- 2. Create payment_confirmation_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_confirmation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('manual', 'webhook', 'mercadopago')),
  payment_method TEXT,
  payment_id TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_payment_confirmation_log_order 
ON payment_confirmation_log(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_confirmation_log_source 
ON payment_confirmation_log(source);

CREATE INDEX IF NOT EXISTS idx_payment_confirmation_log_created_at 
ON payment_confirmation_log(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_payment_confirmation_log_updated_at 
    BEFORE UPDATE ON payment_confirmation_log 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comment
COMMENT ON TABLE payment_confirmation_log IS 
'Tracks all payment confirmation attempts from various sources (manual, webhook, mercadopago) to prevent duplicates and provide audit trail';

-- ============================================================================
-- 3. Add RLS policies for payment_confirmation_log
-- ============================================================================

-- Enable RLS
ALTER TABLE payment_confirmation_log ENABLE ROW LEVEL SECURITY;

-- Policy for service role to have full access (for edge functions)
CREATE POLICY "Service role has full access to payment_confirmation_log" 
ON payment_confirmation_log
FOR ALL 
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Policy for authenticated users (staff) to read logs
CREATE POLICY "Authenticated users can read payment_confirmation_log" 
ON payment_confirmation_log
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy for authenticated users (staff) to insert logs
CREATE POLICY "Authenticated users can insert payment_confirmation_log" 
ON payment_confirmation_log
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 4. Create helper function to check for recent confirmations
-- ============================================================================

CREATE OR REPLACE FUNCTION check_recent_payment_confirmation(
  p_order_id UUID,
  p_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_confirmation_exists BOOLEAN;
BEGIN
  -- Check if there's a confirmation within the specified time window
  SELECT EXISTS (
    SELECT 1 
    FROM payment_confirmation_log
    WHERE order_id = p_order_id
      AND created_at > NOW() - (p_minutes || ' minutes')::INTERVAL
  ) INTO recent_confirmation_exists;
  
  RETURN recent_confirmation_exists;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION check_recent_payment_confirmation IS 
'Helper function to check if an order has been confirmed recently (default: within 5 minutes) to prevent duplicate confirmations';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_recent_payment_confirmation TO authenticated;
GRANT EXECUTE ON FUNCTION check_recent_payment_confirmation TO service_role;
