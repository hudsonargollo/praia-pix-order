-- Check current user roles
SELECT ur.*, u.email 
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id;

-- If the above shows no admin role, run these commands:

-- Add admin role for admin@cocoloko.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@cocoloko.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Add waiter role for garcom1@cocoloko.com (if not already there)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'waiter'
FROM auth.users
WHERE email = 'garcom1@cocoloko.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'waiter';

-- Verify the roles were added
SELECT ur.role, u.email, u.id
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY u.email;
