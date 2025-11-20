# Cashier/Admin Order Flow Changes

## Overview

Extended the waiter order flow to also apply to cashier/admin users, allowing them to create orders that go directly to the kitchen without payment.

## Changes Made

### 1. Modified Checkout Flow (`src/pages/customer/Checkout.tsx`)

**Detection Logic:**
```typescript
const userRole = user?.user_metadata?.role;
const isWaiter = userRole === 'waiter';
const isAdmin = userRole === 'admin' || userRole === 'cashier';
const isStaff = isWaiter || isAdmin;
```

**Cashier Order Creation:**
```typescript
{
  customer_name: capitalizedName,
  customer_phone: normalizedPhone,
  table_number: '-',
  status: 'in_preparation',        // ← Goes directly to preparation
  payment_status: 'pending',        // ← Payment still pending
  total_amount: totalAmount,
  created_by_cashier: true,        // ← Tagged as cashier order
  cashier_id: user.id              // ← Cashier who created it
}
```

### 2. Database Schema (`supabase/migrations/20251120000002_add_cashier_order_fields.sql`)

**New Fields:**
- `created_by_cashier` (BOOLEAN) - Flag to identify cashier orders
- `cashier_id` (UUID) - References the cashier/admin who created the order

**Indexes:**
- `idx_orders_created_by_cashier` - For efficient filtering
- `idx_orders_cashier_id` - For cashier reporting

**RLS Policies:**
- Cashiers can insert orders with `created_by_cashier = true`
- Cashiers can update their own orders

### 3. UI Components

**OrderCardInfo.tsx:**
- Added `cashierId` and `createdByCashier` props
- Displays "🏪 CAIXA" badge for cashier orders
- Blue badge to distinguish from waiter orders (purple)

**CompactOrderCard.tsx:**
- Passes cashier fields to OrderCardInfo
- Displays CAIXA badge in order cards

## Features Implemented

### ✅ 1. No Payment Page for Cashier
- Cashier orders skip payment page
- Orders go directly to "in_preparation" status
- Same behavior as waiter orders

### ✅ 2. Payment Pending Status
- `payment_status` remains 'pending'
- Payment can be generated later from cashier panel

### ✅ 3. CAIXA Tag
- Orders tagged with `created_by_cashier = true`
- Displays "🏪 CAIXA" badge in blue
- Distinguishes from waiter orders

### ✅ 4. Redirect to Cashier Panel
- After order creation, redirects to `/staff/cashier`
- Can immediately see the new order
- Can generate payment from there

### ✅ 5. Generate Payment from Panel
- "Gerar PIX" button available in cashier panel
- Works for orders with `payment_status='pending'`
- Same functionality as waiter dashboard

### ✅ 6. Auto WhatsApp Notification
- Sends "Order Preparing" notification immediately
- Customer informed order is being prepared
- No manual intervention needed

### ✅ 7. Auto Kitchen Print
- Kitchen auto-print triggers automatically
- Prints when order reaches "in_preparation"
- Same as waiter orders

## Order Status Flow

### Cashier Orders
```
Created (in_preparation, payment_status: pending)
    ↓
Kitchen receives & prints automatically
    ↓
Cashier generates PIX from panel
    ↓
Customer pays
    ↓
Payment confirmed (payment_status: confirmed)
    ↓
Order continues normal flow (ready → completed)
```

### Comparison Table

| Aspect | Customer Order | Waiter Order | Cashier Order |
|--------|---------------|--------------|---------------|
| **Initial Status** | `pending_payment` | `in_preparation` | `in_preparation` |
| **Payment Status** | `pending` | `pending` | `pending` |
| **Redirect After Creation** | `/payment/{orderId}` | `/waiter/dashboard` | `/staff/cashier` |
| **WhatsApp Notification** | "Order Created with Links" | "Order Preparing" | "Order Preparing" |
| **Kitchen Visibility** | After payment | Immediate | Immediate |
| **Auto-Print** | After payment | Immediate | Immediate |
| **Payment Generation** | Automatic on payment page | From waiter dashboard | From cashier panel |
| **Tag/Badge** | None | Purple "Garçom" | Blue "CAIXA" |
| **Commission Tracking** | No | Yes (10%) | No |
| **Tracking Field** | - | `waiter_id` | `cashier_id` |
| **Flag Field** | - | `created_by_waiter` | `created_by_cashier` |

## Database Schema

### New Fields in `orders` Table

```sql
-- Flag to identify cashier orders
created_by_cashier BOOLEAN DEFAULT FALSE

-- Track which cashier created the order
cashier_id UUID REFERENCES auth.users(id)
```

### Indexes

```sql
-- Efficient filtering of cashier orders
CREATE INDEX idx_orders_created_by_cashier 
ON orders(created_by_cashier) 
WHERE created_by_cashier = true;

-- Efficient cashier reporting
CREATE INDEX idx_orders_cashier_id 
ON orders(cashier_id) 
WHERE cashier_id IS NOT NULL;
```

