# Fix: Permission Denied for Table Users

## Problem
You're seeing this error in the console:
```
Error: permission denied for table users
```

This happens because the RLS (Row Level Security) policies on `menu_items` and `menu_categories` tables are trying to read from `auth.users` table to check if the current user is an admin, but authenticated users don't have permission to read that table.

## Solution

### Option 1: Run SQL Script (Recommended)

1. Open your Supabase SQL Editor:
   https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql

2. Copy and paste the contents of `scripts/fix-auth-users-permission.sql`

3. Click "Run" to execute the SQL

4. Refresh your admin products page

### Option 2: Manual Fix

1. Go to Supabase SQL Editor
2. Run this command:

```sql
GRANT SELECT (id, raw_user_meta_data, raw_app_meta_data) ON auth.users TO authenticated;
```

3. Refresh your admin products page

## What This Does

This grants authenticated users permission to read only specific columns from the `auth.users` table:
- `id` - User ID
- `raw_user_meta_data` - Contains the user's role
- `raw_app_meta_data` - Additional metadata

This is safe because:
- It only grants SELECT (read) permission, not INSERT/UPDATE/DELETE
- It only grants access to specific columns, not the entire table
- It's needed for the RLS policies to check user roles

## Verification

After applying the fix, you should be able to:
- Load the admin products page without errors
- Edit products
- Create new products
- Manage categories

The error in the console should disappear.
