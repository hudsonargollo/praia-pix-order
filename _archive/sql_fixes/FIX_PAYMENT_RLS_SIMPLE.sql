-- ============================================================================
-- SIMPLE FIX FOR PAYMENT ORDER UPDATES
-- ============================================================================
-- Run this in Supabase SQL Editor
-- This creates a function to confirm payments that bypasses RLS
-- ============================================================================

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
  IF _current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify the function was created:
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'confirm_order_payment';

-- Should return one row showing:
-- routine_name: confirm_order_payment
-- routine_type: FUNCTION
-- security_type: DEFINER
-- ============================================================================
