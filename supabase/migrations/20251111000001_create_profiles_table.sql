-- Create profiles table for user roles and metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing users to profiles table
INSERT INTO public.profiles (id, role, full_name)
SELECT 
  id,
  COALESCE(
    raw_user_meta_data->>'role',
    raw_app_meta_data->>'role',
    'customer'
  ) as role,
  COALESCE(
    raw_user_meta_data->>'full_name',
    email
  ) as full_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Ensure admin user has admin role
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@cocoloko.com'
);

-- Comment on table
COMMENT ON TABLE public.profiles IS 'User profiles with roles and metadata';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, waiter, kitchen, cashier, or customer';
