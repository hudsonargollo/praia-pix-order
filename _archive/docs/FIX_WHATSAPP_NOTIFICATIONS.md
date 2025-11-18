# Fix WhatsApp Notifications - Quick Guide

## ⚠️ URGENT: Run This Migration Now

## Problem
WhatsApp notifications are failing with these errors:
- ❌ `new row violates row-level security policy for table 'whatsapp_notifications'`
- ❌ `Failed to load resources: the server responded with a status of 400 ()`
- ❌ Phone encryption not configured warnings

## Root Cause
The database is missing:
1. RLS policies that allow anonymous users (customers) to insert notifications
2. The 'order_created' notification type in the constraint
3. Supporting tables (whatsapp_opt_outs, whatsapp_error_logs)

## Solution
Run the consolidated SQL migration in your Supabase SQL Editor.

## Steps

### 1. Open Supabase SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project (coco-loko-acaiteria)
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### 2. Run the Migration
1. Open the file: `supabase/migrations/20251118000004_fix_whatsapp_notifications_complete.sql`
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click "Run" button (or press Cmd/Ctrl + Enter)

### 3. Verify Success
You should see a success message like:
```
Success. No rows returned
```

This means all the changes were applied successfully.

### 4. Test the Fix
1. Go to your deployed app: https://f1a96c56.coco-loko-acaiteria.pages.dev
2. Create a new test order
3. Check the browser console - you should see:
   - ✅ "WhatsApp notification triggered for order: [order-id]"
   - No more RLS policy errors
   - No more encryption errors

## What This Migration Does

1. **Adds 'order_created' notification type** - Allows the system to send notifications when orders are created
2. **Creates whatsapp_opt_outs table** - Tracks customers who don't want notifications
3. **Creates whatsapp_error_logs table** - Logs errors for debugging
4. **Fixes RLS policies** - Allows anonymous users (customers) to insert notifications
5. **Adds proper indexes** - Improves query performance

## Optional: Configure Phone Encryption

For additional security, you can encrypt phone numbers in the database:

1. Generate an encryption key (run in browser console):
```javascript
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);
const exported = await crypto.subtle.exportKey('raw', key);
const keyArray = new Uint8Array(exported);
const base64Key = btoa(String.fromCharCode(...keyArray));
console.log('Encryption Key:', base64Key);
```

2. Add to your `.env` file:
```
VITE_PHONE_ENCRYPTION_KEY=<your-generated-key>
```

3. Redeploy your app

**Note:** Phone encryption is optional. The system works fine without it (phones are stored in plain text).

## Troubleshooting

### If you see "relation already exists" errors
This is OK! It means some tables were already created. The migration uses `IF NOT EXISTS` to handle this safely.

### If you see "constraint already exists" errors
This is also OK! The migration drops constraints before recreating them.

### If notifications still don't work after migration
1. Check the browser console for errors
2. Check Supabase logs: Dashboard → Logs → select "Postgres Logs"
3. Look for any RLS policy violations or constraint errors
4. Verify the migration ran successfully (check the "Migrations" section in Supabase)

## Need Help?
If you're still having issues, share:
1. The exact error message from the browser console
2. Any errors from the Supabase SQL Editor
3. Screenshots if helpful
