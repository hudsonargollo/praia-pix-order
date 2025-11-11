-- Fix RLS policies for product images and menu items
-- This allows admins to upload images and edit products

-- ============================================================================
-- STORAGE BUCKET POLICIES (for product images)
-- ============================================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Allow admins to upload images to product-images bucket
CREATE POLICY "Admin can upload product images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    (public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated')
  );

-- Allow admins to update images
CREATE POLICY "Admin can update product images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'product-images' AND
    (public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated')
  );

-- Allow admins to delete images
CREATE POLICY "Admin can delete product images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    (public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated')
  );

-- Allow public to view images
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- ============================================================================
-- STORAGE BUCKET POLICIES (for bucket management)
-- ============================================================================

-- Enable RLS on storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Public can view buckets" ON storage.buckets;

-- Allow admins to manage buckets
CREATE POLICY "Admin can manage buckets" ON storage.buckets
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated'
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated'
  );

-- Allow public to view buckets
CREATE POLICY "Public can view buckets" ON storage.buckets
  FOR SELECT
  USING (true);

-- ============================================================================
-- MENU_ITEMS POLICIES - Ensure admin can update
-- ============================================================================

-- Drop and recreate the admin policy to ensure it works
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;

CREATE POLICY "Admins can manage menu items" ON public.menu_items
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    auth.role() = 'authenticated'
  );

-- Also ensure public can view menu items
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;

CREATE POLICY "Public can view menu items" ON public.menu_items
  FOR SELECT
  USING (available = true OR public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies are created
DO $$
BEGIN
  RAISE NOTICE 'Storage and menu_items RLS policies updated successfully';
END $$;

-- Show storage.objects policies
SELECT 
  'storage.objects' as table_name,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd;

-- Show storage.buckets policies
SELECT 
  'storage.buckets' as table_name,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'buckets'
ORDER BY cmd;

-- Show menu_items policies
SELECT 
  'menu_items' as table_name,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'menu_items'
ORDER BY cmd;
