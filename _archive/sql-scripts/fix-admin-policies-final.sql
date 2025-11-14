-- Fix admin policies to use user_roles table consistently
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies on menu_items and menu_categories
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items sort order" ON public.menu_items;

DROP POLICY IF EXISTS "Anyone can view menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can manage menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can insert menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can update menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can delete menu categories" ON public.menu_categories;

-- Create simple, non-recursive policies using user_roles table

-- PUBLIC READ ACCESS (anyone can view menu)
CREATE POLICY "Public can view menu items"
  ON public.menu_items FOR SELECT
  USING (true);

CREATE POLICY "Public can view menu categories"
  ON public.menu_categories FOR SELECT
  USING (true);

-- ADMIN WRITE ACCESS (using user_roles table)
CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert menu categories"
  ON public.menu_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update menu categories"
  ON public.menu_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete menu categories"
  ON public.menu_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Verify policies were created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('menu_items', 'menu_categories')
ORDER BY tablename, policyname;
