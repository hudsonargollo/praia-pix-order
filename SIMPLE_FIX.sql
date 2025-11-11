-- Simplified fix that doesn't require superuser permissions
-- This focuses on menu_items and profiles tables only

-- ============================================================================
-- PART 1: MENU_ITEMS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;

-- Allow authenticated users to manage menu items
CREATE POLICY "Authenticated can manage menu items" ON public.menu_items
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow public to view available items
CREATE POLICY "Public can view menu items" ON public.menu_items
  FOR SELECT
  USING (available = true OR auth.role() = 'authenticated');

-- ============================================================================
-- PART 2: MENU_CATEGORIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Authenticated can manage categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.menu_categories;

-- Allow authenticated to manage
CREATE POLICY "Authenticated can manage categories" ON public.menu_categories
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow public to view
CREATE POLICY "Public can view categories" ON public.menu_categories
  FOR SELECT
  USING (true);

-- ============================================================================
-- PART 3: PROFILES TABLE (for waiter management)
-- ============================================================================

-- Ensure profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE public.profiles (
      id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email text,
      full_name text,
      role text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can delete profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to view all profiles
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert profiles
CREATE POLICY "Authenticated can insert profiles" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete profiles
CREATE POLICY "Authenticated can delete profiles" ON public.profiles
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully!';
  RAISE NOTICE '🍽️  Menu items: Authenticated users can manage';
  RAISE NOTICE '📂 Categories: Authenticated users can manage';
  RAISE NOTICE '👥 Profiles: Authenticated users can view/manage';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: Storage bucket policies need to be set in Supabase Dashboard';
  RAISE NOTICE '   Go to Storage → Policies to allow authenticated users to upload';
END $$;

-- Show policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('menu_items', 'profiles', 'menu_categories')
ORDER BY tablename, cmd;
