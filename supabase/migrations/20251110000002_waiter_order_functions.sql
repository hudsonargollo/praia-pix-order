-- Create helper functions for waiter order management
-- Requirements: 3.2, 4.2, 6.2

-- Function to create a waiter order with proper validation
CREATE OR REPLACE FUNCTION public.create_waiter_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_table_number TEXT DEFAULT NULL,
  p_order_notes TEXT DEFAULT NULL,
  p_total_amount DECIMAL(10,2),
  p_order_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_waiter_id UUID;
  v_item JSONB;
BEGIN
  -- Get the current user's ID (must be a waiter)
  v_waiter_id := auth.uid();
  
  -- Validate that the user is a waiter
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = v_waiter_id 
    AND raw_app_meta_data ->> 'role' = 'waiter'
  ) THEN
    RAISE EXCEPTION 'Only waiters can create waiter orders';
  END IF;
  
  -- Validate input parameters
  IF p_customer_name IS NULL OR LENGTH(TRIM(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;
  
  IF p_customer_phone IS NULL OR LENGTH(TRIM(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'Customer phone is required';
  END IF;
  
  -- Validate phone number format (11 digits)
  IF NOT p_customer_phone ~ '^\d{11}$' THEN
    RAISE EXCEPTION 'Customer phone must be 11 digits';
  END IF;
  
  -- Validate order notes length (max 500 characters)
  IF p_order_notes IS NOT NULL AND LENGTH(p_order_notes) > 500 THEN
    RAISE EXCEPTION 'Order notes cannot exceed 500 characters';
  END IF;
  
  -- Create the order
  INSERT INTO public.orders (
    customer_name,
    customer_phone,
    table_number,
    order_notes,
    total_amount,
    waiter_id,
    created_by_waiter,
    status
  ) VALUES (
    TRIM(p_customer_name),
    TRIM(p_customer_phone),
    COALESCE(TRIM(p_table_number), ''),
    TRIM(p_order_notes),
    p_total_amount,
    v_waiter_id,
    true,
    'pending'  -- Waiter orders start as pending, not pending_payment
  ) RETURNING id INTO v_order_id;
  
  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      quantity,
      unit_price,
      item_name
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL(10,2),
      v_item->>'item_name'
    );
  END LOOP;
  
  RETURN v_order_id;
END;
$$;

-- Grant execution to authenticated users (waiters)
GRANT EXECUTE ON FUNCTION public.create_waiter_order TO authenticated;

-- Function to get waiter performance data for admin reporting
CREATE OR REPLACE FUNCTION public.get_waiter_performance(
  p_waiter_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  waiter_id UUID,
  waiter_name TEXT,
  waiter_email TEXT,
  total_orders BIGINT,
  completed_orders BIGINT,
  cancelled_orders BIGINT,
  gross_sales NUMERIC,
  total_commission NUMERIC,
  order_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate that the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data ->> 'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can access waiter performance data';
  END IF;
  
  RETURN QUERY
  SELECT 
    wp.waiter_id,
    wp.waiter_name,
    wp.waiter_email,
    wp.total_orders,
    wp.completed_orders,
    wp.cancelled_orders,
    wp.gross_sales,
    wp.total_commission,
    wp.order_date::DATE
  FROM public.waiter_performance wp
  WHERE 
    (p_waiter_id IS NULL OR wp.waiter_id = p_waiter_id)
    AND (p_start_date IS NULL OR wp.order_date >= p_start_date)
    AND (p_end_date IS NULL OR wp.order_date <= p_end_date)
  ORDER BY wp.order_date DESC, wp.waiter_name;
END;
$$;

-- Grant execution to authenticated users (admins only, enforced by function)
GRANT EXECUTE ON FUNCTION public.get_waiter_performance TO authenticated;

-- Function to update order status (for kitchen/cashier use)
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Validate that the user has permission to update orders
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data ->> 'role' IN ('kitchen', 'admin', 'cashier', 'waiter')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to update order status';
  END IF;
  
  -- Validate status values
  IF p_new_status NOT IN ('pending', 'in_preparation', 'ready', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status: %', p_new_status;
  END IF;
  
  -- Get current status
  SELECT status INTO v_current_status 
  FROM public.orders 
  WHERE id = p_order_id;
  
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Update the order status with appropriate timestamps
  UPDATE public.orders 
  SET 
    status = p_new_status,
    ready_at = CASE WHEN p_new_status = 'ready' THEN NOW() ELSE ready_at END,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execution to authenticated users (with role validation in function)
GRANT EXECUTE ON FUNCTION public.update_order_status TO authenticated;