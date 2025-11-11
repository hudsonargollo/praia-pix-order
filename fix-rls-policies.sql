-- Fix RLS policies to allow users to read their own profiles
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate policies with correct logic
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify admin user has profile
SELECT 
  u.id,
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';
