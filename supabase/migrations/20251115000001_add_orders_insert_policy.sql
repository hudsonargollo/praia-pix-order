-- Add INSERT policy for orders table
-- Allow authenticated users (including waiters) and anonymous users to create orders

-- Drop any existing insert policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Allow anyone (authenticated or not) to insert orders
-- This is needed for:
-- 1. Walk-up customers (anonymous)
-- 2. Waiters creating orders for customers
-- 3. Customers creating their own orders
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT 
  WITH CHECK (true);

-- Also ensure order_items can be inserted
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;

CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);
