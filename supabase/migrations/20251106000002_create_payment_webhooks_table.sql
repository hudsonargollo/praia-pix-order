-- Create payment webhooks tracking table
-- Requirements: 8.1, 8.2

-- Create payment_webhooks table for audit trail and deduplication
CREATE TABLE public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  mercadopago_payment_id VARCHAR NOT NULL,
  webhook_data JSONB NOT NULL,
  webhook_type VARCHAR NOT NULL, -- 'payment', 'merchant_order', etc.
  action VARCHAR, -- 'payment.created', 'payment.updated', etc.
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'duplicate'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Only admins and cashiers can view webhook data
CREATE POLICY "Staff can view payment webhooks" ON public.payment_webhooks
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'cashier')
  );

-- System can insert webhook records (no auth required for webhook endpoint)
CREATE POLICY "System can insert payment webhooks" ON public.payment_webhooks
  FOR INSERT WITH CHECK (true);

-- Only admins can update webhook records
CREATE POLICY "Admins can update payment webhooks" ON public.payment_webhooks
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for efficient querying and deduplication
CREATE INDEX idx_payment_webhooks_mercadopago_payment_id 
ON public.payment_webhooks(mercadopago_payment_id);

CREATE INDEX idx_payment_webhooks_order_id 
ON public.payment_webhooks(order_id);

CREATE INDEX idx_payment_webhooks_created_at 
ON public.payment_webhooks(created_at);

CREATE INDEX idx_payment_webhooks_processing_status 
ON public.payment_webhooks(processing_status);

-- Create unique index for deduplication based on payment ID and webhook type/action
CREATE UNIQUE INDEX idx_payment_webhooks_deduplication 
ON public.payment_webhooks(mercadopago_payment_id, webhook_type, action, (webhook_data->>'date_created'));

-- Add comments for documentation
COMMENT ON TABLE public.payment_webhooks IS 'Audit trail for MercadoPago webhook processing with deduplication';
COMMENT ON COLUMN public.payment_webhooks.mercadopago_payment_id IS 'MercadoPago payment ID from webhook';
COMMENT ON COLUMN public.payment_webhooks.webhook_data IS 'Complete webhook payload as JSON';
COMMENT ON COLUMN public.payment_webhooks.webhook_type IS 'Type of webhook (payment, merchant_order, etc.)';
COMMENT ON COLUMN public.payment_webhooks.action IS 'Webhook action (payment.created, payment.updated, etc.)';
COMMENT ON COLUMN public.payment_webhooks.processing_status IS 'Status of webhook processing';
COMMENT ON COLUMN public.payment_webhooks.error_message IS 'Error message if processing failed';