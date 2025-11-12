# Create Waiter Manually (Workaround)

## The Issue

The waiter management UI isn't working due to deployment/caching issues. Here's how to create waiters manually until the deployment is fixed.

## Option 1: Create Waiter via Supabase Dashboard (Easiest)

### Step 1: Go to Supabase Dashboard
https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/auth/users

### Step 2: Click "Add User"

### Step 3: Fill in the form:
- **Email:** waiter@example.com
- **Password:** (choose a secure password)
- **Auto Confirm User:** ✅ Check this box

### Step 4: Click "Create User"

### Step 5: Set the Role
After creating the user, you need to set their role:

1. Click on the user you just created
2. Go to the "User Metadata" tab
3. Click "Edit"
4. Add this JSON:
```json
{
  "full_name": "Waiter Name",
  "role": "waiter"
}
```
5. Go to "App Metadata" tab
6. Click "Edit"
7. Add this JSON:
```json
{
  "role": "waiter"
}
```
8. Save

## Option 2: Create Waiter via SQL

### Run this in Supabase SQL Editor:

```sql
-- This creates a waiter user directly
-- Replace the email, password, and name with your values

DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create the auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'waiter@example.com', -- CHANGE THIS
    crypt('your-password-here', gen_salt('bf')), -- CHANGE THIS
    NOW(),
    '{"provider":"email","providers":["email"],"role":"waiter"}'::jsonb,
    '{"full_name":"Waiter Name","role":"waiter"}'::jsonb, -- CHANGE THIS
    NOW(),
    NOW(),
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Create identity
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id, 'waiter@example.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Waiter created successfully with ID: %', new_user_id;
END $$;
```

## Option 3: Use Supabase CLI

```bash
# Create a waiter using Supabase CLI
supabase db execute "
SELECT auth.create_user(
  email := 'waiter@example.com',
  password := 'your-password-here',
  email_confirm := true,
  user_metadata := '{\"full_name\":\"Waiter Name\",\"role\":\"waiter\"}'::jsonb,
  app_metadata := '{\"role\":\"waiter\"}'::jsonb
);
"
```

## Verify the Waiter Was Created

### Check in Dashboard:
1. Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/auth/users
2. You should see the new waiter user
3. Click on them to verify the metadata is correct

### Check via SQL:
```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_app_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'waiter';
```

## Test the Waiter Login

1. Go to your site
2. Navigate to `/waiter`
3. Login with the waiter credentials
4. Should work! ✅

---

## Why the UI Isn't Working

The waiter management UI is trying to call Supabase Edge Functions, but there's a deployment/caching issue preventing the new code from loading.

**Possible causes:**
1. Cloudflare Pages hasn't deployed the latest code yet
2. Browser is caching old JavaScript
3. Build process didn't include the updated files

**Proper fix:**
1. Force a new Cloudflare Pages deployment
2. Clear all caches
3. Verify the Edge Functions are being called

---

## Temporary Solution

Use one of the manual methods above to create waiters until the deployment issue is resolved.

The waiters will work fine once created - the issue is only with the creation UI.
