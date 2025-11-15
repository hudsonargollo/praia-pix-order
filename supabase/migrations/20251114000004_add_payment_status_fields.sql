-- Add payment status tracking fields to orders table
-- This migration separates payment status from order status for waiter-created orders

-- Add payment_status column with CHECK constraint
ALTER TABLE public.orders
ADD COLUMN payment_status TEXT DEFAULT 'pending'
CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded'));

-- Add PIX generation timestamp
ALTER TABLE public.orders
ADD COLUMN pix_generated_at TIMESTAMP WITH TIME ZONE;

-- Add PIX QR code storage
ALTER TABLE public.orders
ADD COLUMN pix_qr_code TEXT;

-- Add PIX expiration timestamp
ALTER TABLE public.orders
ADD COLUMN pix_expires_at TIMESTAMP WITH TIME ZONE;

-- Note: payment_confirmed_at already exists in the orders table from previous migrations

-- Create performance indexes
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status)
WHERE deleted_at IS NULL;

CREATE INDEX idx_orders_waiter_payment ON public.orders(waiter_id, payment_status)
WHERE waiter_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_orders_status_payment ON public.orders(status, payment_status)
WHERE deleted_at IS NULL;

-- Data migration: set existing completed orders to payment_status='confirmed'
UPDATE public.orders
SET payment_status = 'confirmed',
    payment_confirmed_at = COALESCE(payment_confirmed_at, created_at)
WHERE status = 'completed'
AND payment_status = 'pending';

-- Also set confirmed payment status for orders that have payment_confirmed_at set
UPDATE public.orders
SET payment_status = 'confirmed'
WHERE payment_confirmed_at IS NOT NULL
AND payment_status = 'pending';

-- Add comment to document the payment_status field
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status independent of order status: pending, confirmed, failed, refunded';
COMMENT ON COLUMN public.orders.pix_generated_at IS 'Timestamp when PIX QR code was generated for this order';
COMMENT ON COLUMN public.orders.pix_qr_code IS 'PIX QR code data for payment';
COMMENT ON COLUMN public.orders.pix_expires_at IS 'Expiration timestamp for the PIX payment';
