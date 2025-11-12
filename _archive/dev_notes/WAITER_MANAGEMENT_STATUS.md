# Waiter Management - Current Status

## ✅ What's Working

- **List Waiters**: Working perfectly using database function `list_waiter_users()`
- **View waiter details**: Name, email, created date all display correctly

## ❌ What's Not Working

- **Create Waiter**: Fails with "Database error" from Auth Admin API
- **Delete Waiter**: Fails with "Database error" from Auth Admin API

## Root Cause

Both create and delete operations use Supabase Auth Admin API:
- `supabaseAdmin.auth.admin.createUser()` 
- `supabaseAdmin.auth.admin.deleteUser()`

These APIs are failing with:
```
AuthApiError: Database error finding users
status: 500
code: "unexpected_failure"
```

This suggests the `SUPABASE_SERVICE_ROLE_KEY` either:
1. Doesn't have proper permissions to access auth.users table
2. Is not being passed correctly to the Admin API
3. Has some other configuration issue in your Supabase project

## Why List Works But Create/Delete Don't

- **List**: Uses a database function with `SECURITY DEFINER` that queries auth.users directly
- **Create/Delete**: Must use Auth Admin API (no alternative) which has permission issues

## Possible Solutions

### Option 1: Fix Service Role Permissions (Recommended)

The service role key should have full access by default. Check:

1. **Verify Service Role Key**:
   - Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/settings/api
   - Copy the `service_role` key (secret)
   - Make sure it's the correct one

2. **Check Project Settings**:
   - Ensure your project doesn't have any custom restrictions on the service role
   - Check if there are any database-level permissions blocking auth.users access

3. **Contact Supabase Support**:
   - This might be a project-level configuration issue
   - Supabase support can check if there's something wrong with your service role permissions

### Option 2: Use Supabase Dashboard Manually

For now, you can manage waiters manually:

1. **Create Waiter**:
   - Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/auth/users
   - Click "Add user" → "Create new user"
   - Fill in email and password
   - After creation, edit the user and add to `user_metadata`:
     ```json
     {
       "role": "waiter",
       "full_name": "Waiter Name"
     }
     ```

2. **Delete Waiter**:
   - Go to the same Auth Users page
   - Find the waiter user
   - Click the menu → Delete user

### Option 3: Alternative Implementation (Complex)

Create a backend service (not edge function) that:
- Runs with elevated permissions
- Handles user creation/deletion
- Uses a different authentication method

This is more complex and requires additional infrastructure.

## Recommended Next Steps

1. **Try the functions again** after redeployment (they're now deployed)
2. **Check Supabase Dashboard logs** for create-waiter and delete-waiter functions
3. **Verify service role key** is correct and has permissions
4. **Contact Supabase support** if the issue persists

## Temporary Workaround

Use the Supabase Dashboard to manually create/delete waiters until the API issue is resolved. The list function works perfectly, so you can still view all waiters in your app.

## Files Involved

- `supabase/functions/create-waiter/index.ts` - Create waiter edge function
- `supabase/functions/delete-waiter/index.ts` - Delete waiter edge function
- `supabase/functions/list-waiters/index.ts` - List waiters (working)
- `WAITER_FIX_ALTERNATIVE.sql` - Database function for listing
