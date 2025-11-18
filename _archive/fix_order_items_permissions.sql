-- Fix: Add UPDATE and DELETE policies for order_items table
-- This allows editing orders (adding/removing/updating items)

-- Drop any existing update/delete policies
DROP POLICY IF EXISTS "Anyone can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can delete order items" ON public.order_items;

-- Allow anyone to update order items (needed for editing orders)
CREATE POLICY "Anyone can update order items" ON public.order_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete order items (needed for removing items from orders)
CREATE POLICY "Anyone can delete order items" ON public.order_items
  FOR DELETE
  USING (true);

-- Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY cmd, policyname;
