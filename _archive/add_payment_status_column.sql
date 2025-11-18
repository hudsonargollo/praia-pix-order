-- Add payment_status column to orders table
-- This is required for the waiter payment workflow

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_status'
    ) THEN
        -- Add payment_status column
        ALTER TABLE public.orders 
        ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded'));
        
        RAISE NOTICE 'Added payment_status column';
    ELSE
        RAISE NOTICE 'payment_status column already exists';
    END IF;
END $$;

-- Check if payment_confirmed_at exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_confirmed_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_confirmed_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added payment_confirmed_at column';
    ELSE
        RAISE NOTICE 'payment_confirmed_at column already exists';
    END IF;
END $$;

-- Check if pix_generated_at exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'pix_generated_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN pix_generated_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added pix_generated_at column';
    ELSE
        RAISE NOTICE 'pix_generated_at column already exists';
    END IF;
END $$;

-- Migrate existing data: set payment_status to 'confirmed' for completed orders
UPDATE public.orders 
SET payment_status = 'confirmed',
    payment_confirmed_at = updated_at
WHERE status IN ('completed', 'paid')
AND payment_status = 'pending';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON public.orders(payment_status)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_waiter_payment 
ON public.orders(waiter_id, payment_status)
WHERE waiter_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_payment 
ON public.orders(status, payment_status)
WHERE deleted_at IS NULL;

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
