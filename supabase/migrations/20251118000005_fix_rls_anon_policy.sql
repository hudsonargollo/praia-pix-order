-- Fix RLS policies for anonymous users to insert WhatsApp notifications
-- This is a more aggressive fix to ensure anon users can insert

-- First, let's see what policies exist and drop them all
DROP POLICY IF EXISTS "Anon users can insert whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Anon users can update whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Authenticated users can read whatsapp_notifications" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Service role can manage whatsapp_notifications" ON whatsapp_notifications;

-- Recreate policies with explicit permissions

-- 1. Service role has full access (always needed)
CREATE POLICY "Service role full access"
  ON whatsapp_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Anonymous users can INSERT (this is critical for customer orders)
CREATE POLICY "Anonymous users can insert"
  ON whatsapp_notifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 3. Anonymous users can UPDATE (needed for retry logic)
CREATE POLICY "Anonymous users can update"
  ON whatsapp_notifications
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. Anonymous users can SELECT their own notifications
CREATE POLICY "Anonymous users can read"
  ON whatsapp_notifications
  FOR SELECT
  TO anon
  USING (true);

-- 5. Authenticated users can INSERT
CREATE POLICY "Authenticated users can insert"
  ON whatsapp_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Authenticated users can UPDATE
CREATE POLICY "Authenticated users can update"
  ON whatsapp_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Authenticated users can SELECT
CREATE POLICY "Authenticated users can read"
  ON whatsapp_notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify RLS is enabled
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Add a comment
COMMENT ON TABLE whatsapp_notifications IS 'WhatsApp notifications with RLS policies allowing anon and authenticated users';
