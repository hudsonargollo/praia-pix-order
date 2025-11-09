# Deploy Supabase Functions - Quick Guide

## ✅ What We've Done So Far:

1. ✅ Installed Supabase CLI
2. ✅ Logged in to Supabase
3. ✅ Linked project (sntxekdwdllwkszclpiq)

## 🔑 Next: Get Your Service Role Key

### Step 1: Get Service Role Key from Supabase

1. Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/settings/api
2. Scroll to "Project API keys"
3. Find the **service_role** key (NOT the anon key!)
4. Click "Reveal" and copy the entire key

### Step 2: Set the Secret

Run this command (replace with your actual key):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-actual-service-role-key-here"
```

### Step 3: Deploy the Functions

```bash
supabase functions deploy
```

This will deploy all three functions:
- create-waiter
- list-waiters
- delete-waiter

## 🧪 After Deployment

1. **Wait for Cloudflare to deploy frontend** (already pushed, ~2-3 min)
2. **Test waiter creation:**
   - Go to your site
   - Login as admin
   - Navigate to `/admin-waiters`
   - Click "Adicionar Novo Garçom"
   - Fill in the form
   - Should work! ✅

## 📋 Complete Command Sequence

```bash
# 1. Set service role key (get from Supabase Dashboard)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Deploy functions
supabase functions deploy

# 3. Verify deployment
supabase functions list
```

## 🔍 Verify Functions Are Deployed

```bash
supabase functions list
```

Should show:
- create-waiter
- list-waiters
- delete-waiter

## 🆘 If Something Goes Wrong

### Check function logs:
```bash
supabase functions logs create-waiter --tail
```

### Redeploy a specific function:
```bash
supabase functions deploy create-waiter
```

### Test a function directly:
```bash
curl -i --location --request POST \
  'https://sntxekdwdllwkszclpiq.supabase.co/functions/v1/list-waiters' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

## ✅ Success Criteria

After deployment, you should be able to:
1. ✅ List waiters (even if empty)
2. ✅ Create a new waiter
3. ✅ Delete a waiter

## 🎯 Summary

**Current Status:**
- ✅ CLI installed
- ✅ Logged in
- ✅ Project linked
- ⏳ Need to set service role key
- ⏳ Need to deploy functions

**Next Steps:**
1. Get service role key from dashboard
2. Run: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."`
3. Run: `supabase functions deploy`
4. Test in the app!

---

**Quick Link to Get Service Role Key:**
https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/settings/api