## Testing Checklist

### Cashier Order Flow
- [ ] Login as admin/cashier
- [ ] Click "Criar Pedido" button
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] Enter customer name and phone
- [ ] Confirm order
- [ ] Verify redirect to `/staff/cashier`
- [ ] Verify order appears with "Em Preparo" status
- [ ] Verify order shows "Pagamento Pendente"
- [ ] Verify "🏪 CAIXA" badge displays
- [ ] Verify customer receives WhatsApp notification
- [ ] Verify kitchen receives order
- [ ] Verify kitchen auto-prints (if enabled)
- [ ] Click "Gerar PIX" on order
- [ ] Verify PIX QR code generates
- [ ] Verify customer can pay
- [ ] Verify payment confirmation updates status

### Verify Other Flows Unchanged
- [ ] Customer orders still go to payment page
- [ ] Waiter orders still work correctly
- [ ] Waiter badge still shows (purple)
- [ ] Cashier badge shows for cashier orders (blue)

## Database Verification Queries

### Check Cashier Orders
```sql
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.status,
  o.payment_status,
  o.total_amount,
  o.created_by_cashier,
  o.cashier_id,
  p.email as cashier_email,
  o.created_at
FROM orders o
LEFT JOIN auth.users p ON o.cashier_id = p.id
WHERE o.created_by_cashier = true
ORDER BY o.created_at DESC
LIMIT 10;
```

### Check All Order Types
```sql
SELECT 
  CASE 
    WHEN created_by_waiter THEN 'Waiter'
    WHEN created_by_cashier THEN 'Cashier'
    ELSE 'Customer'
  END as order_type,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue
FROM orders
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY order_type;
```

### Check Order Distribution
```sql
SELECT 
  status,
  payment_status,
  created_by_waiter,
  created_by_cashier,
  COUNT(*) as count
FROM orders
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY status, payment_status, created_by_waiter, created_by_cashier
ORDER BY count DESC;
```

## Benefits

1. **Consistent Staff Experience**: Waiters and cashiers have same workflow
2. **Faster Service**: Kitchen starts immediately, payment later
3. **Flexible Payment**: Payment generated when customer is ready
4. **Clear Identification**: CAIXA badge distinguishes order source
5. **Better Tracking**: Can report on cashier performance
6. **Automatic Notifications**: Customer informed immediately
7. **Kitchen Integration**: Orders print automatically

## Edge Cases Handled

### 1. Cashier Creates Order But Customer Doesn't Pay
- Order stays in "in_preparation" with "payment_status: pending"
- Cashier can generate PIX anytime
- Order can be cancelled if needed

### 2. Multiple Cashiers Creating Orders
- Each order tagged with correct `cashier_id`
- Can track which cashier created which order
- Useful for performance reporting

### 3. Cashier vs Waiter Orders
- Both go to kitchen immediately
- Waiter orders show purple badge + commission
- Cashier orders show blue CAIXA badge + no commission
- Easy to distinguish in reports

### 4. Admin Role vs Cashier Role
- Both treated the same for order creation
- Both redirect to `/staff/cashier`
- Both tagged as `created_by_cashier`

## Migration Required

**Before deploying**, apply the database migration:

```bash
# Via Supabase Dashboard
# Copy SQL from: supabase/migrations/20251120000002_add_cashier_order_fields.sql
# Paste in SQL Editor and run

# Or via Supabase CLI
npx supabase db push
```

## Rollback Procedure

If issues arise:

1. **Code Rollback**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Database Rollback** (if needed):
   ```sql
   -- Remove new fields
   ALTER TABLE orders DROP COLUMN IF EXISTS created_by_cashier;
   ALTER TABLE orders DROP COLUMN IF EXISTS cashier_id;
   
   -- Remove indexes
   DROP INDEX IF EXISTS idx_orders_created_by_cashier;
   DROP INDEX IF EXISTS idx_orders_cashier_id;
   
   -- Remove policies
   DROP POLICY IF EXISTS "Cashiers can create orders" ON orders;
   DROP POLICY IF EXISTS "Cashiers can update their orders" ON orders;
   ```

## Future Enhancements

Potential improvements:

1. **Cashier Performance Reports**: Track orders created per cashier
2. **Cashier Leaderboard**: Gamify order creation
3. **Custom Cashier Tags**: Allow custom names instead of "CAIXA"
4. **Cashier Notes**: Add notes field for cashier orders
5. **Cashier Preferences**: Save preferred settings per cashier

---

**Status**: ✅ Implemented and Ready for Testing
**Date**: 2024-11-20
**Version**: 1.0.0
**Related**: WAITER_ORDER_FLOW_CHANGES.md
