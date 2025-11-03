-- Create role enum for staff access control
CREATE TYPE public.app_role AS ENUM ('admin', 'kitchen', 'cashier');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Drop existing overly permissive policies on orders
DROP POLICY IF EXISTS "Anyone can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

-- New RLS policies for orders table
-- Keep order creation public (walk-up customers)
-- SELECT: Allow public access for now (customers need to see their orders)
-- TODO: Implement order verification codes for better security
CREATE POLICY "Public can view orders" ON public.orders
  FOR SELECT USING (true);

-- Only staff can update orders
CREATE POLICY "Kitchen can mark orders ready" ON public.orders
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'kitchen') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Cashiers can confirm payments" ON public.orders
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'cashier') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Update order_items policies
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

CREATE POLICY "Public can view order items" ON public.order_items
  FOR SELECT USING (true);

-- Add explicit admin policies for menu management
CREATE POLICY "Admins can manage menu items" ON public.menu_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage menu categories" ON public.menu_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));