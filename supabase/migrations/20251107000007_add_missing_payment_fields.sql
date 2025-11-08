-- Add missing payment-related fields to orders table
-- These fields are needed for payment tracking and WhatsApp notifications

-- Add mercadopago_payment_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'mercadopago_payment_id'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN mercadopago_payment_id TEXT;
        
        COMMENT ON COLUMN public.orders.mercadopago_payment_id IS 'Mercado Pago payment ID for tracking';
    END IF;
END $$;

-- Add payment_expires_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_expires_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_expires_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.payment_expires_at IS 'When the PIX payment expires (typically 15 minutes)';
    END IF;
END $$;

-- Add payment_confirmed_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_confirmed_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_confirmed_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.payment_confirmed_at IS 'When payment was confirmed';
    END IF;
END $$;

-- Add ready_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'ready_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN ready_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.ready_at IS 'When order was marked as ready for pickup';
    END IF;
END $$;

-- Add kitchen_notified_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'kitchen_notified_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN kitchen_notified_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.kitchen_notified_at IS 'When kitchen was notified about paid order';
    END IF;
END $$;

-- Add notified_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'notified_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN notified_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.notified_at IS 'When customer was last notified via WhatsApp';
    END IF;
END $$;

-- Verify all columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name IN (
        'mercadopago_payment_id',
        'payment_expires_at',
        'payment_confirmed_at',
        'ready_at',
        'kitchen_notified_at',
        'notified_at'
    )
ORDER BY column_name;
