-- Fix order creation for customers
-- Run this in Supabase Dashboard SQL Editor

-- Check current policies on orders table
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'orders';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Customers can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;

-- Create simple policy: anyone (even anonymous) can create orders
CREATE POLICY "Anyone can insert orders" ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Also ensure authenticated users can create orders
CREATE POLICY "Authenticated can insert orders" ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Check order_items policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'order_items';

-- Drop existing restrictive policies on order_items
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Create simple policy for order_items
CREATE POLICY "Anyone can insert order_items" ON public.order_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert order_items" ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ORDER CREATION POLICIES UPDATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Orders: Anyone can create orders';
  RAISE NOTICE '📝 Order Items: Anyone can create order items';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Test order creation now!';
  RAISE NOTICE '';
END $$;
