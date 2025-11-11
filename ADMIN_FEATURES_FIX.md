# Admin Features Fix - Diagnostic and Repair

## Issues Reported

1. **Edit Products** - Not working
2. **Edit Waiters** - Not working  
3. **Edit/Cancel Orders** - Not working on admin/cashier

## Diagnostic Steps

### 1. Check Edit Products

**File**: `src/pages/AdminProducts.tsx`

**Test**:
1. Navigate to `/admin/products`
2. Click "Editar Produto" button on any product
3. Verify dialog opens
4. Make changes
5. Click save
6. Check if changes persist

**Potential Issues**:
- Dialog not opening
- Form not submitting
- Database update failing
- RLS policy blocking update

### 2. Check Edit Waiters

**File**: `src/pages/AdminWaiters.tsx`

**Test**:
1. Navigate to `/waiter-management`
2. Check if waiters list loads
3. Look for edit button (currently commented out)
4. Check console for Edge Function errors

**Potential Issues**:
- Edit functionality commented out in code
- Edge Function `list-waiters` failing
- RLS policy issues
- Session/auth problems

### 3. Check Edit/Cancel Orders

**File**: `src/pages/Cashier.tsx` + `src/components/OrderEditDialog.tsx`

**Test**:
1. Navigate to `/cashier`
2. Click "Editar" on any order
3. Verify OrderEditDialog opens
4. Try to modify items
5. Click save
6. Check if changes persist

**Potential Issues**:
- Dialog not opening
- Items not loading
- Save operation failing
- RLS policy blocking updates

## Known Issues from Screenshots

### Console Errors Visible:
1. `POST https://...supabase.co/functions/v1/list-waiters` - 500 Internal Server Error
2. Edge Function errors related to admin operations
3. Possible RLS policy violations

### Visual Issues:
1. Waiter management shows "Nenhum garçom cadastrado" despite having waiters
2. Products page loads but edit might not work
3. Console shows multiple API errors

## Fixes to Implement

### Fix 1: Enable Waiter Edit Functionality

The edit functionality for waiters is currently commented out. We need to:
1. Uncomment the edit button
2. Implement edit dialog
3. Create update Edge Function or use direct Supabase update

### Fix 2: Debug Edge Function Errors

Check and fix:
1. `list-waiters` Edge Function
2. `create-waiter` Edge Function  
3. `delete-waiter` Edge Function

### Fix 3: Verify RLS Policies

Ensure admin users can:
1. Read all waiters
2. Update menu items
3. Update orders and order items
4. Delete waiters

### Fix 4: Check Session Management

Verify:
1. Admin session is valid
2. Auth tokens are being passed correctly
3. Service role key is configured properly

## Testing Checklist

### Products
- [ ] List products loads
- [ ] Edit button opens dialog
- [ ] Form populates with current data
- [ ] Changes save successfully
- [ ] UI updates after save
- [ ] No console errors

### Waiters
- [ ] List waiters loads
- [ ] Create waiter works
- [ ] Edit waiter works (if implemented)
- [ ] Delete waiter works
- [ ] No console errors

### Orders
- [ ] List orders loads
- [ ] Edit button opens dialog
- [ ] Order items load
- [ ] Can add/remove items
- [ ] Can update quantities
- [ ] Changes save successfully
- [ ] Total updates correctly
- [ ] Cancel button works
- [ ] No console errors

## Implementation Plan

1. **Immediate**: Check console for specific error messages
2. **Quick Fix**: Verify all Edge Functions are deployed and working
3. **Code Fix**: Uncomment and implement waiter edit functionality
4. **Database Fix**: Verify RLS policies allow admin operations
5. **Testing**: Run through all edit operations
6. **Deploy**: Push fixes to production

## Next Steps

1. Start dev server
2. Open browser console
3. Test each feature systematically
4. Document specific errors
5. Implement fixes
6. Test again
7. Deploy to production
