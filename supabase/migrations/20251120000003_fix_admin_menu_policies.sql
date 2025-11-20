-- Fix admin menu policies to use user_metadata instead of user_roles table
-- The system stores roles in auth.users.raw_user_meta_data->>'role'

-- Drop old policies that reference non-existent user_roles table
DROP POLICY IF EXISTS "Admins can insert menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can update menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can delete menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;

-- Create new policies using user_metadata
-- Admin can manage menu categories
CREATE POLICY "Admins can insert menu categories"
  ON public.menu_categories FOR INSERT
  TO authenticated
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
  );

CREATE POLICY "Admins can delete menu categories"
  ON public.menu_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin can manage menu items
CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

