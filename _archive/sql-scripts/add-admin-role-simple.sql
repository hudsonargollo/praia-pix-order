-- Simple script to add admin role
-- Run this in Supabase SQL Editor

-- First, check what roles exist
SELECT ur.role, u.email 
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id;

-- Add admin role for admin@cocoloko.com (without ON CONFLICT)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@cocoloko.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.users.id AND role = 'admin'
);

-- Verify it was added
SELECT ur.role, u.email 
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'admin@cocoloko.com';
