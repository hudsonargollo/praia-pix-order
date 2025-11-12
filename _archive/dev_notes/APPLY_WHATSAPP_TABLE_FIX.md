# 🔧 Apply WhatsApp Notifications Table Fix

## Problem
The `whatsapp_notifications` table schema doesn't match what the code expects, causing errors:
```
Failed to fetch pending notifications
Could not find "whatsapp_notifications" in the schema cache
```

## Root Cause
The table was created with old column names:
- `phone` instead of `customer_phone`
- `message_type` instead of `notification_type`
- Missing columns: `attempts`, `scheduled_at`, `error_message`

## Solution
Created migration `20251111000006_update_whatsapp_notifications_schema.sql` that:
1. Drops the old table
2. Creates new table with correct schema
3. Sets up proper RLS policies
4. Adds indexes for performance

## Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20251111000006_update_whatsapp_notifications_schema.sql`
6. Click **Run**

### Option 2: Supabase CLI
```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref sntxekdwdllwkszclpiq

# Push the migration
supabase db push
```

### Option 3: Direct SQL
```bash
# Run the migration file directly
psql "postgresql://postgres:[YOUR_PASSWORD]@db.sntxekdwdllwkszclpiq.supabase.co:5432/postgres" \
  -f supabase/migrations/20251111000006_update_whatsapp_notifications_schema.sql
```

## Verify the Migration

Run this query in Supabase SQL Editor:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'whatsapp_notifications'
ORDER BY ordinal_position;

-- Expected columns:
-- id, order_id, customer_phone, notification_type, message_content,
-- status, attempts, whatsapp_message_id, scheduled_at, sent_at,
-- error_message, created_at, updated_at
```

## Test After Migration

### 1. Check Console
Refresh the app and check console - should NOT see:
```
❌ Failed to fetch pending notifications
❌ Could not find "whatsapp_notifications" in the schema cache
```

### 2. Create Test Order
1. Create an order with your WhatsApp number
2. Complete payment
3. Check console for:
   ```
   ✅ Payment confirmed trigger
   ✅ Payment confirmation notification queued
   ✅ Processing 1 pending notifications
   ✅ Notification sent successfully
   ```

### 3. Check Database
```sql
-- Should see the notification
SELECT * FROM whatsapp_notifications
ORDER BY created_at DESC
LIMIT 5;
```

## Expected Results

### Before Fix ❌
- Console errors about schema cache
- Notifications not queued
- No entries in database

### After Fix ✅
- No console errors
- Notifications queued successfully
- Entries visible in database
- Messages sent to WhatsApp

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Restore old schema (will lose any new data)
DROP TABLE IF EXISTS whatsapp_notifications CASCADE;

-- Then run the old migration
-- supabase/migrations/20251106000003_create_whatsapp_notifications_table.sql
```

---

**Status:** 🟡 READY TO APPLY
**Priority:** 🔴 CRITICAL - Blocks all automatic notifications
**Impact:** Fixes table schema mismatch
**Next:** Apply migration, then test notifications
