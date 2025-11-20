-- Add fields to track cashier-created orders
-- Similar to waiter orders, but for admin/cashier panel

-- Add created_by_cashier boolean flag
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_by_cashier BOOLEAN DEFAULT FALSE;

-- Add cashier_id to track which cashier created the order
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.created_by_cashier IS 'Flag to distinguish orders created by cashier/admin vs customer self-service or waiter';
COMMENT ON COLUMN public.orders.cashier_id IS 'ID of the cashier/admin who created the order';

-- Create index on created_by_cashier for efficient filtering
CREATE INDEX IF NOT EXISTS idx_orders_created_by_cashier 
ON public.orders(created_by_cashier) 
WHERE created_by_cashier = true;

-- Create index on cashier_id for efficient cashier reporting
CREATE INDEX IF NOT EXISTS idx_orders_cashier_id 
ON public.orders(cashier_id) 
WHERE cashier_id IS NOT NULL;

-- Update RLS policies to allow cashiers to view their orders
-- Cashiers can view all orders (they already have this permission as admin)
-- But we add a specific policy for clarity

-- Allow cashiers to insert orders with their cashier_id
CREATE POLICY IF NOT EXISTS "Cashiers can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' = 'admin' 
        OR raw_user_meta_data->>'role' = 'cashier'
      )
    ) AND created_by_cashier = true
  );

-- Allow cashiers to update their own orders
CREATE POLICY IF NOT EXISTS "Cashiers can update their orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = cashier_id AND created_by_cashier = true
  )
  WITH CHECK (
    auth.uid() = cashier_id AND created_by_cashier = true
  );
