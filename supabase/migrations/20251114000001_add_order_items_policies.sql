-- Add missing UPDATE and DELETE policies for order_items table
-- This allows waiters and staff to edit order items

-- Allow anyone to update order items (needed for editing orders)
CREATE POLICY "Anyone can update order items"
  ON public.order_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete order items (needed for editing orders)
CREATE POLICY "Anyone can delete order items"
  ON public.order_items FOR DELETE
  USING (true);

-- Note: In production, these policies should be restricted to authenticated users
-- with appropriate roles (waiters, cashiers, admins). For now, we're using
-- permissive policies to match the existing pattern in the codebase.
