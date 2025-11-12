-- Fix payment_webhooks table - Drop and recreate with correct schema

-- Drop the table if it exists
DROP TABLE IF EXISTS public.payment_webhooks CASCADE;

-- Create with correct schema
CREATE TABLE public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  mercadopago_payment_id TEXT NOT NULL,
  webhook_type TEXT NOT NULL,
  webhook_action TEXT,
  payment_status TEXT NOT NULL,
  webhook_data JSONB,
  payment_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_payment_webhooks_order_id 
ON public.payment_webhooks(order_id);

CREATE INDEX idx_payment_webhooks_payment_id 
ON public.payment_webhooks(mercadopago_payment_id);

CREATE INDEX idx_payment_webhooks_processed_at 
ON public.payment_webhooks(processed_at DESC);

-- Add comments
COMMENT ON TABLE public.payment_webhooks IS 'Logs all Mercado Pago webhook events for audit and debugging';
COMMENT ON COLUMN public.payment_webhooks.webhook_data IS 'Raw webhook payload from Mercado Pago';
COMMENT ON COLUMN public.payment_webhooks.payment_data IS 'Payment details fetched from Mercado Pago API';

-- Enable RLS
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can view payment webhooks" ON public.payment_webhooks
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Grant permissions
GRANT SELECT ON public.payment_webhooks TO authenticated;
GRANT ALL ON public.payment_webhooks TO service_role;

-- Verify
SELECT 'Table created successfully!' as status;
