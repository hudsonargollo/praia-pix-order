# Deploy Payment Confirmation Infrastructure Migration

## Overview
This migration creates the database infrastructure for payment confirmation tracking to prevent duplicate notifications and provide an audit trail.

## What Gets Created

1. **dedupe_key column** on `whatsapp_notifications` table
   - Used for deduplication of notifications
   - Format: `{order_id}:{notification_type}:{date}`
   - Indexed for fast lookups

2. **payment_confirmation_log table**
   - Tracks all payment confirmation attempts
   - Records source (manual, webhook, mercadopago)
   - Logs notification success/failure
   - Provides audit trail

3. **RLS Policies**
   - Service role: full access
   - Authenticated users: read and insert
   - Secure by default

4. **Helper Function**
   - `check_recent_payment_confirmation(order_id, minutes)`
   - Checks if order was confirmed recently
   - Prevents duplicate confirmations

## Deployment Options

### Option 1: Automatic via Supabase CLI (Recommended)
```bash
# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

### Option 2: Manual via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `CREATE_PAYMENT_CONFIRMATION_INFRASTRUCTURE.sql`
4. Paste and run the SQL

### Option 3: Via GitHub Actions (Automatic on merge)
The migration will be automatically applied when you merge to main branch via the existing GitHub Actions workflow.

## Verification

After deployment, verify the migration was successful:

```sql
-- Check dedupe_key column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_notifications' AND column_name = 'dedupe_key';

-- Check payment_confirmation_log table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'payment_confirmation_log';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('whatsapp_notifications', 'payment_confirmation_log')
  AND (indexname LIKE '%dedupe%' OR indexname LIKE '%payment_confirmation%');

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'payment_confirmation_log';

-- Test helper function
SELECT check_recent_payment_confirmation('00000000-0000-0000-0000-000000000000'::uuid, 5);
```

## Files Created

- `supabase/migrations/20251119000001_create_payment_confirmation_infrastructure.sql` - Migration file
- `CREATE_PAYMENT_CONFIRMATION_INFRASTRUCTURE.sql` - Standalone SQL for manual deployment
- `DEPLOY_PAYMENT_CONFIRMATION_MIGRATION.md` - This deployment guide

## Next Steps

After this migration is deployed, you can proceed with:
- Task 2: Update confirm_order_payment function
- Task 3: Update MercadoPago webhook handler
- Task 4: Update manual payment confirmation in Cashier

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Drop helper function
DROP FUNCTION IF EXISTS check_recent_payment_confirmation;

-- Drop RLS policies
DROP POLICY IF EXISTS "Service role has full access to payment_confirmation_log" ON payment_confirmation_log;
DROP POLICY IF EXISTS "Authenticated users can read payment_confirmation_log" ON payment_confirmation_log;
DROP POLICY IF EXISTS "Authenticated users can insert payment_confirmation_log" ON payment_confirmation_log;

-- Drop table
DROP TABLE IF EXISTS payment_confirmation_log;

-- Remove dedupe_key column
ALTER TABLE whatsapp_notifications DROP COLUMN IF EXISTS dedupe_key;

-- Drop index
DROP INDEX IF EXISTS idx_whatsapp_notifications_dedupe;
```
