# Check Service Role Key Configuration

## Steps to Verify

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/settings/functions

2. **Check Environment Variables**:
   - Look for `SUPABASE_SERVICE_ROLE_KEY`
   - This should be automatically available, but let's verify

3. **If Not Set, Add It Manually**:
   - Click "Add Environment Variable"
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Copy the service_role key from API settings
   - Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/settings/api
   - Copy the "service_role" secret key (the JWT token starting with eyJ...)

4. **After Setting**:
   - Redeploy the functions:
   ```bash
   npx supabase functions deploy create-waiter --no-verify-jwt
   npx supabase functions deploy delete-waiter --no-verify-jwt
   ```

## Alternative: Check Function Logs

Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/functions/delete-waiter/logs

Look for the actual error message to see if it's:
- "Database error finding users" - Service role key issue
- "Unauthorized" - Auth issue
- Something else

Share the error message so we can fix it properly.
