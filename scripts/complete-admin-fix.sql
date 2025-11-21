-- Complete fix for admin menu editing permissions
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql

-- Step 1: Ensure get_user_role function exists and is correct
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Try to get role from profiles table first
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- If not found in profiles, try user metadata as fallback
  IF user_role IS NULL THEN
    SELECT 
      COALESCE(
        raw_user_meta_data->>'role',
        raw_app_meta_data->>'role',
        'customer'
      ) INTO user_role
    FROM auth.users
    WHERE id = user_id;
  END IF;
  
  -- Default to customer if no role found
  RETURN COALESCE(user_role, 'customer');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;

-- Step 2: Drop ALL existing policies on menu_items and menu_categories
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on menu_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_items' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.menu_items';
    END LOOP;
    
    -- Drop all policies on menu_categories
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_categories' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.menu_categories';
    END LOOP;
END $$;

-- Step 3: Create new policies for menu_categories
-- Everyone can read categories
CREATE POLICY "Anyone can view menu categories"
  ON public.menu_categories FOR SELECT
  TO public
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert menu categories"
  ON public.menu_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Only admins can update
CREATE POLICY "Admins can update menu categories"
  ON public.menu_categories FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Only admins can delete
CREATE POLICY "Admins can delete menu categories"
  ON public.menu_categories FOR DELETE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Step 4: Create new policies for menu_items
-- Everyone can read available items
CREATE POLICY "Anyone can view menu items"
  ON public.menu_items FOR SELECT
  TO public
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Only admins can update
CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Only admins can delete
CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Step 5: Verify the setup
SELECT 'Function check:' as step, routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'get_user_role'
UNION ALL
SELECT 'Your role:' as step, 
  auth.uid()::text as routine_name,
  public.get_user_role(auth.uid()) as security_type
UNION ALL
SELECT 'Policies created:' as step,
  tablename as routine_name,
  COUNT(*)::text as security_type
FROM pg_policies
WHERE tablename IN ('menu_items', 'menu_categories')
GROUP BY tablename;
