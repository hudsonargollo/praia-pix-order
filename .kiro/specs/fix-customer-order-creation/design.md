# Design Document: Fix Customer Order Creation

## Overview

The customer order creation flow is currently blocked by overly restrictive RLS policies on the `orders` and `order_items` tables. This design outlines a comprehensive fix that:

1. Updates RLS policies to allow customer order creation
2. Maintains security for other database operations
3. Adds better error handling and logging
4. Ensures both customer and waiter-assisted orders work correctly

## Architecture

### Current State

```
Customer → Menu → Checkout → supabase.from('orders').insert() → ❌ RLS BLOCKED
```

### Target State

```
Customer → Menu → Checkout → supabase.from('orders').insert() → ✅ SUCCESS → Payment
Waiter → Menu → Checkout → supabase.from('orders').insert() → ✅ SUCCESS → Menu
```

## Components and Interfaces

### 1. Database RLS Policies

#### Orders Table Policies

**INSERT Policies (Allow All)**
- `"Public can insert orders"` - Allows anonymous users to create orders
- `"Authenticated can insert orders"` - Allows authenticated users to create orders
- Both policies use `WITH CHECK (true)` to allow all inserts

**SELECT Policies (View Access)**
- `"Public can view orders"` - Allows anonymous users to view orders (for payment page)
- `"Authenticated can view orders"` - Allows authenticated users to view orders
- `"Staff can view all orders"` - Allows staff to view all orders

**UPDATE Policies (Staff Only)**
- `"Staff can update orders"` - Restricts updates to users with admin, cashier, or kitchen roles
- Uses `has_role()` function to check user permissions

**DELETE Policies (Admin Only)**
- `"Admin can delete orders"` - Restricts deletes to admin users only

#### Order Items Table Policies

**INSERT Policies (Allow All)**
- `"Public can insert order_items"` - Allows anonymous users to create order items
- `"Authenticated can insert order_items"` - Allows authenticated users to create order items

**SELECT Policies (View Access)**
- `"Public can view order_items"` - Allows viewing order items
- `"Authenticated can view order_items"` - Allows authenticated viewing

**UPDATE/DELETE Policies (Staff Only)**
- `"Staff can update order_items"` - Restricts updates to staff
- `"Admin can delete order_items"` - Restricts deletes to admin

### 2. Frontend Error Handling

#### Checkout Component Enhancements

**Error Logging**
```typescript
try {
  // Order creation logic
} catch (error) {
  console.error("❌ Order creation failed:", {
    error,
    errorMessage: error.message,
    errorDetails: error.details,
    errorHint: error.hint,
    errorCode: error.code,
    userAuth: await supabase.auth.getUser(),
    orderData,
    cartItems: cartState.items
  });
  
  toast.error("Erro ao criar pedido. Por favor, tente novamente.");
}
```

**User Feedback**
- Clear error messages for customers
- Cart preservation on failure
- Retry capability
- Loading states during submission

### 3. Database Migration

**Migration File Structure**
```sql
-- 1. Drop existing restrictive policies
-- 2. Create new permissive INSERT policies
-- 3. Create restrictive UPDATE/DELETE policies
-- 4. Verify policies are applied
-- 5. Test with sample data
```

## Data Models

### Orders Table (No Changes)

```typescript
interface Order {
  id: string;
  customer_name: string;
  customer_phone: string; // Format: +55XXXXXXXXXXX
  table_number: string;
  status: 'pending' | 'pending_payment' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  waiter_id: string | null;
  order_notes: string | null;
  created_by_waiter: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### Order Items Table (No Changes)

```typescript
interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  item_name: string;
  created_at: timestamp;
}
```

## Error Handling

### RLS Policy Errors

**Detection**
- Error code: `42501` (insufficient_privilege)
- Error message contains: "policy" or "permission"

**Response**
- Log full error details
- Show user-friendly message
- Preserve cart state
- Allow retry

### Network Errors

**Detection**
- Network timeout
- Connection refused
- DNS resolution failure

**Response**
- Show connectivity error message
- Preserve cart state
- Suggest checking internet connection

### Validation Errors

**Detection**
- Missing required fields
- Invalid phone format
- Empty cart

**Response**
- Highlight invalid fields
- Show specific validation messages
- Prevent submission until fixed

## Testing Strategy

### 1. Database Policy Testing

**Test Cases**
- ✅ Anonymous user can INSERT orders
- ✅ Anonymous user can INSERT order_items
- ✅ Authenticated non-staff user can INSERT orders
- ✅ Waiter can INSERT orders with waiter_id
- ❌ Anonymous user cannot UPDATE orders
- ❌ Anonymous user cannot DELETE orders
- ✅ Admin can UPDATE orders
- ✅ Admin can DELETE orders

### 2. Frontend Flow Testing

**Customer Order Flow**
1. Browse menu as anonymous user
2. Add items to cart
3. Fill customer info form
4. Submit order
5. Verify redirect to payment
6. Verify order created in database

**Waiter Order Flow**
1. Login as waiter
2. Browse menu
3. Add items to cart
4. Fill customer info form
5. Submit order
6. Verify redirect to menu
7. Verify order has waiter_id set

### 3. Error Scenario Testing

**RLS Policy Failure**
- Simulate policy block
- Verify error logging
- Verify user message
- Verify cart preservation

**Network Failure**
- Simulate network error
- Verify error handling
- Verify retry capability

## Implementation Steps

### Phase 1: Database Migration
1. Create migration file with new RLS policies
2. Test migration in local Supabase
3. Verify policies with SQL queries
4. Apply to production database

### Phase 2: Frontend Enhancements
1. Add detailed error logging to Checkout component
2. Improve error messages for users
3. Add authentication status logging
4. Test error scenarios

### Phase 3: Verification
1. Test customer order creation (anonymous)
2. Test customer order creation (authenticated)
3. Test waiter order creation
4. Verify all error scenarios
5. Monitor production logs

## Security Considerations

### Allowed Operations
- **INSERT orders**: Public access (required for customer orders)
- **INSERT order_items**: Public access (required for customer orders)
- **SELECT orders**: Public access (required for payment page)

### Restricted Operations
- **UPDATE orders**: Staff only (prevents customer tampering)
- **DELETE orders**: Admin only (prevents accidental deletion)
- **UPDATE order_items**: Staff only
- **DELETE order_items**: Admin only

### Rationale
- Orders are immutable after creation from customer perspective
- Staff can update order status through protected routes
- Payment verification happens server-side
- Customer phone number used for order lookup (not user ID)

## Rollback Plan

If issues occur after deployment:

1. **Immediate**: Revert to previous RLS policies
2. **Database**: Run rollback migration
3. **Frontend**: No changes needed (backward compatible)
4. **Monitoring**: Check error logs for root cause
5. **Fix**: Address issues and redeploy

## Success Metrics

- ✅ Zero RLS policy errors in logs
- ✅ Customer order creation success rate > 99%
- ✅ Average order creation time < 2 seconds
- ✅ No unauthorized order modifications
- ✅ All test cases passing
