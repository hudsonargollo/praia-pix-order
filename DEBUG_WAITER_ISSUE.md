# Debugging Waiter Management Issue

## Current Error
```
Edge Function returned a non-2xx status code
Internal Server Error
```

## What We Know
1. ✅ Edge functions are deployed (list-waiters, create-waiter, delete-waiter)
2. ✅ RLS policies are fixed (authenticated users can manage)
3. ✅ Product edit works (confirms RLS and auth are working)
4. ❌ Waiter management fails with 500 Internal Server Error

## Possible Root Causes

### 1. Service Role Key Issue
The edge functions use `SUPABASE_SERVICE_ROLE_KEY` to list/create/delete users via Admin API.

**Problem**: This environment variable might not be set or accessible in the edge function runtime.

**Solution**: Verify in Supabase Dashboard → Project Settings → Edge Functions

### 2. Admin API Permissions
The functions call `supabaseAdmin.auth.admin.listUsers()` which requires service role permissions.

**Problem**: If the service role key is invalid or missing, this will fail with 500 error.

### 3. Edge Function Runtime Error
There might be an unhandled exception in the function code.

**Check**: Supabase Dashboard → Edge Functions → list-waiters → Logs

## Immediate Actions Needed

### Action 1: Check Supabase Function Logs
1. Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/functions
2. Click on `list-waiters`
3. Go to Logs tab
4. Look for the most recent invocation
5. Check the error message

### Action 2: Verify Service Role Key
1. Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/settings/api
2. Copy the `service_role` key (secret)
3. Verify it's not expired or revoked

### Action 3: Test with cURL
Test the function directly to see the actual error:

```bash
# Get your access token from browser console:
# localStorage.getItem('sb-sntxekdwdllwkszclpiq-auth-token')

curl -X POST \
  'https://sntxekdwdllwkszclpiq.supabase.co/functions/v1/list-waiters' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json'
```

## Alternative Approach

If edge functions continue to fail, we could:

### Option A: Use Direct Database Queries
Instead of using Auth Admin API, query the `auth.users` table directly:
- Requires service role key in frontend (less secure)
- Or create a database function with SECURITY DEFINER

### Option B: Simplify Waiter Management
- Don't use separate user accounts for waiters
- Store waiter info in a regular table
- Use a single admin account for all waiter operations

### Option C: Use Supabase Management API
- Call Supabase Management API from edge function
- Requires project API key
- More complex but more reliable

## Next Steps

1. **Check the logs** in Supabase Dashboard to see the actual error
2. **Share the error message** so we can identify the root cause
3. **Verify service role key** is properly configured
4. Consider alternative approaches if edge functions are fundamentally broken

## Questions to Answer

1. What does the Supabase function log show for the failed request?
2. Is the service role key visible in Project Settings → API?
3. Does the error happen immediately or after a timeout?
4. Are there any CORS errors in the browser console?
