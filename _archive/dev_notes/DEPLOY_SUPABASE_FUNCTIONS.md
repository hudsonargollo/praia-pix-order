# Deploy Supabase Edge Functions

## What We Created

Three Supabase Edge Functions for waiter management:
1. `create-waiter` - Create new waiter accounts
2. `list-waiters` - List all waiters
3. `delete-waiter` - Delete waiter accounts

## Prerequisites

1. **Supabase CLI** installed
2. **Supabase project** access
3. **Service Role Key** configured

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

Or with Homebrew (Mac):
```bash
brew install supabase/tap/supabase
```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

## Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID"

## Step 4: Deploy the Functions

Deploy all three functions:

```bash
# Deploy create-waiter function
supabase functions deploy create-waiter

# Deploy list-waiters function
supabase functions deploy list-waiters

# Deploy delete-waiter function
supabase functions deploy delete-waiter
```

Or deploy all at once:
```bash
supabase functions deploy
```

## Step 5: Set Environment Variables

The functions need access to your Supabase Service Role Key:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

To find your service role key:
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the `service_role` key (not the `anon` key!)

## Step 6: Test the Functions

After deployment, test each function:

### Test list-waiters:
```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/list-waiters' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

### Test create-waiter:
```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-waiter' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","password":"test123","full_name":"Test Waiter"}'
```

## Step 7: Update Frontend (Already Done!)

The frontend code has been updated to use Supabase Edge Functions instead of Cloudflare Functions.

Changes made in `src/pages/AdminWaiters.tsx`:
- `fetchWaiters()` now uses `supabase.functions.invoke('list-waiters')`
- `handleCreateWaiter()` now uses `supabase.functions.invoke('create-waiter')`
- `handleDeleteWaiter()` now uses `supabase.functions.invoke('delete-waiter')`

## Verification

After deployment:

1. **Push the frontend changes:**
   ```bash
   git add -A
   git commit -m "Switch to Supabase Edge Functions for waiter management"
   git push origin main
   ```

2. **Wait for Cloudflare to deploy** (2-3 minutes)

3. **Test in the app:**
   - Go to `/admin-waiters`
   - Try creating a waiter
   - Should work! ✅

## Troubleshooting

### "Function not found"
- Make sure you deployed the functions
- Check function names match exactly
- Verify project is linked correctly

### "Unauthorized" error
- Check that you're logged in as admin
- Verify the Authorization header is being sent
- Check RLS policies on profiles table

### "Service role key not set"
- Run: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key`
- Redeploy functions after setting secrets

### Check function logs:
```bash
supabase functions logs create-waiter
supabase functions logs list-waiters
supabase functions logs delete-waiter
```

## Alternative: Deploy via Supabase Dashboard

If CLI doesn't work, you can deploy via the dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions**
4. Click **New Function**
5. Copy/paste the code from `supabase/functions/[function-name]/index.ts`
6. Deploy

## Summary

✅ **Created:** 3 Supabase Edge Functions
✅ **Updated:** Frontend to use Edge Functions
⏳ **Next:** Deploy functions and test

**Commands to run:**
```bash
# 1. Install CLI (if needed)
npm install -g supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Set secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 5. Deploy functions
supabase functions deploy

# 6. Push frontend changes
git add -A
git commit -m "Switch to Supabase Edge Functions"
git push origin main
```

That's it! The waiter management should work after deployment. 🎉
