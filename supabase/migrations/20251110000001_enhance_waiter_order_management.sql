-- Enhance database schema for waiter order management
-- Requirements: 3.2, 3.4, 4.2, 6.2

-- Add order_notes column to orders table for special instructions
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_notes TEXT;

-- Add created_by_waiter boolean flag to distinguish waiter orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_by_waiter BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.order_notes IS 'Special instructions or modifications for the order (max 500 characters)';
COMMENT ON COLUMN public.orders.created_by_waiter IS 'Flag to distinguish orders created by waiters vs customer self-service';

-- Create waiter_performance view for admin reporting
CREATE OR REPLACE VIEW public.waiter_performance AS
SELECT 
  u.id as waiter_id,
  (u.raw_user_meta_data ->> 'full_name')::text as waiter_name,
  u.email as waiter_email,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as gross_sales,
  COALESCE(SUM(o.commission_amount), 0) as total_commission,
  DATE_TRUNC('day', o.created_at) as order_date,
  COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders
FROM auth.users u
LEFT JOIN public.orders o ON u.id = o.waiter_id
WHERE u.raw_app_meta_data ->> 'role' = 'waiter'
  AND u.deleted_at IS NULL
  AND (o.id IS NULL OR o.status != 'cancelled')
GROUP BY u.id, u.raw_user_meta_data, u.email, DATE_TRUNC('day', o.created_at);

-- Grant access to the waiter_performance view
GRANT SELECT ON public.waiter_performance TO authenticated;

-- Create RLS policy for waiter_performance view (admin access only)
CREATE POLICY "Admins can view waiter performance"
ON public.waiter_performance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data ->> 'role' = 'admin'
  )
);

-- Update existing RLS policies for waiter order access
-- Drop existing waiter policies to recreate them with enhanced logic
DROP POLICY IF EXISTS "Waiters can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Waiters can insert orders" ON public.orders;

-- Enhanced RLS policy for waiters to view their own orders and waiter-created orders
CREATE POLICY "Waiters can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = waiter_id OR
  (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data ->> 'role' = 'waiter'
    ) AND created_by_waiter = true
  )
);

-- Enhanced RLS policy for waiters to insert orders with proper attribution
CREATE POLICY "Waiters can insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data ->> 'role' = 'waiter'
  ) AND
  auth.uid() = waiter_id AND
  created_by_waiter = true
);

-- Enhanced RLS policy for waiters to update their own orders
CREATE POLICY "Waiters can update their own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = waiter_id AND created_by_waiter = true
)
WITH CHECK (
  auth.uid() = waiter_id AND created_by_waiter = true
);

-- Create policy for kitchen staff to view waiter orders
CREATE POLICY "Kitchen staff can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data ->> 'role' IN ('kitchen', 'admin', 'cashier')
  )
);

-- Create policy for kitchen staff to update order status
CREATE POLICY "Kitchen staff can update order status"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data ->> 'role' IN ('kitchen', 'admin', 'cashier')
  )
);

-- Create index on created_by_waiter for efficient filtering
CREATE INDEX IF NOT EXISTS idx_orders_created_by_waiter 
ON public.orders(created_by_waiter) 
WHERE created_by_waiter = true;

-- Create index on waiter_id for efficient waiter reporting
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id 
ON public.orders(waiter_id) 
WHERE waiter_id IS NOT NULL;

-- Create index on order_notes for text search if needed
CREATE INDEX IF NOT EXISTS idx_orders_notes 
ON public.orders USING gin(to_tsvector('portuguese', order_notes))
WHERE order_notes IS NOT NULL;

-- Update the commission calculation function to handle waiter orders properly
CREATE OR REPLACE FUNCTION public.calculate_waiter_commission()
RETURNS TRIGGER AS $$
DECLARE
    order_total numeric;
BEGIN
    -- Only calculate commission for waiter-created orders with waiter_id set
    IF NEW.waiter_id IS NOT NULL AND NEW.created_by_waiter = true THEN
        order_total := NEW.total_amount; 
        
        -- Calculate 10% commission for waiter orders
        NEW.commission_amount := order_total * 0.10;
    ELSE
        -- No commission for non-waiter orders
        NEW.commission_amount := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for waiter_performance view (for admin dashboard updates)
-- Note: Views cannot be added to realtime publications directly, 
-- but the underlying orders table changes will trigger updates