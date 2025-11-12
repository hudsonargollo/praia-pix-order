-- Simple fix for the orders RLS policy issue
-- Just fix the problematic policy without creating conflicts

-- Drop the problematic policy that references non-existent user_id
DROP POLICY IF EXISTS "Users can update orders" ON public.orders;

-- Create a simple policy that allows authenticated users to update orders
CREATE POLICY "Authenticated users can update orders" ON public.orders
  FOR UPDATE TO authenticated 
  USING (true);