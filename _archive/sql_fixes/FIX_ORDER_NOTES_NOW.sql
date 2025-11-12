-- Fix Order Notes Field - Apply Missing Migration
-- This adds the order_notes column that's causing the error

-- ============================================================================
-- Add order_notes column to orders table
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_notes TEXT;

-- ============================================================================
-- Add created_by_waiter column (if not exists)
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_by_waiter BOOLEAN DEFAULT false;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.orders.order_notes IS 'Special instructions or modifications for the order (max 500 characters)';
COMMENT ON COLUMN public.orders.created_by_waiter IS 'Flag to distinguish orders created by waiters vs customer self-service';

-- ============================================================================
-- Create index on order_notes for text search
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_notes 
ON public.orders USING gin(to_tsvector('portuguese', order_notes))
WHERE order_notes IS NOT NULL;

-- ============================================================================
-- Verify the columns were added
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('order_notes', 'created_by_waiter')
ORDER BY column_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ order_notes column added successfully';
  RAISE NOTICE '✅ created_by_waiter column added successfully';
  RAISE NOTICE '✅ Waiter panel order creation should now work!';
END $$;
