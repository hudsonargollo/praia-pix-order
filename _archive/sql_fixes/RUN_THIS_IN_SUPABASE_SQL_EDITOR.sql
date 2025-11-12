-- ============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- This fixes the RLS policy issue preventing order status updates after payment
-- 
-- Instructions:
-- 1. Go to https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql/new
-- 2. Copy and paste this entire file
-- 3. Click "Run" button
-- 4. Verify it says "Success. No rows returned"
-- ============================================================================

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Kitchen can mark orders ready" ON public.orders;
DROP POLICY IF EXISTS "Cashiers can confirm payments" ON public.orders;

-- Create a security definer function to confirm payment
-- This bypasses RLS and allows client-side code to update order status after payment
CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  _order_id uuid,
  _payment_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_status text;
BEGIN
  -- Get current order status
  SELECT status INTO _current_status
  FROM orders
  WHERE id = _order_id;

  -- Only allow confirmation if order is in pending_payment status
  IF _current_status != 'pending_payment' THEN
    RAISE EXCEPTION 'Order is not in pending_payment status (current: %)', _current_status;
  END IF;

  -- Update order status to in_preparation
  UPDATE orders
  SET 
    status = 'in_preparation',
    payment_confirmed_at = NOW()
  WHERE id = _order_id;

  RETURN true;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text) TO authenticated;

-- Create new policies that allow:
-- 1. Staff to update orders (kitchen/cashier/admin)
-- 2. Payment field updates during order creation

CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'kitchen') OR 
    public.has_role(auth.uid(), 'cashier') OR
    public.has_role(auth.uid(), 'admin')
  );

-- Allow updating payment-related fields during order creation/payment flow
CREATE POLICY "Allow payment field updates" ON public.orders
  FOR UPDATE
  USING (
    -- Allow updating payment fields when order is in pending or pending_payment status
    status IN ('pending', 'pending_payment')
  )
  WITH CHECK (
    -- Allow updating to pending_payment and setting payment fields
    status IN ('pending', 'pending_payment')
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running, verify the function was created:
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'confirm_order_payment';

-- Should return one row showing the function exists
-- ============================================================================
