# Fix: Waiter Orders Not Appearing in Admin Panel

## Problem Summary

Waiter orders are not appearing in the admin panel, and the waiter order count and commission tracking are not working correctly.

## Root Causes Identified

1. **Database Schema**: Need to verify all required columns exist:
   - `waiter_id` - Links order to waiter
   - `commission_amount` - Stores 10% commission
   - `created_by_waiter` - Flags waiter-created orders
   - `order_notes` - Special instructions

2. **Commission Calculation**: Orders may not have commission amounts calculated

3. **Frontend Query Logic**: AdminWaiterReports component needs to properly use database commission values

## Solution

### Step 1: Apply Database Fix

Run the SQL script in Supabase SQL Editor:

```bash
# File: fix-waiter-orders-tracking.sql
```

This script will:
- ✅ Verify/add all required columns
- ✅ Update commission calculation function
- ✅ Backfill commission amounts for existing orders
- ✅ Create performance indexes
- ✅ Display verification results

### Step 2: Verify Frontend Code

The AdminWaiterReports component has been updated to:
- ✅ Use database `commission_amount` field (with fallback calculation)
- ✅ Include all paid/in-progress orders in statistics (not just completed)
- ✅ Properly calculate gross sales and commissions

### Step 3: Test the Fix

Run the test script to verify everything is working:

```bash
npx tsx test-waiter-orders-admin-panel.ts
```

This will check:
- Database schema completeness
- Waiter accounts existence
- Orders with waiter_id
- Commission calculations
- Statistics accuracy

## How Waiter Orders Work

### Order Creation Flow

1. **Waiter logs in** with waiter role credentials
2. **Navigates to menu** and creates order for customer
3. **Checkout page detects waiter** role and:
   - Sets `waiter_id` to waiter's user ID
   - Sets `created_by_waiter` to `true`
   - Sets initial status to `"pending"` (not `"pending_payment"`)
   - Collects customer name and phone
4. **Database trigger** automatically calculates 10% commission
5. **Order appears** in:
   - Waiter's dashboard with commission shown
   - Admin panel under waiter's name
   - Kitchen/Cashier panels for processing

### Commission Calculation

- **Rate**: 10% of order total
- **Trigger**: Automatic via database trigger on INSERT/UPDATE
- **Storage**: `commission_amount` column
- **Display**: Shows in waiter dashboard and admin reports

## Admin Panel Access

### Viewing Waiter Orders

1. **Log in as admin**
2. **Navigate to**: Admin → Garçons
3. **Click**: "Relatórios" tab
4. **Select waiter** from dropdown
5. **View**:
   - Total orders count
   - Gross sales amount
   - Total commission earned
   - Average order value
   - Detailed order list with commissions

### Statistics Shown

- **Total de Pedidos**: All orders by waiter (any status)
- **Vendas Brutas**: Sum of paid/in-progress orders
- **Comissão Total**: 10% of gross sales
- **Ticket Médio**: Average order value

## Waiter Dashboard

Waiters can see their own performance:

1. **Log in as waiter**
2. **Dashboard shows**:
   - Total sales
   - Commission earned (10%)
   - Order history
   - Performance metrics

## Database Schema

### Orders Table Columns

```sql
-- Core order fields
id uuid PRIMARY KEY
order_number integer
customer_name text
customer_phone text
total_amount numeric
status text

-- Waiter tracking fields
waiter_id uuid REFERENCES auth.users(id)
commission_amount numeric
created_by_waiter boolean DEFAULT false
order_notes text

-- Timestamps
created_at timestamp
payment_confirmed_at timestamp
ready_at timestamp
```

### Commission Trigger

```sql
CREATE TRIGGER calculate_waiter_commission_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_waiter_commission();
```

## Troubleshooting

### Orders Not Showing in Admin Panel

**Check 1**: Verify waiter_id is set
```sql
SELECT id, order_number, customer_name, waiter_id, commission_amount
FROM orders
WHERE waiter_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Check 2**: Verify waiters exist
```sql
SELECT id, email, raw_user_meta_data->>'full_name' as name
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'waiter';
```

**Check 3**: Verify commission calculation
```sql
SELECT 
  id, 
  order_number, 
  total_amount,
  commission_amount,
  (total_amount * 0.1) as expected_commission
FROM orders
WHERE waiter_id IS NOT NULL
LIMIT 10;
```

### Commission Not Calculated

Run the backfill query:
```sql
UPDATE public.orders
SET commission_amount = total_amount * 0.10
WHERE waiter_id IS NOT NULL 
  AND (commission_amount IS NULL OR commission_amount = 0);
```

### Waiter Can't Create Orders

**Check RLS policies**:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'orders' 
AND policyname LIKE '%waiter%';
```

**Verify waiter role**:
```sql
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users
WHERE email = 'waiter@example.com';
```

## Testing Checklist

- [ ] Run `fix-waiter-orders-tracking.sql` in Supabase
- [ ] Run `npx tsx test-waiter-orders-admin-panel.ts`
- [ ] Log in as waiter and create test order
- [ ] Verify order appears in waiter dashboard with commission
- [ ] Log in as admin
- [ ] Navigate to Garçons → Relatórios
- [ ] Select waiter from dropdown
- [ ] Verify order appears with correct commission
- [ ] Check statistics are accurate
- [ ] Export CSV and verify data

## Files Modified

1. **fix-waiter-orders-tracking.sql** - Database fix script
2. **src/components/AdminWaiterReports.tsx** - Updated commission calculation logic
3. **test-waiter-orders-admin-panel.ts** - Verification test script
4. **FIX_WAITER_ORDERS_ADMIN_PANEL.md** - This documentation

## Expected Results

After applying the fix:

✅ Waiter orders appear in admin panel
✅ Commission amounts are calculated automatically
✅ Statistics show correct totals
✅ Order count includes all waiter orders
✅ CSV export includes commission data
✅ Waiter dashboard shows accurate performance

## Support

If issues persist after applying the fix:

1. Check Supabase logs for errors
2. Verify all migrations are applied
3. Check browser console for frontend errors
4. Run the test script for detailed diagnostics
5. Verify RLS policies allow admin access to orders

## Related Files

- `supabase/migrations/20251108150000_add_waiter_module_fields.sql`
- `supabase/migrations/20251110000001_enhance_waiter_order_management.sql`
- `src/pages/WaiterDashboard.tsx`
- `src/pages/WaiterManagement.tsx`
- `src/pages/Checkout.tsx`
