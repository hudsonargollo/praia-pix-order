-- Make table_number nullable since we're using phone numbers to identify orders
ALTER TABLE public.orders 
ALTER COLUMN table_number DROP NOT NULL;

-- Set default value for existing records
UPDATE public.orders 
SET table_number = NULL 
WHERE table_number = '';

-- Add comment to clarify the field is deprecated
COMMENT ON COLUMN public.orders.table_number IS 'Deprecated: Orders are now identified by customer phone number';
