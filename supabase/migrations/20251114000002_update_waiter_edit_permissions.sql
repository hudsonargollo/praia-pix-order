-- Update RLS policies to allow waiters to edit unpaid orders
-- Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5

-- ============================================================================
-- CREATE AUDIT LOG TABLE FOR ORDER MODIFICATIONS
-- ============================================================================

-- Create order_audit_log table to track all order modifications
CREATE TABLE IF NOT EXISTS public.order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL, -- 'update', 'delete', 'status_change', 'items_modified'
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  order_status TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_order_audit_log_order_id ON public.order_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_log_user_id ON public.order_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_log_created_at ON public.order_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_audit_log_action ON public.order_audit_log(action);

-- Add comments for documentation
COMMENT ON TABLE public.order_audit_log IS 'Audit trail for all order modifications including edits, status changes, and deletions';
COMMENT ON COLUMN public.order_audit_log.old_values IS 'JSON snapshot of order state before modification';
COMMENT ON COLUMN public.order_audit_log.new_values IS 'JSON snapshot of order state after modification';
COMMENT ON COLUMN public.order_audit_log.changed_fields IS 'Array of field names that were modified';

-- Enable RLS on audit log table
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.order_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.order_audit_log;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.order_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data ->> 'role' = 'admin'
    )
  );

-- System can insert audit logs (via trigger)
CREATE POLICY "System can insert audit logs"
  ON public.order_audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- CREATE AUDIT TRIGGER FUNCTION
-- ============================================================================

-- Function to log order modifications
CREATE OR REPLACE FUNCTION public.log_order_modification()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val TEXT;
  changed_fields_array TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get user role
  SELECT raw_app_meta_data ->> 'role' INTO user_role_val
  FROM auth.users
  WHERE id = auth.uid();

  -- Determine which fields changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.customer_name IS DISTINCT FROM NEW.customer_name THEN
      changed_fields_array := array_append(changed_fields_array, 'customer_name');
    END IF;
    IF OLD.customer_phone IS DISTINCT FROM NEW.customer_phone THEN
      changed_fields_array := array_append(changed_fields_array, 'customer_phone');
    END IF;
    IF OLD.table_number IS DISTINCT FROM NEW.table_number THEN
      changed_fields_array := array_append(changed_fields_array, 'table_number');
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      changed_fields_array := array_append(changed_fields_array, 'status');
    END IF;
    IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
      changed_fields_array := array_append(changed_fields_array, 'total_amount');
    END IF;
    IF OLD.commission_amount IS DISTINCT FROM NEW.commission_amount THEN
      changed_fields_array := array_append(changed_fields_array, 'commission_amount');
    END IF;
    IF OLD.order_notes IS DISTINCT FROM NEW.order_notes THEN
      changed_fields_array := array_append(changed_fields_array, 'order_notes');
    END IF;

    -- Only log if there are actual changes
    IF array_length(changed_fields_array, 1) > 0 THEN
      INSERT INTO public.order_audit_log (
        order_id,
        user_id,
        user_role,
        action,
        old_values,
        new_values,
        changed_fields,
        order_status
      ) VALUES (
        NEW.id,
        auth.uid(),
        user_role_val,
        CASE 
          WHEN 'status' = ANY(changed_fields_array) THEN 'status_change'
          ELSE 'update'
        END,
        jsonb_build_object(
          'customer_name', OLD.customer_name,
          'customer_phone', OLD.customer_phone,
          'table_number', OLD.table_number,
          'status', OLD.status,
          'total_amount', OLD.total_amount,
          'commission_amount', OLD.commission_amount,
          'order_notes', OLD.order_notes
        ),
        jsonb_build_object(
          'customer_name', NEW.customer_name,
          'customer_phone', NEW.customer_phone,
          'table_number', NEW.table_number,
          'status', NEW.status,
          'total_amount', NEW.total_amount,
          'commission_amount', NEW.commission_amount,
          'order_notes', NEW.order_notes
        ),
        changed_fields_array,
        NEW.status
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.order_audit_log (
      order_id,
      user_id,
      user_role,
      action,
      old_values,
      new_values,
      changed_fields,
      order_status
    ) VALUES (
      OLD.id,
      auth.uid(),
      user_role_val,
      'delete',
      jsonb_build_object(
        'customer_name', OLD.customer_name,
        'customer_phone', OLD.customer_phone,
        'table_number', OLD.table_number,
        'status', OLD.status,
        'total_amount', OLD.total_amount,
        'commission_amount', OLD.commission_amount,
        'order_notes', OLD.order_notes
      ),
      NULL,
      ARRAY['deleted'],
      OLD.status
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order modifications
DROP TRIGGER IF EXISTS audit_order_modifications ON public.orders;
CREATE TRIGGER audit_order_modifications
  AFTER UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_modification();

-- ============================================================================
-- UPDATE RLS POLICIES FOR WAITER ORDER EDITING
-- ============================================================================

-- Drop existing waiter update policies to recreate with new logic
DROP POLICY IF EXISTS "Waiters can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Waiters can edit unpaid orders" ON public.orders;

-- Create new policy allowing waiters to edit unpaid orders
CREATE POLICY "Waiters can edit unpaid orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    -- Waiter must be authenticated and have waiter role
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data ->> 'role' = 'waiter'
    )
    AND
    -- Order must belong to this waiter
    auth.uid() = waiter_id
    AND
    -- Order must be in an editable status (unpaid)
    status IN ('pending', 'pending_payment', 'in_preparation')
  )
  WITH CHECK (
    -- Same conditions for the updated values
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data ->> 'role' = 'waiter'
    )
    AND
    auth.uid() = waiter_id
    AND
    -- Ensure status remains in editable states or progresses appropriately
    status IN ('pending', 'pending_payment', 'in_preparation', 'ready', 'completed')
  );

