-- 🧪 Add Test Product for Easy Testing (FIXED VERSION)
-- Run this in your Supabase SQL Editor to add a cheap test product

-- First, let's check if we have duplicate categories
SELECT name, COUNT(*) as count 
FROM public.menu_categories 
WHERE name = 'Bebidas' 
GROUP BY name;

-- Add the test product using a safer approach
INSERT INTO public.menu_items (category_id, name, description, price, image_url) 
SELECT 
  id,
  'Teste - Água (R$ 0,10)',
  'Produto para teste do sistema - valor baixo',
  0.10,
  'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&h=300&fit=crop&crop=center'
FROM public.menu_categories 
WHERE name = 'Bebidas' 
LIMIT 1;

-- Verify the test product was added
SELECT 
  c.name as category,
  m.name as product_name,
  m.price,
  m.available
FROM public.menu_items m
JOIN public.menu_categories c ON m.category_id = c.id
WHERE m.name LIKE '%Teste%'
ORDER BY m.price;