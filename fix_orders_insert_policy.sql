-- Fix: Add INSERT policy for orders table
-- This allows waiters and customers to create orders

-- Drop any existing insert policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Allow anyone (authenticated or not) to insert orders
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT 
  WITH CHECK (true);

-- Also ensure order_items can be inserted
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;

CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
