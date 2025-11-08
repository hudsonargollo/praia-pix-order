-- Run this SQL in your Supabase SQL Editor to add images to menu items

-- Bebidas (Drinks)
UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&h=300&fit=crop&crop=center'
WHERE name = 'Água sem gás';

UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&h=300&fit=crop&crop=center'
WHERE name = 'Água com gás';

UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%Refrigerante%' OR name LIKE '%Coca-Cola%';

UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=300&fit=crop&crop=center'
WHERE name = 'Red Bull';

UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1605027990121-3b2c6c8cb5fb?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%côco%';

-- Salgados (Snacks)
UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%Coxinha%';

UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%Quibe%';

UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%Bolinho%';

UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%Pastel%';

-- Petiscos e Tábuas (Appetizers)
UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%Tábua%';

UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%Batata%';

-- Espetinhos (Skewers)
UPDATE public.menu_items 
SET image_url = 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=300&fit=crop&crop=center'
WHERE name LIKE '%Espetinho%';

-- Verify the updates
SELECT name, image_url FROM public.menu_items WHERE image_url IS NOT NULL;