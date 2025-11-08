-- ============================================================================
-- ADD FUNCTION TO MARK ORDERS AS READY
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Allows kitchen staff to mark orders as ready (bypasses RLS)
-- ============================================================================

-- Create function to mark order as ready
CREATE OR REPLACE FUNCTION public.mark_order_ready(
  _order_id uuid
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

  -- Check if order exists
  IF _current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Only allow marking as ready if order is in_preparation
  IF _current_status NOT IN ('in_preparation', 'paid') THEN
    RAISE EXCEPTION 'Order must be in preparation to mark as ready (current: %)', _current_status;
  END IF;

  -- Update order status to ready
  UPDATE orders
  SET 
    status = 'ready',
    ready_at = NOW()
  WHERE id = _order_id;

  RETURN true;
END;
$$;

-- Grant execute permission to everyone (kitchen staff will use this)
GRANT EXECUTE ON FUNCTION public.mark_order_ready(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_order_ready(uuid) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify the function was created:
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'mark_order_ready';

-- Should return one row showing the function exists
-- ============================================================================
