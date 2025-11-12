-- ============================================
-- Diagnostic Script for Products Issue
-- ============================================
-- Run this in Supabase SQL Editor to diagnose why products aren't showing

-- 1. Check if menu_categories table exists and has data
SELECT 
  'Categories Check' as check_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE display_order IS NOT NULL) as with_display_order
FROM menu_categories;

-- 2. List all categories
SELECT 
  id,
  name,
  display_order,
  created_at
FROM menu_categories
ORDER BY display_order;

-- 3. Check if menu_items table exists and has data
SELECT 
  'Menu Items Check' as check_type,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE available = true) as available_items,
  COUNT(*) FILTER (WHERE available = false) as unavailable_items,
  COUNT(*) FILTER (WHERE image_url IS NOT NULL) as items_with_images
FROM menu_items;

-- 4. List all menu items with their categories
SELECT 
  mi.id,
  mi.name,
  mi.description,
  mi.price,
  mi.available,
  mi.image_url IS NOT NULL as has_image,
  mc.name as category_name,
  mc.display_order as category_order
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
ORDER BY mc.display_order, mi.name;

-- 5. Check RLS policies on menu_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('menu_items', 'menu_categories');

-- 6. Check if storage bucket exists for product images
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE name = 'product-images';

-- 7. Count items by category
SELECT 
  mc.name as category,
  COUNT(mi.id) as total_items,
  COUNT(mi.id) FILTER (WHERE mi.available = true) as available_items,
  AVG(mi.price) as avg_price
FROM menu_categories mc
LEFT JOIN menu_items mi ON mc.id = mi.category_id
GROUP BY mc.id, mc.name, mc.display_order
ORDER BY mc.display_order;

-- 8. Check for orphaned items (items without valid category)
SELECT 
  mi.id,
  mi.name,
  mi.category_id,
  'Orphaned - category not found' as issue
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.id IS NULL;

-- Summary
DO $$
DECLARE
  cat_count INTEGER;
  item_count INTEGER;
  available_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM menu_categories;
  SELECT COUNT(*) INTO item_count FROM menu_items;
  SELECT COUNT(*) INTO available_count FROM menu_items WHERE available = true;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRODUCTS DIAGNOSTIC SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Categories: %', cat_count;
  RAISE NOTICE 'Total Menu Items: %', item_count;
  RAISE NOTICE 'Available Items: %', available_count;
  RAISE NOTICE '========================================';
  
  IF cat_count = 0 THEN
    RAISE NOTICE '⚠️  NO CATEGORIES FOUND - Create categories first!';
  END IF;
  
  IF item_count = 0 THEN
    RAISE NOTICE '⚠️  NO MENU ITEMS FOUND - Add products!';
  ELSIF available_count = 0 THEN
    RAISE NOTICE '⚠️  NO AVAILABLE ITEMS - Mark items as available!';
  ELSE
    RAISE NOTICE '✅ Products exist and are available';
  END IF;
END $$;
