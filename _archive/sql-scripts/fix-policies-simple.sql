-- Simple fix: Just drop the problematic policies and recreate them
-- Run this in Supabase SQL Editor

-- First, let's see what policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('menu_items', 'menu_categories');

-- Drop only the problematic ones that reference profiles
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can manage menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can update menu items sort order" ON public.menu_items;

-- Now verify what's left
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('menu_items', 'menu_categories')
ORDER BY tablename, policyname;
