-- Update confirm_order_payment function to include payment_method parameter
-- This allows tracking whether payment was made via PIX or credit card

CREATE OR REPLACE FUNCTION confirm_order_payment(
  _order_id UUID,
  _payment_id TEXT,
  _payment_method TEXT DEFAULT 'pix'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update order status to paid with payment method
  UPDATE orders
  SET 
    status = 'paid',
    payment_status = 'confirmed',
    payment_confirmed_at = NOW(),
    mercadopago_payment_id = _payment_id,
    payment_method = _payment_method,
    updated_at = NOW()
  WHERE id = _order_id
    AND status = 'pending_payment'; -- Only update if still pending

  -- Log the confirmation
  RAISE NOTICE 'Order % payment confirmed with payment ID % via %', _order_id, _payment_id, _payment_method;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_order_payment(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_order_payment(UUID, TEXT, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION confirm_order_payment IS 'Confirms order payment and updates status with payment method. Used by polling service. Bypasses RLS with SECURITY DEFINER.';
