# 👨‍🍳 Staff Account Setup

## 🚀 Quick Setup (2 Steps)

### Step 1: Fix Supabase URL Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sntxekdwdllwkszclpiq`
3. Go to **Authentication** → **URL Configuration**
4. Update **Site URL** to: `https://coco-loko-acaiteria.pages.dev`
5. Add **Redirect URLs**:
   - `https://coco-loko-acaiteria.pages.dev/**`
   - `https://coco-loko-acaiteria.pages.dev/kitchen`
   - `https://coco-loko-acaiteria.pages.dev/cashier`
   - `https://coco-loko-acaiteria.pages.dev/auth`

### Step 2: Create Staff Accounts
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql)
2. Copy and paste the SQL from `CREATE_STAFF_ACCOUNTS.sql`
3. Click **Run** to create the accounts

This will create the accounts with confirmed emails (no email verification needed).

## 👥 Staff Account Credentials

### Option 1: Create Accounts via SQL (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Create kitchen staff account
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
  'kitchen@cocoloko.com.br',
  crypt('kitchen123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "kitchen"}',
  '{"role": "kitchen"}',
  false,
  '',
  '',
  '',
  ''
);

-- Create cashier staff account
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
  'cashier@cocoloko.com.br',
  crypt('cashier123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "cashier"}',
  '{"role": "cashier"}',
  false,
  '',
  '',
  '',
  ''
);
```

### Option 2: Manual Account Creation

**Kitchen Staff:**
- Email: `kitchen@cocoloko.com.br`
- Password: `kitchen123`

**Cashier Staff:**
- Email: `cashier@cocoloko.com.br`
- Password: `cashier123`

## 🚀 Access URLs

After fixing the Supabase configuration:

- **Kitchen Login:** https://coco-loko-acaiteria.pages.dev/auth
- **Kitchen Dashboard:** https://coco-loko-acaiteria.pages.dev/kitchen
- **Cashier Dashboard:** https://coco-loko-acaiteria.pages.dev/cashier

## 🔒 Security Notes

- Change these passwords after first login
- Consider using stronger passwords for production
- The role-based access is handled by the `ProtectedRoute` component

## 🛠️ Alternative: Bypass Authentication (Development)

If you want to test without authentication, I can temporarily disable the `ProtectedRoute` wrapper for kitchen and cashier pages.