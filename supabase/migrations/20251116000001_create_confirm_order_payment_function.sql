-- Create function to confirm order payment (bypasses RLS)
-- This is needed for the polling service to update orders

CREATE OR REPLACE FUNCTION confirm_order_payment(
  _order_id UUID,
  _payment_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update order status to paid
  UPDATE orders
  SET 
    status = 'paid',
    payment_status = 'confirmed',
    payment_confirmed_at = NOW(),
    mercadopago_payment_id = _payment_id,
    updated_at = NOW()
  WHERE id = _order_id
    AND status = 'pending_payment'; -- Only update if still pending

  -- Log the confirmation
  RAISE NOTICE 'Order % payment confirmed with payment ID %', _order_id, _payment_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_order_payment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_order_payment(UUID, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION confirm_order_payment IS 'Confirms order payment and updates status. Used by polling service. Bypasses RLS with SECURITY DEFINER.';
