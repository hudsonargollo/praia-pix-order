# Waiter Edit Permissions Migration

## Overview

This migration implements the ability for waiters to edit unpaid orders, with comprehensive audit logging and proper RLS policies.

**Migration Files:**
- `20251114000002_update_waiter_edit_permissions.sql` - Main migration
- `20251114000003_test_waiter_edit_permissions.sql` - Test suite

## Features Implemented

### 1. Audit Logging System

**Table:** `order_audit_log`

Tracks all order modifications with:
- User ID and role
- Action type (update, delete, status_change, items_modified)
- Old and new values (JSON snapshots)
- Changed fields array
- Timestamp and metadata

**Trigger:** `audit_order_modifications`

Automatically logs changes when orders are updated or deleted.

### 2. Updated RLS Policies

#### Orders Table

**Policy:** `Waiters can edit unpaid orders`

Allows waiters to update orders when:
- User has 'waiter' role
- Order belongs to the waiter (waiter_id matches)
- Order status is 'pending', 'pending_payment', or 'in_preparation'

#### Order Items Table

**Policies:**
- `Waiters can update order items for unpaid orders`
- `Waiters can delete order items from unpaid orders`
- `Staff can update order items`
- `Staff can delete order items`

**Note on INSERT policies:** The existing `Public can insert order_items` and `Authenticated can insert order_items` policies are preserved because customers need to create orders via QR code. Waiters can add items to orders using these same policies.

### 3. Helper Functions

**Function:** `can_edit_order(order_id UUID)`

Returns boolean indicating if current user can edit the specified order.

**View:** `editable_orders`

Shows all orders with `is_editable` and `is_unpaid` flags for the current user.

## Requirements Addressed

- **8.1**: Waiters can add items to orders with status "pending" or "in_preparation"
- **8.2**: Order totals and commissions update when items are added
- **8.3**: Prevents editing paid/completed orders
- **8.4**: Kitchen display updates with new items (via realtime)
- **8.5**: All modifications are logged for audit purposes
- **9.5**: Appropriate permissions for different user roles
- **10.1-10.5**: Reliable order number generation (already implemented)

## Testing

### Automated Tests

Run the test migration in Supabase SQL Editor:

```sql
-- Apply the test migration
\i supabase/migrations/20251114000003_test_waiter_edit_permissions.sql
```

Expected results:
- ✅ All 8 tests should PASS or show INFO status
- ✅ All RLS policies should be listed
- ✅ Audit log table should exist (empty initially)

### Manual Testing Scenarios

#### Test 1: Waiter Edits Own Unpaid Order

```sql
-- As a waiter user, update an unpaid order
UPDATE public.orders 
SET order_notes = 'Customer requested extra napkins'
WHERE id = '<order_id>'
AND waiter_id = auth.uid()
AND status IN ('pending', 'pending_payment', 'in_preparation');

-- Verify audit log
SELECT * FROM public.order_audit_log 
WHERE order_id = '<order_id>'
ORDER BY created_at DESC;
```

**Expected:** Update succeeds, audit log entry created

#### Test 2: Waiter Tries to Edit Paid Order

```sql
-- As a waiter user, try to update a paid order
UPDATE public.orders 
SET order_notes = 'This should fail'
WHERE id = '<paid_order_id>'
AND waiter_id = auth.uid()
AND status = 'completed';
```

**Expected:** Update fails (no rows affected), no audit log entry

#### Test 3: Waiter Tries to Edit Another Waiter's Order

```sql
-- As a waiter user, try to update another waiter's order
UPDATE public.orders 
SET order_notes = 'This should also fail'
WHERE id = '<other_waiter_order_id>'
AND waiter_id != auth.uid();
```

**Expected:** Update fails (no rows affected), no audit log entry

#### Test 4: Waiter Adds Item to Unpaid Order

```sql
-- As a waiter user, add an item to an unpaid order
INSERT INTO public.order_items (order_id, menu_item_id, quantity, unit_price, item_name)
SELECT 
  '<order_id>',
  id,
  1,
  price,
  name
FROM public.menu_items
WHERE name = 'Coca-Cola lata'
LIMIT 1;

-- Verify the item was added
SELECT * FROM public.order_items WHERE order_id = '<order_id>';
```

**Expected:** Insert succeeds, item appears in order

#### Test 5: Waiter Deletes Item from Unpaid Order

```sql
-- As a waiter user, delete an item from an unpaid order
DELETE FROM public.order_items
WHERE id = '<order_item_id>'
AND order_id IN (
  SELECT id FROM public.orders
  WHERE waiter_id = auth.uid()
  AND status IN ('pending', 'pending_payment', 'in_preparation')
);
```

