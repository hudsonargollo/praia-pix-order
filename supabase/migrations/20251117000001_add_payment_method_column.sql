-- Add payment_method column to orders table
-- This tracks whether payment was made via PIX, credit card, debit card, etc.
-- The value comes from MercadoPago API response (payment_type_id field)

-- Add payment_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_method TEXT
        CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'bank_transfer', 'ticket', 'account_money'));
        
        -- Add index for analytics queries
        CREATE INDEX idx_orders_payment_method 
        ON public.orders(payment_method) 
        WHERE payment_method IS NOT NULL AND deleted_at IS NULL;
        
        COMMENT ON COLUMN public.orders.payment_method IS 'Payment method from MercadoPago payment_type_id: pix, credit_card, debit_card, bank_transfer, ticket, account_money';
    END IF;
END $$;
