-- ============================================================================
-- CREATE WHATSAPP TABLES IN PRODUCTION
-- ============================================================================
-- Run this in Supabase SQL Editor to create all required WhatsApp tables
-- ============================================================================

-- 1. Create whatsapp_notifications table
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  customer_phone TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('payment_confirmed', 'preparing', 'ready', 'custom', 'status_update')),
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'retrying')),
  attempts INTEGER NOT NULL DEFAULT 0,
  whatsapp_message_id TEXT,
  error_message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view notifications" ON public.whatsapp_notifications
  FOR SELECT USING (true);

CREATE POLICY "Service can insert notifications" ON public.whatsapp_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update notifications" ON public.whatsapp_notifications
  FOR UPDATE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_order_id 
  ON public.whatsapp_notifications(order_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status 
  ON public.whatsapp_notifications(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_created_at 
  ON public.whatsapp_notifications(created_at DESC);

-- 2. Create whatsapp_opt_out table (for compliance)
CREATE TABLE IF NOT EXISTS public.whatsapp_opt_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_opt_out ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view opt-outs" ON public.whatsapp_opt_out
  FOR SELECT USING (true);

CREATE POLICY "Public can opt-out" ON public.whatsapp_opt_out
  FOR INSERT WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_whatsapp_opt_out_phone 
  ON public.whatsapp_opt_out(phone_number);

-- 3. Create whatsapp_error_logs table (for monitoring)
CREATE TABLE IF NOT EXISTS public.whatsapp_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  notification_id UUID REFERENCES public.whatsapp_notifications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view error logs" ON public.whatsapp_error_logs
  FOR SELECT USING (true);

CREATE POLICY "Service can insert error logs" ON public.whatsapp_error_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_created_at 
  ON public.whatsapp_error_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_order_id 
  ON public.whatsapp_error_logs(order_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify tables were created:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('whatsapp_notifications', 'whatsapp_opt_out', 'whatsapp_error_logs');

-- Should return 3 rows
-- ============================================================================
