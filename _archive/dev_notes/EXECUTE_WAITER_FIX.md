# Execute Waiter Authentication Fix

## New Deployment URL
https://e75231d8.coco-loko-acaiteria.pages.dev

## SQL Fix Required

You need to run the `FIX_WAITER_AUTH_COMPLETE.sql` script in your Supabase SQL Editor to fix the waiter authentication.

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `FIX_WAITER_AUTH_COMPLETE.sql`
4. Execute the script
5. Test waiter login at: https://e75231d8.coco-loko-acaiteria.pages.dev/auth

### Test Credentials:
- Email: garcom1@cocoloko.com  
- Password: 123456

### What the Fix Does:
1. ✅ Ensures waiter has proper role in both user_metadata and app_metadata
2. ✅ Creates waiter if it doesn't exist
3. ✅ Adds waiter to waiters table
4. ✅ Creates/updates get_user_role RPC function
5. ✅ Verifies the fix worked

### Expected Result:
After running the SQL and testing login, the waiter should be redirected to `/waiter-dashboard` instead of staying on `/auth`.

The updated Auth.tsx now includes:
- Better error handling
- RPC fallback for role detection  
- More detailed logging
- Cache-busting version update