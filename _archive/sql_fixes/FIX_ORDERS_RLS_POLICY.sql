-- Fix the orders RLS policy - remove reference to non-existent user_id column
-- The original orders table doesn't have a user_id column

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update orders" ON public.orders;

-- Create a new policy that works with the actual table structure
-- Allow authenticated users with specific roles to update orders
CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE TO authenticated 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_app_meta_data ->> 'role' IN ('admin', 'kitchen', 'cashier', 'waiter')
    )
  );

-- Also ensure we have proper SELECT policy for staff
DROP POLICY IF EXISTS "Anyone can view their own orders" ON public.orders;

CREATE POLICY "Anyone can view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (true);

-- Allow public (unauthenticated) users to view orders for customer access
CREATE POLICY "Public can view orders" ON public.orders
  FOR SELECT TO anon
  USING (true);