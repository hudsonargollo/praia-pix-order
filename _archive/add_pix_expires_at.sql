-- Add pix_expires_at column to orders table
-- This is required for PIX QR code generation

-- Add pix_expires_at column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMP WITH TIME ZONE;

-- Add pix_qr_code column if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pix_qr_code TEXT;

-- Create index for PIX expiration checks
CREATE INDEX IF NOT EXISTS idx_orders_pix_expires 
ON public.orders(pix_expires_at)
WHERE pix_expires_at IS NOT NULL;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('pix_qr_code', 'pix_expires_at', 'pix_generated_at')
ORDER BY column_name;
