-- This migration is kept for version control but does nothing
-- WhatsApp notifications are handled by the application layer
-- to avoid authentication issues with database triggers

-- Placeholder function (does nothing)
CREATE OR REPLACE FUNCTION trigger_order_creation_notification()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
