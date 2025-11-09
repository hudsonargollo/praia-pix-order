# FINAL ADMIN ACCESS SOLUTION

## Problem
The admin account exists but doesn't have the role set properly in the database.

## Solution Options

### Option 1: Use URL Bypass (IMMEDIATE - Works Now)
Just add `?bypass=dev123` to any admin URL:
- https://29d112cd.coco-loko-acaiteria.pages.dev/admin?bypass=dev123
- https://29d112cd.coco-loko-acaiteria.pages.dev/cashier?bypass=dev123
- https://29d112cd.coco-loko-acaiteria.pages.dev/reports?bypass=dev123

This bypasses ALL authentication checks.

### Option 2: Fix Database (PERMANENT)
Run this SQL in Supabase SQL Editor:

```sql
-- Delete old admin account
DELETE FROM auth.users WHERE email = 'admin@cocoloko.com.br';

-- Create new admin account with correct role
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@cocoloko.com.br',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
  '{"role": "admin", "full_name": "Administrator"}'::jsonb,
  false
);

-- Verify
SELECT email, raw_user_meta_data->>'role' as role FROM auth.users WHERE email = 'admin@cocoloko.com.br';
```

After running this:
1. Clear browser cache/cookies
2. Login with admin@cocoloko.com.br / admin123
3. Should work without bypass

### Option 3: Create New Admin via Supabase Dashboard
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Email: admin@cocoloko.com.br
4. Password: admin123
5. User Metadata: `{"role": "admin"}`
6. Confirm email automatically
7. Login with these credentials

## Recommended Approach
Use Option 1 (URL bypass) immediately to access the system, then fix with Option 2 when you have time.
