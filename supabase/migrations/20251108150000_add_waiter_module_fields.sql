-- Add waiter_id and commission_amount to orders table
ALTER TABLE public.orders
ADD COLUMN waiter_id uuid REFERENCES auth.users(id),
ADD COLUMN commission_amount numeric;

-- Create RLS policy for waiters to view their own orders
CREATE POLICY "Waiters can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = waiter_id
);

-- Create RLS policy for waiters to insert orders
CREATE POLICY "Waiters can insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = waiter_id
);

-- Create a function to calculate and store the 10% commission
CREATE OR REPLACE FUNCTION public.calculate_waiter_commission()
RETURNS TRIGGER AS $$
DECLARE
    order_total numeric;
BEGIN
    -- Only run if waiter_id is set
    IF NEW.waiter_id IS NOT NULL THEN
        -- Assuming 'total_amount' is the column with the order total
        -- If 'total_amount' is not the correct column, this needs adjustment
        order_total := NEW.total_amount; 
        
        -- Calculate 10% commission
        NEW.commission_amount := order_total * 0.10;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the commission calculation before insert or update
CREATE TRIGGER calculate_waiter_commission_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_waiter_commission();

-- Update the staff accounts migration to include a sample waiter
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  updated_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'waiter@cocoloko.com.br',
  crypt('waiter123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "waiter"}',
  '{"role": "waiter", "full_name": "Sample Waiter"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create identity for the new waiter
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email = 'waiter@cocoloko.com.br'
ON CONFLICT (provider, user_id) DO NOTHING;
