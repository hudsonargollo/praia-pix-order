-- Add MercadoPago payment fields to orders table
-- Requirements: 4.1, 4.2

-- Add payment tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS mercadopago_payment_id VARCHAR,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS pix_copy_paste TEXT,
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kitchen_notified_at TIMESTAMP WITH TIME ZONE;

-- Add index on payment ID for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_mercadopago_payment_id 
ON public.orders(mercadopago_payment_id) 
WHERE mercadopago_payment_id IS NOT NULL;

-- Add index on payment expiration for cleanup queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_expires_at 
ON public.orders(payment_expires_at) 
WHERE payment_expires_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.mercadopago_payment_id IS 'MercadoPago payment ID for tracking payment status';
COMMENT ON COLUMN public.orders.qr_code_data IS 'QR code data for payment display';
COMMENT ON COLUMN public.orders.pix_copy_paste IS 'PIX copy/paste code for manual payment';
COMMENT ON COLUMN public.orders.payment_expires_at IS 'Payment expiration timestamp';
COMMENT ON COLUMN public.orders.kitchen_notified_at IS 'Timestamp when kitchen was notified of paid order';