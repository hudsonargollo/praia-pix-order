-- ============================================================================
-- ALL REQUIRED FUNCTIONS FOR COCO LOKO SYSTEM
-- ============================================================================
-- Run this ONCE in Supabase SQL Editor to enable all functionality
-- ============================================================================

-- 1. Function to confirm payment (bypasses RLS for payment confirmation)
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
  SELECT status INTO _current_status FROM orders WHERE id = _order_id;

  IF _current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF _current_status != 'pending_payment' THEN
    RAISE EXCEPTION 'Order is not in pending_payment status (current: %)', _current_status;
  END IF;

  UPDATE orders
  SET 
    status = 'in_preparation',
    payment_confirmed_at = NOW()
  WHERE id = _order_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text) TO authenticated;

-- 2. Function to mark order as ready (bypasses RLS for kitchen staff)
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
  SELECT status INTO _current_status FROM orders WHERE id = _order_id;

  IF _current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF _current_status NOT IN ('in_preparation', 'paid') THEN
    RAISE EXCEPTION 'Order must be in preparation to mark as ready (current: %)', _current_status;
  END IF;

  UPDATE orders
  SET 
    status = 'ready',
    ready_at = NOW()
  WHERE id = _order_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_order_ready(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_order_ready(uuid) TO authenticated;

-- 3. Function to mark order as completed (for cashier)
CREATE OR REPLACE FUNCTION public.mark_order_completed(
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
  SELECT status INTO _current_status FROM orders WHERE id = _order_id;

  IF _current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF _current_status != 'ready' THEN
    RAISE EXCEPTION 'Order must be ready to mark as completed (current: %)', _current_status;
  END IF;

  UPDATE orders
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = _order_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_order_completed(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_order_completed(uuid) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('confirm_order_payment', 'mark_order_ready', 'mark_order_completed')
ORDER BY routine_name;

-- Should return 3 rows showing all functions exist with DEFINER security
-- ============================================================================
