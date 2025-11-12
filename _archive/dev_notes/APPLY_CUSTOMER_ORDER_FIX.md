# Apply Customer Order Creation Fix

## Quick Instructions

Since your remote Supabase has tables that were created manually (not via migrations), we need to apply the RLS policy fix directly through the Supabase SQL Editor.

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Migration

Copy and paste the entire contents of this file:
`supabase/migrations/20251111000003_fix_customer_order_creation_rls.sql`

**IMPORTANT:** The migration file has been fixed to remove the problematic DO blocks that were causing syntax errors.

Then click "Run" or press Cmd+Enter

### Step 3: Verify the Policies

After running the migration, run this verification query:

```sql
-- Check policies on orders table
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY cmd, policyname;

-- Check policies on order_items table
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'order_items' 
ORDER BY cmd, policyname;
```

You should see:
- **orders table**: 2 INSERT policies, 2 SELECT policies, 1 UPDATE policy, 1 DELETE policy
- **order_items table**: 2 INSERT policies, 2 SELECT policies, 1 UPDATE policy, 1 DELETE policy

### Expected Output

```
Orders Table Policies:
- DELETE: Admin can delete orders
- INSERT: Authenticated can insert orders
- INSERT: Public can insert orders
- SELECT: Authenticated can view orders
- SELECT: Public can view orders
- UPDATE: Staff can update orders

Order Items Table Policies:
- DELETE: Admin can delete order_items
- INSERT: Authenticated can insert order_items
- INSERT: Public can insert order_items
- SELECT: Authenticated can view order_items
- SELECT: Public can view order_items
- UPDATE: Staff can update order_items
```

## Alternative: Run via Command Line

If you prefer, you can also run the SQL file directly:

```bash
# This will open the SQL file content - copy it and paste into Supabase SQL Editor
cat supabase/migrations/20251111000003_fix_customer_order_creation_rls.sql
```

## What This Fix Does

✅ Allows anonymous customers to INSERT orders and order_items (fixes the bug)
✅ Allows authenticated customers to INSERT orders and order_items
✅ Restricts UPDATE operations to staff only (admin, cashier, kitchen)
✅ Restricts DELETE operations to admin only
✅ Maintains security while enabling customer order creation

## After Applying

Once you've run the migration in Supabase SQL Editor, come back here and I'll help you test it!
