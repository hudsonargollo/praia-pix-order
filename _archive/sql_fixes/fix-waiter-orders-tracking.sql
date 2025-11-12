-- ============================================================================
-- FIX WAITER ORDERS TRACKING IN ADMIN PANEL
-- ============================================================================
-- This script ensures:
-- 1. All necessary columns exist in orders table
-- 2. Waiter orders are properly tracked with waiter_id and commission
-- 3. Admin panel can query and display waiter orders correctly
-- ============================================================================

-- Step 1: Verify and add missing columns if needed
-- ============================================================================

-- Add waiter_id if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'waiter_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN waiter_id uuid REFERENCES auth.users(id);
    RAISE NOTICE '✅ Added waiter_id column';
  ELSE
    RAISE NOTICE '✓ waiter_id column already exists';
  END IF;
END $$;

-- Add commission_amount if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'commission_amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN commission_amount numeric;
    RAISE NOTICE '✅ Added commission_amount column';
  ELSE
    RAISE NOTICE '✓ commission_amount column already exists';
  END IF;
END $$;

-- Add created_by_waiter if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'created_by_waiter'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN created_by_waiter BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Added created_by_waiter column';
  ELSE
    RAISE NOTICE '✓ created_by_waiter column already exists';
  END IF;
END $$;

-- Add order_notes if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_notes'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN order_notes TEXT;
    RAISE NOTICE '✅ Added order_notes column';
  ELSE
    RAISE NOTICE '✓ order_notes column already exists';
  END IF;
END $$;

-- Step 2: Update commission calculation function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_waiter_commission()
RETURNS TRIGGER AS $$
DECLARE
    order_total numeric;
BEGIN
    -- Calculate commission for orders with waiter_id set
    IF NEW.waiter_id IS NOT NULL THEN
        order_total := NEW.total_amount; 
        
        -- Calculate 10% commission
        NEW.commission_amount := order_total * 0.10;
    ELSE
        -- No commission for non-waiter orders
        NEW.commission_amount := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS calculate_waiter_commission_trigger ON public.orders;
CREATE TRIGGER calculate_waiter_commission_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_waiter_commission();

-- Step 3: Backfill commission_amount for existing waiter orders
-- ============================================================================

UPDATE public.orders
SET commission_amount = total_amount * 0.10
WHERE waiter_id IS NOT NULL 
  AND (commission_amount IS NULL OR commission_amount = 0);

-- Step 4: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_waiter_id 
ON public.orders(waiter_id) 
WHERE waiter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_created_by_waiter 
ON public.orders(created_by_waiter) 
WHERE created_by_waiter = true;

-- Step 5: Verify the setup
-- ============================================================================

-- Show column information
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name IN ('waiter_id', 'commission_amount', 'created_by_waiter', 'order_notes')
ORDER BY column_name;

-- Show waiter orders summary
SELECT 
  u.email as waiter_email,
  (u.raw_user_meta_data->>'full_name') as waiter_name,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_sales,
  SUM(o.commission_amount) as total_commission
FROM auth.users u
LEFT JOIN public.orders o ON u.id = o.waiter_id
WHERE u.raw_user_meta_data->>'role' = 'waiter'
GROUP BY u.id, u.email, u.raw_user_meta_data
ORDER BY total_orders DESC;

-- Show recent waiter orders
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.total_amount,
  o.commission_amount,
  o.status,
  o.created_at,
  u.email as waiter_email,
  (u.raw_user_meta_data->>'full_name') as waiter_name
FROM public.orders o
JOIN auth.users u ON o.waiter_id = u.id
WHERE o.waiter_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ WAITER ORDERS TRACKING FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was fixed:';
  RAISE NOTICE '1. ✓ All required columns verified/added';
  RAISE NOTICE '2. ✓ Commission calculation function updated';
  RAISE NOTICE '3. ✓ Existing orders backfilled with commissions';
  RAISE NOTICE '4. ✓ Performance indexes created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify waiter orders appear in admin panel';
  RAISE NOTICE '2. Check that commission amounts are calculated';
  RAISE NOTICE '3. Test creating new waiter orders';
  RAISE NOTICE '';
END $$;
