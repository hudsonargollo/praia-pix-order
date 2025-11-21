-- Fix permission denied error for auth.users table in RLS policies
-- The RLS policies need to read user metadata from auth.users
-- Grant minimal SELECT permission on specific columns only

-- Grant SELECT on specific columns of auth.users to authenticated users
-- This allows RLS policies to check user roles
GRANT SELECT (id, raw_user_meta_data, raw_app_meta_data) ON auth.users TO authenticated;

-- Also need to add WITH CHECK clause to UPDATE policies
-- Drop and recreate the UPDATE policies with both USING and WITH CHECK
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu categories" ON public.menu_categories;

CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update menu categories"
  ON public.menu_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE auth.users IS 
  'Core authentication table. Limited SELECT access granted to authenticated users for role checking in RLS policies.';
