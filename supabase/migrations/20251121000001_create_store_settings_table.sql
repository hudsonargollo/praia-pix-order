-- Create store_settings table to manage store open/close status
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default row (store is open by default)
INSERT INTO store_settings (is_open) VALUES (true);

-- Create function to get store status
CREATE OR REPLACE FUNCTION get_store_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  store_open BOOLEAN;
BEGIN
  SELECT is_open INTO store_open FROM store_settings LIMIT 1;
  RETURN COALESCE(store_open, true);
END;
$$;

-- Create function to update store status (admin/cashier only)
CREATE OR REPLACE FUNCTION update_store_status(new_status BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role using auth.uid()
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Only admin and cashier can update store status
  IF user_role NOT IN ('admin', 'cashier') THEN
    RAISE EXCEPTION 'Unauthorized: Only admin and cashier can update store status';
  END IF;
  
  -- Update store status
  UPDATE store_settings 
  SET is_open = new_status, 
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE id = (SELECT id FROM store_settings LIMIT 1);
  
  RETURN new_status;
END;
$$;

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read store status
CREATE POLICY "Anyone can read store status"
  ON store_settings
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users with admin/cashier role can update
CREATE POLICY "Admin and cashier can update store status"
  ON store_settings
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'cashier')
  );

-- Add comment
COMMENT ON TABLE store_settings IS 'Stores global settings like whether the store is open for orders';
COMMENT ON FUNCTION get_store_status() IS 'Returns whether the store is currently accepting orders';
COMMENT ON FUNCTION update_store_status(BOOLEAN) IS 'Updates store open/closed status (admin/cashier only)';
