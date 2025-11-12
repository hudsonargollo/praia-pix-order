-- Apply this SQL directly in Supabase Dashboard > SQL Editor
-- This fixes RLS policies to allow admin/staff to edit orders and order items

-- ============================================================================
-- ORDER_ITEMS POLICIES
-- ============================================================================

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Staff can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can manage order items" ON public.order_items;

-- Allow staff (admin, cashier, kitchen) to INSERT order items
CREATE POLICY "Staff can insert order items" ON public.order_items
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'cashier') OR
    public.has_role(auth.uid(), 'kitchen')
  );

-- Allow staff to UPDATE order items
CREATE POLICY "Staff can update order items" ON public.order_items
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'cashier') OR
    public.has_role(auth.uid(), 'kitchen')
  );

-- Allow staff to DELETE order items
CREATE POLICY "Staff can delete order items" ON public.order_items
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'cashier') OR
    public.has_role(auth.uid(), 'kitchen')
  );

-- ============================================================================
-- ORDERS POLICIES - Additional permissions
-- ============================================================================

-- Ensure admin can do everything with orders
DROP POLICY IF EXISTS "Admin full access to orders" ON public.orders;

CREATE POLICY "Admin full access to orders" ON public.orders
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- MENU_ITEMS POLICIES - Verify admin access
-- ============================================================================

-- The policy "Admins can manage menu items" should already exist
-- But let's ensure it's properly set up

DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;

CREATE POLICY "Admins can manage menu items" ON public.menu_items
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- MENU_CATEGORIES POLICIES - Ensure admin can manage
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage menu categories" ON public.menu_categories;

CREATE POLICY "Admins can manage menu categories" ON public.menu_categories
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the has_role function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'has_role'
  ) THEN
    RAISE EXCEPTION 'has_role function does not exist. Please run the function creation migration first.';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated successfully for admin operations';
END $$;

-- Show applied policies
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'ALL' THEN 'All Operations'
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as operation
FROM pg_policies
WHERE tablename IN ('order_items', 'orders', 'menu_items', 'menu_categories')
  AND policyname LIKE '%Staff%' OR policyname LIKE '%Admin%'
ORDER BY tablename, cmd;
