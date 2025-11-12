# Fix Waiter Management - Step by Step

## Problem Identified

The edge function `list-waiters` is failing with:
```
AuthApiError: Database error finding users
status: 500
code: "unexpected_failure"
```

This happens because `supabaseAdmin.auth.admin.listUsers()` doesn't have proper permissions to access the auth.users table.

## Solution

Instead of using the Auth Admin API to list users, we'll create a database function that queries auth.users directly with SECURITY DEFINER privileges.

## Steps to Apply

### Step 1: Run the SQL Fix in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql/new
2. Copy the entire contents of `WAITER_FIX_ALTERNATIVE.sql`
3. Paste into the SQL Editor
4. Click **Run**

This will create a database function `list_waiter_users()` that can safely query the auth.users table.

### Step 2: Deploy the Updated Edge Function

The edge function has been updated to use the database function instead of the Admin API.

Run this command:
```bash
npx supabase functions deploy list-waiters --no-verify-jwt
```

### Step 3: Test

1. Logout and login again to refresh your session
2. Go to Admin → Waiters
3. The list should now load successfully

## What Changed

### Before (Broken)
```typescript
// Used Admin API which failed
const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
```

### After (Fixed)
```typescript
// Uses database function with SECURITY DEFINER
const { data: waiters, error } = await supabaseClient.rpc('list_waiter_users')
```

## Why This Works

- **SECURITY DEFINER**: The database function runs with the privileges of the function owner (postgres), not the caller
- **Direct Query**: Queries auth.users directly without going through the Auth Admin API
- **No Service Role Needed**: The edge function doesn't need the service role key for listing
- **RLS Bypass**: SECURITY DEFINER functions bypass RLS policies

## Notes

- **Create waiter** and **Delete waiter** still use edge functions with Admin API
- Those operations require the service role key to work
- If they also fail, we'll need to create database functions for them too

## Troubleshooting

If it still doesn't work:

1. **Check the SQL ran successfully**:
   - Look for the success message in SQL Editor
   - Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'list_waiter_users';`

2. **Check edge function logs**:
   - Go to Functions → list-waiters → Logs
   - Look for new errors after deployment

3. **Test the database function directly**:
   ```sql
   SELECT * FROM public.list_waiter_users();
   ```

If you see results, the function works and the edge function should work too.
