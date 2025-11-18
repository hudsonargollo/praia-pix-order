-- Add payment_status column to orders table (simple version)
-- This is required for the waiter payment workflow

-- Add payment_status column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

-- Add constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_payment_status_check'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded'));
    END IF;
END $$;

-- Add payment_confirmed_at column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add pix_generated_at column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pix_generated_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing data: set payment_status to 'confirmed' for completed orders
UPDATE public.orders 
SET payment_status = 'confirmed'
WHERE status IN ('completed', 'paid')
AND payment_status = 'pending';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON public.orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_waiter_payment 
ON public.orders(waiter_id, payment_status)
WHERE waiter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_payment 
ON public.orders(status, payment_status);

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('payment_status', 'payment_confirmed_at', 'pix_generated_at')
ORDER BY column_name;
