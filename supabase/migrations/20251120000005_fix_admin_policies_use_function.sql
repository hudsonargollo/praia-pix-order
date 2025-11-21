-- Fix admin menu policies to use get_user_role function instead of querying auth.users directly
-- This avoids permission issues since the function has SECURITY DEFINER

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can update menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can delete menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;

-- Create new policies using get_user_role function
-- This function has SECURITY DEFINER so it can access auth.users

-- Menu Categories Policies
CREATE POLICY "Admins can insert menu categories"
  ON public.menu_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update menu categories"
  ON public.menu_categories FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete menu categories"
  ON public.menu_categories FOR DELETE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Menu Items Policies
CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Add comments
COMMENT ON POLICY "Admins can update menu items" ON public.menu_items IS 
  'Allows admin users to update menu items. Uses get_user_role function with SECURITY DEFINER to check role.';

COMMENT ON POLICY "Admins can update menu categories" ON public.menu_categories IS 
  'Allows admin users to update menu categories. Uses get_user_role function with SECURITY DEFINER to check role.';
