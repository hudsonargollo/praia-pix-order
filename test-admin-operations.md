# Admin Operations Test Guide

## RLS Policies Applied ✅

The migration `20251111000002_fix_admin_rls_policies.sql` has been applied, which adds:

### Order Items Policies
- ✅ Staff can INSERT order items
- ✅ Staff can UPDATE order items  
- ✅ Staff can DELETE order items

### Orders Policies
- ✅ Admin has full access to orders

### Menu Items Policies
- ✅ Admin can manage menu items (verified)

### Menu Categories Policies
- ✅ Admin can manage menu categories

## Testing Checklist

### Test 1: Edit Products ✅
**URL**: `/admin/products`

**Steps**:
1. Navigate to admin products page
2. Click "Editar Produto" on any product
3. Change the name or price
4. Click "Salvar"
5. Verify changes persist

**Expected Result**:
- ✅ Dialog opens
- ✅ Form populates with current data
- ✅ Changes save successfully
- ✅ Success toast appears
- ✅ Product list updates
- ✅ No console errors

**Status**: ⏳ Ready to test

---

### Test 2: Edit Orders ✅
**URL**: `/cashier`

**Steps**:
1. Navigate to cashier page
2. Find any order (pending, in progress, or ready)
3. Click "Editar" button
4. Try to:
   - Add a new item
   - Remove an item (if more than 1)
   - Change quantity
5. Click "Salvar Alterações"
6. Verify changes persist

**Expected Result**:
- ✅ Dialog opens
- ✅ Order items load
- ✅ Can add items from menu
- ✅ Can remove items (except last one)
- ✅ Can change quantities
- ✅ Total updates correctly
- ✅ Changes save successfully
- ✅ Success toast appears
- ✅ Order list updates
- ✅ No console errors

**Status**: ⏳ Ready to test

---

### Test 3: Cancel Orders ✅
**URL**: `/cashier`

**Steps**:
1. Navigate to cashier page
2. Find any order
3. Click "Cancelar" button
4. Confirm cancellation
5. Verify order moves to cancelled tab

**Expected Result**:
- ✅ Confirmation dialog appears
- ✅ Order status updates to "cancelled"
- ✅ Order moves to cancelled tab
- ✅ Success toast appears
- ✅ No console errors

**Status**: ⏳ Ready to test

---

### Test 4: Waiter Management ✅
**URL**: `/waiter-management`

**Steps**:
1. Navigate to waiter management page
2. Verify waiters list loads (should see existing waiters)
3. Click "Novo Garçom"
4. Fill in:
   - Nome Completo: "Test Waiter"
   - Email: "test.waiter@example.com"
   - Senha: "test123456"
5. Click "Criar Garçom"
6. Verify waiter appears in list
7. Click delete button on test waiter
8. Confirm deletion
9. Verify waiter is removed

**Expected Result**:
- ✅ Waiters list loads (no "Nenhum garçom cadastrado" error)
- ✅ Can create new waiter
- ✅ Can delete waiter
- ✅ Success toasts appear
- ✅ No console errors
- ✅ No Edge Function errors

**Status**: ⏳ Ready to test

---

## Common Issues and Solutions

### Issue: "Nenhum garçom cadastrado" but waiters exist
**Cause**: Edge Function `list-waiters` returning 500 error
**Solution**: Check Edge Function logs, verify SUPABASE_SERVICE_ROLE_KEY is set

### Issue: Cannot edit products
**Cause**: RLS policy blocking updates
**Solution**: ✅ Fixed by migration (admin can manage menu items)

### Issue: Cannot edit orders
**Cause**: RLS policy blocking order_items updates
**Solution**: ✅ Fixed by migration (staff can manage order items)

### Issue: Cannot delete order items
**Cause**: RLS policy blocking deletes
**Solution**: ✅ Fixed by migration (staff can delete order items)

---

## Verification Commands

### Check if policies are applied:
```sql
-- Check order_items policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'order_items';

-- Check orders policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'orders';

-- Check menu_items policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'menu_items';
```

### Check if has_role function exists:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'has_role';
```

---

## Next Steps

1. **Test Each Feature**: Go through the checklist above
2. **Document Results**: Mark each test as ✅ or ❌
3. **Report Issues**: If any test fails, note the specific error
4. **Deploy if Needed**: If all tests pass, deploy to production

---

## Production Deployment

Once all tests pass locally:

```bash
# Build
npm run build

# Deploy
bash deploy.sh
```

**Note**: The RLS policy migration needs to be applied to production database as well.

---

## Rollback Plan

If issues occur, you can rollback the RLS policies:

```sql
-- Rollback order_items policies
DROP POLICY IF EXISTS "Staff can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can delete order items" ON public.order_items;

-- Rollback admin orders policy
DROP POLICY IF EXISTS "Admin full access to orders" ON public.orders;
```

---

**Status**: ✅ RLS Policies Applied - Ready for Testing
**Date**: November 11, 2025
**Migration**: 20251111000002_fix_admin_rls_policies.sql
