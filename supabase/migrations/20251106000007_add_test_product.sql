-- Add a cheap test product for easy testing
INSERT INTO public.menu_items (category_id, name, description, price, image_url) VALUES
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Teste - Água (R$ 0,50)', 'Produto para teste do sistema - valor baixo', 0.50, 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&h=300&fit=crop&crop=center')
ON CONFLICT DO NOTHING;