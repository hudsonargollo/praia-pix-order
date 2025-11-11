# Update Supabase API Keys

## Important: Use the Correct Key Format

Your app uses the **JWT token format** (old format), not the new `sb_publishable_` format.

## Steps to Get the Correct Keys

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/settings/api

2. **Find the "Project API keys" section** (not "API Keys" at the top)

3. **Copy these keys**:
   - **anon/public** key - This is a long JWT token starting with `eyJ...`
   - **service_role** key - Also a JWT token starting with `eyJ...`

## Update Your .env File

Replace the values in `.env`:

```env
VITE_SUPABASE_URL="https://sntxekdwdllwkszclpiq.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<paste the anon key here - starts with eyJ>"
```

## For Edge Functions (Service Role)

The edge functions need the service_role key. This should be automatically available as `SUPABASE_SERVICE_ROLE_KEY` in edge functions, but if it's not working, you may need to set it manually in:

**Project Settings → Edge Functions → Environment Variables**

Add:
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `<paste the service_role JWT token>`

## After Updating

1. **Rebuild the app**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   ```bash
   npx wrangler pages deploy dist --project-name=coco-loko-acaiteria
   ```

3. **Test order creation** - it should work now

## Why the New Keys Don't Work

The keys you created (`sb_publishable_...` and `sb_secret_...`) are Supabase's new API key format, but:
- Your app code expects JWT tokens
- The Supabase JS client library expects JWT tokens
- You need to use the "Project API keys" section, not the "API Keys" section

## Troubleshooting

If orders still fail after updating:
1. Check browser console for the actual error
2. Verify the keys are correct JWT tokens (very long, start with `eyJ`)
3. Make sure you're using the **anon** key, not the service_role key in the frontend
4. Clear browser cache and reload
