-- Minimal RLS Fix - Only Update What's Needed
-- This preserves your working INSERT policies and only fixes potential issues

-- ============================================================================
-- ANALYSIS OF CURRENT STATE
-- ============================================================================
-- ✅ orders: INSERT policies exist (Anyone + Authenticated)
-- ✅ order_items: INSERT policies exist (Anyone + Authenticated + Staff)
-- ⚠️ orders: Multiple UPDATE policies might conflict
-- ⚠️ orders: "Admin full access" ALL policy might interfere
-- ❌ orders: No explicit DELETE policy

-- ============================================================================
-- OPTION 1: DO NOTHING - Test if it already works!
-- ============================================================================
-- Your INSERT policies look correct. Before making changes, test if customer
-- order creation actually works now. The issue might have been fixed already.

-- ============================================================================
-- OPTION 2: Clean up redundant/conflicting policies (SAFER)
-- ============================================================================
-- Only run this if customer orders are still failing

-- Remove the "ALL" policy that might be interfering
-- DROP POLICY IF EXISTS "Admin full access to orders" ON public.orders;

-- Consolidate UPDATE policies into one clear policy
-- DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
-- DROP POLICY IF EXISTS "Cashiers can confirm payments" ON public.orders;
-- DROP POLICY IF EXISTS "Kitchen can mark orders ready" ON public.orders;

-- CREATE POLICY "Staff can update orders" ON public.orders
--   FOR UPDATE
--   USING (
--     public.has_role(auth.uid(), 'admin') OR
--     public.has_role(auth.uid(), 'cashier') OR
--     public.has_role(auth.uid(), 'kitchen')
--   )
--   WITH CHECK (
--     public.has_role(auth.uid(), 'admin') OR
--     public.has_role(auth.uid(), 'cashier') OR
--     public.has_role(auth.uid(), 'kitchen')
--   );

-- Add explicit DELETE policy
-- CREATE POLICY "Admin can delete orders" ON public.orders
--   FOR DELETE
--   USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- RECOMMENDATION
-- ============================================================================
-- 1. First, TEST if customer order creation works with current policies
-- 2. If it works, DO NOTHING - don't fix what isn't broken!
-- 3. If it fails, uncomment OPTION 2 above and run it
