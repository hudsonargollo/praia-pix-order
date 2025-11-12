# Test Admin Features - RLS Policies Applied ✅

## Status: Policies Already Applied Successfully!

The error you saw means the policies were **already created** by your first SQL run. This is actually good - it means the fix is in place!

---

## Quick Tests to Run Now

### Test 1: Edit Products ✅
**URL**: https://coco-loko-acaiteria.pages.dev/admin/products

**Steps**:
1. Login as admin
2. Navigate to `/admin/products`
3. Click "Editar Produto" on any product
4. Change the name or price
5. Click "Salvar"

**Expected**: 
- ✅ Dialog opens
- ✅ Changes save
- ✅ Success toast appears
- ✅ No errors in console

---

### Test 2: Edit Orders ✅
**URL**: https://coco-loko-acaiteria.pages.dev/cashier

**Steps**:
1. Login as admin
2. Navigate to `/cashier`
3. Find any order (pending, in progress, or ready)
4. Click "Editar" button
5. Try to:
   - Add a new item from the menu
   - Change quantity of an item
   - Remove an item (if more than 1 item)
6. Click "Salvar Alterações"

**Expected**:
- ✅ Dialog opens
- ✅ Order items load
- ✅ Can add items
- ✅ Can change quantities
- ✅ Can remove items
- ✅ Total updates
- ✅ Changes save
- ✅ Success toast appears
- ✅ No errors in console

---

### Test 3: Cancel Orders ✅
**URL**: https://coco-loko-acaiteria.pages.dev/cashier

**Steps**:
1. Find any order
2. Click "Cancelar" button
3. Confirm cancellation

**Expected**:
- ✅ Confirmation dialog appears
- ✅ Order status updates to "cancelled"
- ✅ Order moves to cancelled tab
- ✅ Success toast appears

---

### Test 4: Waiter Management ✅
**URL**: https://coco-loko-acaiteria.pages.dev/waiter-management

**Steps**:
1. Navigate to `/waiter-management`
2. Check if waiters list loads
3. Try to create a new waiter
4. Try to delete a waiter

**Expected**:
- ✅ Waiters list loads (no "Nenhum garçom cadastrado" error)
- ✅ Can create new waiter
- ✅ Can delete waiter
- ✅ No Edge Function errors

**Note**: If waiter list still doesn't load, this is a separate Edge Function issue, not an RLS policy issue.

---

## What to Check

### ✅ If Everything Works:
Great! The RLS policies are working correctly. All admin features should now be functional.

### ❌ If Product Edit Doesn't Work:
1. Check browser console for errors
2. Verify you're logged in as admin
3. Check that your user has `role: 'admin'` in metadata
4. Try logout/login

### ❌ If Order Edit Doesn't Work:
1. Check browser console for specific error
2. Look for RLS policy errors
3. Verify the policies are active:
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'order_items';
   ```
   Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

### ❌ If Waiter List Doesn't Load:
This is likely an Edge Function issue, not RLS. The Edge Function `list-waiters` may need:
- SUPABASE_SERVICE_ROLE_KEY environment variable
- Redeployment
- Check Edge Function logs in Supabase Dashboard

---

## Verify Policies Are Active

Run this in Supabase SQL Editor to confirm:

```sql
-- Check order_items policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY cmd;

-- Should show:
-- DELETE | Staff can delete order items
-- INSERT | Staff can insert order items  
-- SELECT | Public can view order items
-- UPDATE | Staff can update order items
```

---

## Next Steps

1. **Test each feature** using the steps above
2. **Document results** - which ones work, which don't
3. **Report back** with any specific errors

If all tests pass, you're done! ✅

If some tests fail, let me know which specific feature and what error you see, and I'll help fix it.

---

**Status**: RLS Policies Applied ✅  
**Ready**: Yes, test now!  
**Time**: 5-10 minutes to test all features
