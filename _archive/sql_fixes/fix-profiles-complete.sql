-- Complete fix for profiles table RLS and policies
-- Run this in Supabase SQL Editor

-- 1. Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. Create comprehensive policies
-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow system to insert profiles (for new user creation)
CREATE POLICY "System can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins to do everything
CREATE POLICY "Admins have full access"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Verify admin profile exists and has correct role
SELECT 
  u.id,
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';

-- 4. If admin profile doesn't exist or role is wrong, fix it
INSERT INTO public.profiles (id, role, full_name, updated_at)
SELECT 
  id,
  'admin',
  COALESCE(raw_user_meta_data->>'full_name', 'Administrator'),
  NOW()
FROM auth.users
WHERE email = 'admin@cocoloko.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 5. Final verification
SELECT 
  u.id,
  u.email,
  p.role,
  p.full_name,
  p.created_at,
  p.updated_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';
