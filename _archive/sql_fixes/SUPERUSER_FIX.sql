-- Complete fix for all admin issues (as superuser)
-- Run this in Supabase Dashboard SQL Editor

-- ============================================================================
-- PART 1: STORAGE POLICIES (for product images)
-- ============================================================================

-- Drop existing policies on storage.objects
DROP POLICY IF EXISTS "Authenticated can manage storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder" ON storage.objects;

-- Create new policies for storage.objects
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update files" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete files" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view files" ON storage.objects
  FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- PART 2: STORAGE BUCKETS
-- ============================================================================

-- Drop existing policies on storage.buckets
DROP POLICY IF EXISTS "Authenticated can manage buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Public can view buckets" ON storage.buckets;

-- Create policies for storage.buckets
CREATE POLICY "Authenticated users can manage buckets" ON storage.buckets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view buckets" ON storage.buckets
  FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- PART 3: MENU_ITEMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;

-- Authenticated users can do everything
CREATE POLICY "Authenticated can manage menu items" ON public.menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can view available items
CREATE POLICY "Public can view menu items" ON public.menu_items
  FOR SELECT
  TO public
  USING (available = true);

-- ============================================================================
-- PART 4: MENU_CATEGORIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Authenticated can manage categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.menu_categories;

-- Authenticated users can manage
CREATE POLICY "Authenticated can manage categories" ON public.menu_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can view
CREATE POLICY "Public can view categories" ON public.menu_categories
  FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- PART 5: PROFILES TABLE (for waiter management)
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
    RAISE NOTICE 'Created profiles table';
  ELSE
    RAISE NOTICE 'Profiles table already exists';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can update profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Authenticated can view all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert profiles" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update profiles" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete profiles" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL RLS POLICIES UPDATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Storage (objects): Authenticated users can manage';
  RAISE NOTICE '📦 Storage (buckets): Authenticated users can manage';
  RAISE NOTICE '🍽️  Menu items: Authenticated users can manage';
  RAISE NOTICE '📂 Menu categories: Authenticated users can manage';
  RAISE NOTICE '👥 Profiles: Authenticated users can view/manage';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Logout and login again to refresh permissions!';
  RAISE NOTICE '';
END $$;

-- Show all policies
SELECT 
  CASE 
    WHEN schemaname = 'storage' THEN 'storage.' || tablename
    ELSE tablename
  END as table_name,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE (schemaname = 'storage' AND tablename IN ('objects', 'buckets'))
   OR (schemaname = 'public' AND tablename IN ('menu_items', 'profiles', 'menu_categories'))
ORDER BY schemaname, tablename, cmd;
