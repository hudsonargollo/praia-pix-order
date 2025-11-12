# 🚨 URGENT: Run This SQL in Supabase

## Problem
The `whatsapp_notifications` table doesn't exist in your production database, causing all WhatsApp notifications to fail.

## Solution
Run the SQL script to create all required WhatsApp tables.

## Steps

### 1. Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql/new

### 2. Copy and Run SQL
Copy the entire contents of `CREATE_WHATSAPP_TABLES.sql` and run it.

### 3. Verify
After running, you should see:
```
Success. 3 rows returned.

table_name
whatsapp_notifications
whatsapp_opt_out
whatsapp_error_logs
```

## What This Creates

1. **whatsapp_notifications** - Stores all notification attempts
2. **whatsapp_opt_out** - Tracks customers who opted out
3. **whatsapp_error_logs** - Logs errors for monitoring

## After Running SQL

1. Refresh your production site
2. Try "Notificar Pronto" button again
3. WhatsApp message should send successfully!

## Current Errors (Will Be Fixed)

- ❌ "Could not find the table 'public.whatsapp_notifications'"
- ❌ "Failed to load notification history"
- ⚠️ "Phone encryption not configured" (warning only, not critical)

## After Fix

- ✅ WhatsApp notifications will send
- ✅ Notification history will load
- ✅ "Notificar Pronto" button will work
- ✅ Payment confirmations will send

---

**CRITICAL**: Run `CREATE_WHATSAPP_TABLES.sql` in Supabase NOW!
