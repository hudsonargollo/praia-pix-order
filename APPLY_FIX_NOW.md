# Apply Customer Order RLS Fix - SIMPLE GUIDE

## The Problem
The policies already exist in your database, so we need to drop them all first, then recreate them correctly.

## The Solution - 2 Steps

### Step 1: Check Current Policies (Optional)
Run this in Supabase SQL Editor to see what you have now:

```sql
SELECT tablename, policyname, cmd as operation
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd, policyname;
```

### Step 2: Apply the Fix
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql
2. Copy the ENTIRE contents of: `fix-customer-order-rls-safe.sql`
3. Paste into SQL Editor
4. Click "Run" (or Cmd+Enter)

This will:
- ✅ Drop ALL existing policies (no conflicts!)
- ✅ Create new policies that allow customer order creation
- ✅ Keep security restrictions for UPDATE/DELETE

### Step 3: Verify It Worked
Run this verification query:

```sql
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
GROUP BY tablename;
```

**Expected Result:**
- orders: 6 total (2 INSERT, 2 SELECT, 1 UPDATE, 1 DELETE)
- order_items: 6 total (2 INSERT, 2 SELECT, 1 UPDATE, 1 DELETE)

## That's It!
Once you see the expected results, customers will be able to create orders! 🎉