-- Update order_items policies to allow waiters to modify items in unpaid orders
-- Drop all existing UPDATE and DELETE policies to avoid conflicts
-- Note: We keep the existing INSERT policies (Public/Authenticated can insert) 
-- because customers need to create orders via QR code
DROP POLICY IF EXISTS "Anyone can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can delete order_items" ON public.order_items;
DROP POLICY IF EXISTS "Waiters can update order items for unpaid orders" ON public.order_items;
DROP POLICY IF EXISTS "Waiters can delete order items from unpaid orders" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can delete order items" ON public.order_items;

-- Allow waiters to update order items for their unpaid orders
CREATE POLICY "Waiters can update order items for unpaid orders"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE o.id = order_items.order_id
      AND o.waiter_id = auth.uid()
      AND u.raw_app_meta_data ->> 'role' = 'waiter'
      AND o.status IN ('pending', 'pending_payment', 'in_preparation')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE o.id = order_items.order_id
      AND o.waiter_id = auth.uid()
      AND u.raw_app_meta_data ->> 'role' = 'waiter'
      AND o.status IN ('pending', 'pending_payment', 'in_preparation')
    )
  );

-- Allow waiters to delete order items from their unpaid orders
CREATE POLICY "Waiters can delete order items from unpaid orders"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE o.id = order_items.order_id
      AND o.waiter_id = auth.uid()
      AND u.raw_app_meta_data ->> 'role' = 'waiter'
      AND o.status IN ('pending', 'pending_payment', 'in_preparation')
    )
  );

-- Allow staff (admin, cashier, kitchen) to update order items
CREATE POLICY "Staff can update order items"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data ->> 'role' IN ('admin', 'cashier', 'kitchen')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data ->> 'role' IN ('admin', 'cashier', 'kitchen')
    )
  );

-- Allow staff to delete order items
CREATE POLICY "Staff can delete order items"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data ->> 'role' IN ('admin', 'cashier', 'kitchen')
    )
  );

-- ============================================================================
-- CREATE HELPER FUNCTION TO CHECK ORDER EDITABILITY
-- ============================================================================

-- Function to check if an order can be edited by the current user
CREATE OR REPLACE FUNCTION public.can_edit_order(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  order_record RECORD;
  user_role TEXT;
BEGIN
  -- Get user role
  SELECT raw_app_meta_data ->> 'role' INTO user_role
  FROM auth.users
  WHERE id = auth.uid();

  -- Get order details
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = order_id_param;

  -- If order doesn't exist, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Admins can edit any order
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Waiters can edit their own unpaid orders
  IF user_role = 'waiter' THEN
    RETURN (
      order_record.waiter_id = auth.uid() AND
      order_record.status IN ('pending', 'pending_payment', 'in_preparation')
    );
  END IF;

  -- Kitchen and cashier staff can update order status but not edit items
  IF user_role IN ('kitchen', 'cashier') THEN
    RETURN TRUE;
  END IF;

  -- Default: not editable
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.can_edit_order(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.can_edit_order IS 'Checks if the current user can edit the specified order based on role and order status';

-- ============================================================================
-- CREATE VIEW FOR EDITABLE ORDERS
-- ============================================================================

-- Create view to show which orders are editable by the current user
CREATE OR REPLACE VIEW public.editable_orders AS
SELECT 
  o.*,
  public.can_edit_order(o.id) as is_editable,
  CASE 
    WHEN o.status IN ('pending', 'pending_payment', 'in_preparation') THEN true
    ELSE false
  END as is_unpaid
FROM public.orders o;

-- Grant access to the view
GRANT SELECT ON public.editable_orders TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.editable_orders SET (security_invoker = true);

-- Add comment for documentation
COMMENT ON VIEW public.editable_orders IS 'Shows orders with editability status for the current user';

-- ============================================================================
-- TESTING QUERIES (commented out - for manual testing)
-- ============================================================================

/*
-- Test 1: Verify audit log table exists and is empty
SELECT COUNT(*) FROM public.order_audit_log;

-- Test 2: Check if can_edit_order function works
-- (Replace with actual order ID and run as different users)
SELECT public.can_edit_order('00000000-0000-0000-0000-000000000000');

-- Test 3: View editable orders for current user
SELECT id, order_number, status, waiter_id, is_editable, is_unpaid 
FROM public.editable_orders 
WHERE waiter_id = auth.uid()
LIMIT 10;

-- Test 4: Try to update an unpaid order as a waiter
-- (This should succeed if the waiter owns the order and it's unpaid)
UPDATE public.orders 
SET order_notes = 'Test modification'
WHERE id = '00000000-0000-0000-0000-000000000000'
AND waiter_id = auth.uid()
AND status IN ('pending', 'pending_payment', 'in_preparation');

-- Test 5: Verify audit log captured the change
SELECT * FROM public.order_audit_log 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 6: Try to update a paid order as a waiter (should fail)
UPDATE public.orders 
SET order_notes = 'This should fail'
WHERE id = '00000000-0000-0000-0000-000000000000'
AND waiter_id = auth.uid()
AND status = 'completed';

-- Test 7: Try to update another waiter's order (should fail)
UPDATE public.orders 
SET order_notes = 'This should also fail'
WHERE id = '00000000-0000-0000-0000-000000000000'
AND waiter_id != auth.uid();
*/
