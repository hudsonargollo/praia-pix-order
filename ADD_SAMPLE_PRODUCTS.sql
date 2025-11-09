-- ============================================
-- Add Sample Products Script
-- ============================================
-- Run this if you have no products in your database
-- This will create sample categories and menu items

-- First, let's create categories
INSERT INTO menu_categories (name, display_order)
VALUES 
  ('Açaí', 1),
  ('Bebidas', 2),
  ('Complementos', 3)
ON CONFLICT DO NOTHING;

-- Get category IDs
DO $$
DECLARE
  acai_cat_id UUID;
  bebidas_cat_id UUID;
  complementos_cat_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO acai_cat_id FROM menu_categories WHERE name = 'Açaí' LIMIT 1;
  SELECT id INTO bebidas_cat_id FROM menu_categories WHERE name = 'Bebidas' LIMIT 1;
  SELECT id INTO complementos_cat_id FROM menu_categories WHERE name = 'Complementos' LIMIT 1;

  -- Insert Açaí products
  INSERT INTO menu_items (name, description, price, category_id, available)
  VALUES
    ('Açaí 300ml', 'Açaí tradicional com granola e banana', 18.00, acai_cat_id, true),
    ('Açaí 500ml', 'Açaí tradicional com granola, banana e mel', 25.00, acai_cat_id, true),
    ('Açaí 700ml', 'Açaí tradicional com granola, banana, mel e frutas', 32.00, acai_cat_id, true),
    ('Açaí Premium 500ml', 'Açaí com granola, frutas variadas, leite condensado e chocolate', 35.00, acai_cat_id, true)
  ON CONFLICT DO NOTHING;

  -- Insert Bebidas products
  INSERT INTO menu_items (name, description, price, category_id, available)
  VALUES
    ('Água Mineral 500ml', 'Água mineral gelada', 3.00, bebidas_cat_id, true),
    ('Refrigerante Lata', 'Coca-Cola, Guaraná ou Sprite', 5.00, bebidas_cat_id, true),
    ('Suco Natural 300ml', 'Laranja, limão ou maracujá', 8.00, bebidas_cat_id, true),
    ('Água de Coco', 'Água de coco natural gelada', 7.00, bebidas_cat_id, true)
  ON CONFLICT DO NOTHING;

  -- Insert Complementos products
  INSERT INTO menu_items (name, description, price, category_id, available)
  VALUES
    ('Granola Extra', 'Porção adicional de granola', 3.00, complementos_cat_id, true),
    ('Frutas Extras', 'Morango, banana ou kiwi', 5.00, complementos_cat_id, true),
    ('Leite em Pó', 'Leite em pó Ninho', 4.00, complementos_cat_id, true),
    ('Paçoca', 'Paçoca triturada', 3.00, complementos_cat_id, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Sample products added successfully!';
  RAISE NOTICE 'Categories created: Açaí, Bebidas, Complementos';
  RAISE NOTICE 'Total products added: 16';
END $$;

-- Verify the products were added
SELECT 
  mc.name as category,
  COUNT(mi.id) as items_added,
  STRING_AGG(mi.name, ', ' ORDER BY mi.price) as products
FROM menu_categories mc
LEFT JOIN menu_items mi ON mc.id = mi.category_id
GROUP BY mc.id, mc.name, mc.display_order
ORDER BY mc.display_order;

-- Show summary
SELECT 
  'Summary' as info,
  (SELECT COUNT(*) FROM menu_categories) as total_categories,
  (SELECT COUNT(*) FROM menu_items) as total_products,
  (SELECT COUNT(*) FROM menu_items WHERE available = true) as available_products;
