-- Add UPDATE policy for orders table
-- This allows waiters and admins to update orders

-- Drop any existing restrictive update policies
DROP POLICY IF EXISTS "Kitchen can mark orders ready" ON public.orders;
DROP POLICY IF EXISTS "Cashiers can confirm payments" ON public.orders;
DROP POLICY IF EXISTS "Waiters can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

-- Allow anyone to update orders (needed for editing orders, updating totals, etc.)
CREATE POLICY "Anyone can update orders" ON public.orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verify the policy was created
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
WHERE tablename = 'orders' AND cmd = 'UPDATE'
ORDER BY policyname;
