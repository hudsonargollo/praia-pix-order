-- Fix confirm_order_payment function to set status to 'paid' instead of 'in_preparation'
-- The correct flow is: pending_payment -> paid -> in_preparation -> ready -> completed

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
    RAISE EXCEPTION 'Order is not in pending_payment status. Current status: %', _current_status;
  END IF;

  -- Update order status to 'paid' (not 'in_preparation')
  -- Kitchen will move it to 'in_preparation' when they start working on it
  UPDATE orders
  SET 
    status = 'paid',
    payment_confirmed_at = NOW(),
    mercadopago_payment_id = _payment_id
  WHERE id = _order_id;

  RETURN true;
END;
$$;

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text) TO authenticated;
