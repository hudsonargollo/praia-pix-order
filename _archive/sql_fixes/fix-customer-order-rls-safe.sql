-- Safe RLS Policy Fix for Customer Order Creation
-- This script drops ALL existing policies first, then creates the correct ones

-- ============================================================================
-- STEP 1: Drop ALL existing policies on orders table
-- ============================================================================

DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Kitchen can mark orders ready" ON public.orders;
DROP POLICY IF EXISTS "Cashiers can confirm payments" ON public.orders;
DROP POLICY IF EXISTS "Allow payment field updates" ON public.orders;
DROP POLICY IF EXISTS "Admin full access to orders" ON public.orders;

-- ============================================================================
-- STEP 2: Drop ALL existing policies on order_items table
-- ============================================================================

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated can view order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can delete order_items" ON public.order_items;

-- ============================================================================
-- STEP 3: Create INSERT policies for ORDERS (Allow everyone)
-- ============================================================================

CREATE POLICY "Public can insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STEP 4: Create SELECT policies for ORDERS (Allow everyone)
-- ============================================================================

CREATE POLICY "Public can view orders" ON public.orders
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can view orders" ON public.orders
  FOR SELECT
  USING (true);

-- ============================================================================
-- STEP 5: Create UPDATE policy for ORDERS (Staff only)
-- ============================================================================

CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'cashier') OR
    public.has_role(auth.uid(), 'kitchen')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'cashier') OR
    public.has_role(auth.uid(), 'kitchen')
  );

-- ============================================================================
-- STEP 6: Create DELETE policy for ORDERS (Admin only)
-- ============================================================================

CREATE POLICY "Admin can delete orders" ON public.orders
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- STEP 7: Create INSERT policies for ORDER_ITEMS (Allow everyone)
-- ============================================================================

CREATE POLICY "Public can insert order_items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert order_items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STEP 8: Create SELECT policies for ORDER_ITEMS (Allow everyone)
-- ============================================================================

CREATE POLICY "Public can view order_items" ON public.order_items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can view order_items" ON public.order_items
  FOR SELECT
  USING (true);

-- ============================================================================
-- STEP 9: Create UPDATE policy for ORDER_ITEMS (Staff only)
-- ============================================================================

CREATE POLICY "Staff can update order_items" ON public.order_items
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'cashier') OR
    public.has_role(auth.uid(), 'kitchen')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'cashier') OR
    public.has_role(auth.uid(), 'kitchen')
  );

-- ============================================================================
-- STEP 10: Create DELETE policy for ORDER_ITEMS (Admin only)
-- ============================================================================

CREATE POLICY "Admin can delete order_items" ON public.order_items
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- ✅ All policies have been recreated
-- ✅ Customers can now INSERT orders and order_items
-- ✅ Everyone can SELECT orders and order_items
-- ✅ Only staff can UPDATE orders and order_items
-- ✅ Only admin can DELETE orders and order_items
