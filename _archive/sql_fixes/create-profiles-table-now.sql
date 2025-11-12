-- Quick setup: Create profiles table and migrate existing users
-- Run this in Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 5. Migrate existing users
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

-- 6. Set admin role for admin user
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@cocoloko.com'
);

-- 7. Verify setup
SELECT 
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY p.role, u.email;