**Expected:** Delete succeeds, item removed from order

#### Test 6: Check Editability with Helper Function

```sql
-- Check if an order is editable
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.waiter_id,
  public.can_edit_order(o.id) as can_edit
FROM public.orders o
WHERE o.waiter_id = auth.uid()
ORDER BY o.created_at DESC
LIMIT 10;
```

**Expected:** Returns correct editability status for each order

#### Test 7: View Editable Orders

```sql
-- View all editable orders for current user
SELECT 
  id,
  order_number,
  status,
  total_amount,
  is_editable,
  is_unpaid
FROM public.editable_orders
WHERE waiter_id = auth.uid()
ORDER BY created_at DESC;
```

**Expected:** Shows orders with correct editability flags

### Frontend Integration Testing

1. **Login as Waiter**
   - Navigate to waiter dashboard
   - Verify unpaid orders show edit button

2. **Edit Unpaid Order**
   - Click edit on an unpaid order
   - Add/remove items
   - Update order notes
   - Save changes
   - Verify changes persist

3. **Try to Edit Paid Order**
   - Verify paid orders don't show edit button
   - Or edit button is disabled with tooltip

4. **Check Commission Updates**
   - Edit an order by adding items
   - Verify commission recalculates correctly
   - Check commission display updates in real-time

5. **Verify Audit Trail (Admin)**
   - Login as admin
   - View audit logs for modified orders
   - Verify all changes are logged with correct details

## Security Considerations

### RLS Policy Security

- ✅ Waiters can only edit their own orders
- ✅ Waiters can only edit unpaid orders
- ✅ Staff roles maintain their existing permissions
- ✅ Audit logs are only viewable by admins
- ✅ All modifications are logged automatically

### Data Integrity

- ✅ Order totals recalculate via existing triggers
- ✅ Commission amounts update automatically
- ✅ Status transitions are controlled
- ✅ Audit trail is immutable (insert-only)

### Performance

- ✅ Indexes on audit log for efficient querying
- ✅ Efficient RLS policy evaluation
- ✅ Minimal overhead from audit trigger

## Rollback Procedure

If issues arise, rollback by:

```sql
-- Drop new policies
DROP POLICY IF EXISTS "Waiters can edit unpaid orders" ON public.orders;
DROP POLICY IF EXISTS "Waiters can update order items for unpaid orders" ON public.order_items;
DROP POLICY IF EXISTS "Waiters can delete order items from unpaid orders" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can delete order items" ON public.order_items;

-- Drop audit system
DROP TRIGGER IF EXISTS audit_order_modifications ON public.orders;
DROP FUNCTION IF EXISTS public.log_order_modification();
DROP TABLE IF EXISTS public.order_audit_log;

-- Drop helper function and view
DROP VIEW IF EXISTS public.editable_orders;
DROP FUNCTION IF EXISTS public.can_edit_order(UUID);

-- Restore previous policies (if needed)
-- See migration 20251110000001_enhance_waiter_order_management.sql
```

## Monitoring

### Check Audit Log Activity

```sql
-- Recent modifications
SELECT 
  al.created_at,
  al.user_role,
  al.action,
  al.changed_fields,
  o.order_number,
  o.status
FROM public.order_audit_log al
JOIN public.orders o ON o.id = al.order_id
ORDER BY al.created_at DESC
LIMIT 20;

-- Modifications by user
SELECT 
  u.email,
  u.raw_user_meta_data ->> 'full_name' as name,
  COUNT(*) as modification_count,
  MAX(al.created_at) as last_modification
FROM public.order_audit_log al
JOIN auth.users u ON u.id = al.user_id
GROUP BY u.id, u.email, u.raw_user_meta_data
ORDER BY modification_count DESC;
```

### Check Policy Effectiveness

```sql
-- Orders edited by waiters
SELECT 
  DATE(al.created_at) as date,
  COUNT(DISTINCT al.order_id) as orders_edited,
  COUNT(*) as total_modifications
FROM public.order_audit_log al
WHERE al.user_role = 'waiter'
GROUP BY DATE(al.created_at)
ORDER BY date DESC;
```

## Next Steps

1. Apply migration to development environment
2. Run automated tests
3. Perform manual testing scenarios
4. Test frontend integration
5. Monitor audit logs
6. Apply to staging environment
7. Final testing in staging
8. Apply to production with monitoring

## Support

For issues or questions:
1. Check audit logs for error details
2. Verify user roles are set correctly
3. Confirm order statuses are as expected
4. Review RLS policy evaluation in Supabase logs
