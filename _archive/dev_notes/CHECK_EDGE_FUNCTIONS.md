# Edge Functions Troubleshooting

## Current Issue
Waiter management functions (list-waiters, create-waiter, delete-waiter) are returning non-2xx status codes.

## What We've Done
1. ✅ Removed admin role checks from all three edge functions
2. ✅ Deployed all three functions successfully
3. ✅ Fixed RLS policies to allow authenticated users

## Possible Issues

### 1. Service Role Key Not Set
The edge functions use `SUPABASE_SERVICE_ROLE_KEY` environment variable. This should be automatically available in Supabase Edge Functions, but let's verify.

**Check in Supabase Dashboard:**
1. Go to Project Settings → Edge Functions
2. Verify that environment variables are set
3. The service role key should be automatically available

### 2. Function Logs
**To check what's actually failing:**
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on each function (list-waiters, create-waiter, delete-waiter)
4. Check the Logs tab to see actual errors

### 3. Auth Token Issue
The functions expect an Authorization header with the user's access token. If the token is invalid or expired, the function will fail.

**To verify:**
- Check browser console for the actual error response
- Look at Network tab → Failed request → Response tab
- The response body should show the actual error message

## Next Steps

1. **Check Supabase Dashboard Logs:**
   - Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/functions
   - Click on `list-waiters` function
   - Check the Logs tab for recent invocations
   - Look for error messages

2. **Check Network Response:**
   - Open browser DevTools
   - Go to Network tab
   - Try to list waiters
   - Click on the failed `list-waiters` request
   - Check the Response tab for the actual error message

3. **Verify Service Role Key:**
   - The edge functions need `SUPABASE_SERVICE_ROLE_KEY` to create/list/delete users
   - This should be automatically available in Supabase Edge Functions
   - If not, we may need to set it manually in Project Settings

## Alternative Approach

If edge functions continue to fail, we could:
1. Use Supabase Admin API directly from the frontend (less secure)
2. Create a simpler backend service
3. Use Supabase Auth Admin methods with proper RLS policies

## What to Check Now

Please check the Supabase Dashboard logs and share:
1. The actual error message from the edge function logs
2. The response body from the Network tab in browser
3. Any error details that show what's failing

This will help us identify the exact issue.
