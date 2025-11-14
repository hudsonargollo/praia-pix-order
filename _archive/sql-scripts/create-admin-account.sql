-- Create admin account
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql
-- Password will be: admin123 (change it after first login!)

-- First, create the user in Supabase Auth (you'll need to do this via Supabase Dashboard)
-- Go to Authentication > Users > Add User
-- Email: admin@cocoloko.com
-- Password: admin123
-- Then get the user ID and run this:

-- OR use this simpler approach - just add the role to an existing user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from Supabase Auth

-- Example: If you already have a user, just add admin role:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR_USER_ID_HERE', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- To find your user ID, run this after logging in:
-- SELECT id, email FROM auth.users;
