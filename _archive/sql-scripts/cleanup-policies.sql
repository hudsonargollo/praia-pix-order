-- Clean up duplicate and problematic policies
-- Run this in Supabase SQL Editor

-- Drop the problematic "ALL" policies that might cause recursion
DROP POLICY IF EXISTS "Authenticated can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can manage categories" ON public.menu_categories;

-- Drop the sort_order policy that references profiles table
DROP POLICY IF EXISTS "Admins can update menu items sort order" ON public.menu_items;

-- Drop duplicate view policies (keep only one)
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can view menu categories" ON public.menu_categories;

-- Verify the cleanup
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('menu_items', 'menu_categories')
ORDER BY tablename, policyname;
