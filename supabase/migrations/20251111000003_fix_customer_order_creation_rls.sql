-- Fix RLS policies to allow customer order creation
-- This migration addresses the issue where customers cannot create orders
-- due to overly restrictive RLS policies

-- ============================================================================
-- ORDERS TABLE - RLS POLICY UPDATES
-- ============================================================================

-- Drop all existing policies on orders table
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Kitchen can mark orders ready" ON public.orders;
DROP POLICY IF EXISTS "Cashiers can confirm payments" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow payment field updates" ON public.orders;
DROP POLICY IF EXISTS "Admin full access to orders" ON public.orders;

-- CREATE INSERT POLICIES (Allow all users to create orders)
-- This is required for customer order creation flow

CREATE POLICY "Public can insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- CREATE SELECT POLICIES (Allow viewing orders)
-- Customers need to view their orders for payment page

CREATE POLICY "Public can view orders" ON public.orders
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can view orders" ON public.orders
  FOR SELECT
  USING (true);

-- CREATE UPDATE POLICIES (Staff only)
-- Only staff members can update order status and details

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

-- CREATE DELETE POLICIES (Admin only)
-- Only admins can delete orders

CREATE POLICY "Admin can delete orders" ON public.orders
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- ORDER_ITEMS TABLE - RLS POLICY UPDATES
-- ============================================================================

-- Drop all existing policies on order_items table
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can delete order items" ON public.order_items;

-- CREATE INSERT POLICIES (Allow all users to create order items)
-- This is required for customer order creation flow

CREATE POLICY "Public can insert order_items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert order_items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- CREATE SELECT POLICIES (Allow viewing order items)

CREATE POLICY "Public can view order_items" ON public.order_items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can view order_items" ON public.order_items
  FOR SELECT
  USING (true);

-- CREATE UPDATE POLICIES (Staff only)

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

-- CREATE DELETE POLICIES (Admin only)

CREATE POLICY "Admin can delete order_items" ON public.order_items
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- RLS policies updated successfully for customer order creation
-- Customers can now INSERT orders and order_items
-- Staff can UPDATE orders and order_items  
-- Admin can DELETE orders and order_items
--
-- Run test-rls-simple.sql to verify the policies were applied correctly
