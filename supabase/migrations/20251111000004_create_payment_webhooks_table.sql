-- Create payment_webhooks table for logging Mercado Pago webhook events
-- This helps with debugging and audit trail

CREATE TABLE IF NOT EXISTS public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  webhook_type TEXT NOT NULL,
  webhook_action TEXT,
  payment_status TEXT NOT NULL,
  webhook_data JSONB,
  payment_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_order_id 
ON public.payment_webhooks(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_payment_id 
ON public.payment_webhooks(payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed_at 
ON public.payment_webhooks(processed_at DESC);

-- Add comments
COMMENT ON TABLE public.payment_webhooks IS 'Logs all Mercado Pago webhook events for audit and debugging';
COMMENT ON COLUMN public.payment_webhooks.webhook_data IS 'Raw webhook payload from Mercado Pago';
COMMENT ON COLUMN public.payment_webhooks.payment_data IS 'Payment details fetched from Mercado Pago API';

-- Enable RLS
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies (admin only can view webhook logs)
CREATE POLICY "Admin can view payment webhooks" ON public.payment_webhooks
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Grant permissions
GRANT SELECT ON public.payment_webhooks TO authenticated;
GRANT ALL ON public.payment_webhooks TO service_role;
