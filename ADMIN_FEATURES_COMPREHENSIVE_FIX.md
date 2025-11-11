# Admin Features - Comprehensive Fix Plan

## Issues Identified

### 1. Edit Products - Appears to be working
**Status**: ✅ Code looks correct
**Issue**: May be a UI/UX issue or RLS policy

### 2. Edit Waiters - Intentionally Disabled
**Status**: ⚠️ Commented out
**Reason**: "Edit functionality (e.g., password reset) is complex and also requires a secure backend"

### 3. Edit/Cancel Orders - Should be working
**Status**: ✅ Code looks correct (OrderEditDialog component)
**Issue**: May be RLS policy or session issue

## Root Cause Analysis

Based on the screenshots showing console errors with Edge Functions, the main issues are likely:

1. **Edge Function Errors**: `list-waiters` returning 500 errors
2. **RLS Policies**: May be blocking admin operations
3. **Session/Auth**: Admin role not properly set or verified

## Fix Strategy

### Phase 1: Fix Edge Function Issues ✅
- Verify Edge Functions are deployed
- Check environment variables
- Test Edge Function responses

### Phase 2: Verify RLS Policies
- Check menu_items policies
- Check orders policies
- Check order_items policies
- Ensure admin role has full access

### Phase 3: Enable Waiter Edit (Optional)
- Implement password reset functionality
- Create update-waiter Edge Function
- Add edit dialog UI

### Phase 4: Test All Features
- Test product edit
- Test order edit
- Test waiter management
- Verify all operations work

## Implementation

### Fix 1: Check and Fix RLS Policies

We need to ensure admin users can:
- Read all menu_items
- Update menu_items
- Read all orders
- Update orders
- Read all order_items
- Update order_items
- Delete order_items
- Insert order_items

### Fix 2: Verify Edge Function Deployment

Check that all Edge Functions have:
- Correct environment variables
- SUPABASE_SERVICE_ROLE_KEY set
- Proper error handling
- CORS headers

### Fix 3: Add Waiter Edit Functionality

Create a new Edge Function: `update-waiter`
- Allow updating waiter name
- Allow password reset
- Maintain security

## Testing Plan

### Test 1: Product Edit
1. Navigate to `/admin/products`
2. Click "Editar Produto" on any product
3. Verify dialog opens
4. Change name or price
5. Click "Salvar"
6. Verify changes persist
7. Check for console errors

### Test 2: Order Edit
1. Navigate to `/cashier`
2. Click "Editar" on any order
3. Verify dialog opens
4. Try to add/remove items
5. Try to change quantities
6. Click "Salvar Alterações"
7. Verify changes persist
8. Check for console errors

### Test 3: Waiter Management
1. Navigate to `/waiter-management`
2. Verify waiters list loads
3. Try to create new waiter
4. Try to delete waiter
5. Check for console errors

## Next Steps

1. Run diagnostic test script
2. Check RLS policies in Supabase
3. Verify Edge Function environment variables
4. Test each feature systematically
5. Document specific errors
6. Implement fixes
7. Deploy and test again
