-- 🧪 Add Test Product for Easy Testing
-- Run this in your Supabase SQL Editor to add a cheap test product

INSERT INTO public.menu_items (category_id, name, description, price, image_url) VALUES
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Teste - Água (R$ 0,50)', 'Produto para teste do sistema - valor baixo', 0.10, 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&h=300&fit=crop&crop=center')
ON CONFLICT DO NOTHING;

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