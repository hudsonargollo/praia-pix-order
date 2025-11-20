# Clear All Orders Scripts

## ⚠️ WARNING

These scripts will **DELETE ALL ORDERS** and related data from the database. This action **CANNOT BE UNDONE**.

Use these scripts only for:
- Testing environments
- Development databases
- When you need to start fresh

**DO NOT USE IN PRODUCTION** unless you're absolutely sure!

---

## Scripts Available

### 1. `clear-all-orders.sql` (Safe with Review)

**Recommended for first-time use**

This script uses a transaction that requires manual commit:

```sql
-- Run in Supabase SQL Editor
-- 1. Copy and paste the entire script
-- 2. Execute it
-- 3. Review the output
-- 4. If correct, run: COMMIT;
-- 5. If wrong, run: ROLLBACK;
```

**Features:**
- Shows counts before deletion
- Uses transaction (BEGIN...COMMIT)
- Requires manual COMMIT
- Can be rolled back with ROLLBACK
- Shows verification counts

### 2. `clear-all-orders-safe.sql` (Auto Commit)

**For quick deletion when you're sure**

This script deletes immediately without transaction:

```sql
-- Run in Supabase SQL Editor
-- Copy and paste the entire script
-- Execute it
-- Done!
```

**Features:**
- Deletes immediately
- No transaction (auto-commit)
- Cannot be rolled back
- Shows verification counts

---

## What Gets Deleted

### Tables Affected

1. **whatsapp_chat_messages** - All chat messages
2. **whatsapp_notifications** - All WhatsApp notifications
3. **payment_webhooks** - All payment webhook records
4. **order_items** - All order items
5. **orders** - All orders

### Tables NOT Affected

- ✅ `menu_items` - Menu items preserved
- ✅ `menu_categories` - Categories preserved
- ✅ `profiles` - User profiles preserved
- ✅ `customers` - Customer records preserved (but last_order_date may be outdated)
- ✅ `auth.users` - User accounts preserved

---

## How to Use

### Option 1: Via Supabase Dashboard (Recommended)

1. **Login to Supabase**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Choose Script**
   - For review before commit: Use `clear-all-orders.sql`
   - For immediate deletion: Use `clear-all-orders-safe.sql`

4. **Copy Script**
   - Open the script file
   - Copy entire contents

5. **Paste and Execute**
   - Paste in SQL Editor
   - Click "Run" or press Ctrl+Enter

6. **Review Results**
   - Check the output
   - Verify counts are 0

7. **Commit (if using transaction version)**
   - If using `clear-all-orders.sql`
   - Type `COMMIT;` and run
   - Or type `ROLLBACK;` to cancel

### Option 2: Via Supabase CLI

```bash
# Using the safe version (auto-commit)
psql $DATABASE_URL -f scripts/clear-all-orders-safe.sql

# Using the transaction version (requires manual commit)
psql $DATABASE_URL -f scripts/clear-all-orders.sql
# Then in psql prompt:
# COMMIT; (to confirm)
# or
# ROLLBACK; (to cancel)
```

---

## Verification Queries

After deletion, verify with these queries:

```sql
-- Check orders count
SELECT COUNT(*) as orders_count FROM orders;
-- Expected: 0

-- Check order items count
SELECT COUNT(*) as items_count FROM order_items;
-- Expected: 0

-- Check WhatsApp notifications count
SELECT COUNT(*) as notifications_count FROM whatsapp_notifications;
-- Expected: 0

-- Check WhatsApp chat messages count
SELECT COUNT(*) as messages_count FROM whatsapp_chat_messages;
-- Expected: 0

-- Check payment webhooks count
SELECT COUNT(*) as webhooks_count FROM payment_webhooks;
-- Expected: 0
```

---

## Common Use Cases

### 1. Testing New Features

```sql
-- Clear all orders before testing
-- Run: clear-all-orders-safe.sql

-- Test your feature
-- Create test orders
-- Verify behavior

-- Clear again after testing
-- Run: clear-all-orders-safe.sql
```

### 2. Resetting Development Database

```sql
-- Clear all orders
-- Run: clear-all-orders-safe.sql

-- Optionally clear customers too
DELETE FROM customers;

-- Start fresh with new test data
```

### 3. Preparing for Production Launch

```sql
-- Clear all test orders
-- Run: clear-all-orders-safe.sql

-- Verify everything is clean
SELECT COUNT(*) FROM orders; -- Should be 0

-- Ready for real customers!
```

---

## Safety Tips

### Before Running

1. **Backup First** (if in production)
   ```bash
   # Backup via Supabase Dashboard
   # Settings > Database > Backups
   ```

2. **Verify Environment**
   ```sql
   -- Check which database you're connected to
   SELECT current_database();
   ```

3. **Check Order Count**
   ```sql
   -- See how many orders will be deleted
   SELECT COUNT(*) FROM orders;
   ```

### After Running

1. **Verify Deletion**
   ```sql
   -- All should return 0
   SELECT COUNT(*) FROM orders;
   SELECT COUNT(*) FROM order_items;
   ```

2. **Check Application**
   - Open admin dashboard
   - Verify no orders show
   - Check kitchen dashboard
   - Verify cashier panel

3. **Test Order Creation**
   - Create a test order
   - Verify it works correctly
   - Delete test order if needed

---

## Troubleshooting

### Error: Foreign Key Constraint

If you get foreign key errors:

```sql
-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Run deletion
DELETE FROM orders;

-- Re-enable triggers
SET session_replication_role = 'origin';
```

### Error: Permission Denied

If you get permission errors:

- Make sure you're using service role key
- Or run as postgres user
- Check RLS policies

### Error: Table Not Found

If tables don't exist:

- Check table names are correct
- Verify migrations have been applied
- Check you're in correct database

---

## Rollback (Transaction Version Only)

If you used `clear-all-orders.sql` and want to cancel:

```sql
-- Cancel the deletion
ROLLBACK;

-- Verify orders are still there
SELECT COUNT(*) FROM orders;
```

**Note**: This only works with the transaction version and only before you run COMMIT.

---

## Alternative: Selective Deletion

If you want to delete only specific orders:

```sql
-- Delete orders from today only
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE created_at >= CURRENT_DATE
);

DELETE FROM orders 
WHERE created_at >= CURRENT_DATE;

-- Delete orders by status
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE status = 'cancelled'
);

DELETE FROM orders 
WHERE status = 'cancelled';

-- Delete test orders (by phone pattern)
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE customer_phone LIKE '5599999%'
);

DELETE FROM orders 
WHERE customer_phone LIKE '5599999%';
```

---

## Support

If you encounter issues:

1. Check error message carefully
2. Verify you have correct permissions
3. Check database connection
4. Review foreign key constraints
5. Contact support if needed

---

**Last Updated**: November 20, 2024
**Version**: 1.0.0
**Status**: Ready to use
