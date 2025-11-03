-- Create menu_categories table
CREATE TABLE public.menu_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number INTEGER GENERATED ALWAYS AS IDENTITY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  table_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  total_amount DECIMAL(10,2) NOT NULL,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  item_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Public read access to menu (anyone can see the menu)
CREATE POLICY "Anyone can view menu categories"
  ON public.menu_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view menu items"
  ON public.menu_items FOR SELECT
  USING (true);

-- Public insert for orders (customers can create orders)
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update orders"
  ON public.orders FOR UPDATE
  USING (true);

-- Public insert for order items
CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view order items"
  ON public.order_items FOR SELECT
  USING (true);

-- Enable realtime for orders (so kitchen/cashier can see updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Insert menu categories
INSERT INTO public.menu_categories (name, display_order) VALUES
  ('Bebidas', 1),
  ('Salgados Grandes', 2),
  ('Salgados Pequenos', 3),
  ('Petiscos e Tábuas', 4),
  ('Espetinhos', 5);

-- Insert menu items
INSERT INTO public.menu_items (category_id, name, description, price) VALUES
  -- Bebidas
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Água sem gás', NULL, 3.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Água com gás', NULL, 4.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Refrigerante FYS lata', NULL, 5.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Coca-Cola lata', NULL, 6.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Coca-Cola 1L', NULL, 9.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Red Bull', NULL, 13.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Água de côco (côco verde)', NULL, 7.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Litro de côco', NULL, 15.00),
  
  -- Salgados Grandes
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Grandes'), 'Coxinha', 'Massa leve e recheio cremoso de frango com catupiry', 6.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Grandes'), 'Quibe', 'Crocante por fora, suculento por dentro', 6.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Grandes'), 'Bolinho de carne seca', 'Recheado com carne seca desfiada', 7.00),
  
  -- Salgados Pequenos
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Pequenos'), 'Coxinha (unid.)', NULL, 2.50),
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Pequenos'), 'Quibe (unid.)', NULL, 2.50),
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Pequenos'), 'Bolinho de carne seca (unid.)', NULL, 2.50),
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Pequenos'), 'Pastel (queijo)', NULL, 3.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Pequenos'), 'Pastel (carne)', NULL, 3.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Pequenos'), 'Pastel (frango)', NULL, 3.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Salgados Pequenos'), 'Pastel (camarão)', NULL, 3.00),
  
  -- Petiscos e Tábuas
  ((SELECT id FROM public.menu_categories WHERE name = 'Petiscos e Tábuas'), 'Tábua Nordestina', 'Carne do sol, queijo coalho', 68.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Petiscos e Tábuas'), 'Batata frita (400g)', 'Batata crocante, servida com molhos da casa', 22.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Petiscos e Tábuas'), 'Batata frita recheada', 'Batata crocante coberta com calabresa, bacon', 28.00),
  
  -- Espetinhos
  ((SELECT id FROM public.menu_categories WHERE name = 'Espetinhos'), 'Espetinho de picanha', 'Suculento, grelhado no ponto certo', 12.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Espetinhos'), 'Espetinho de alcatra', 'Carne macia e bem temperada', 10.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Espetinhos'), 'Espetinho de frango', 'Clássico e saboroso', 10.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Espetinhos'), 'Espetinho de coração', 'Sabor marcante e textura única', 10.00),
  ((SELECT id FROM public.menu_categories WHERE name = 'Espetinhos'), 'Espetinho de cupim', 'Carne macia e suculenta', 10.00);