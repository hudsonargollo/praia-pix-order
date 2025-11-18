# Commission Calculation Documentation

## Overview

This document describes how waiter commissions are calculated in the Coco Loko Açaiteria system, with special focus on the payment status-based calculation introduced in the Waiter Payment Workflow feature.

## Table of Contents

1. [Commission Basics](#commission-basics)
2. [Payment Status Impact](#payment-status-impact)
3. [Calculation Logic](#calculation-logic)
4. [Implementation Details](#implementation-details)
5. [UI Display](#ui-display)
6. [Troubleshooting](#troubleshooting)

---

## Commission Basics

### Commission Rate

- **Default Rate**: 10% of order total
- **Configurable**: Can be adjusted per waiter or order type
- **Applied To**: Total order amount including all items

### Commission Formula

```
commission_amount = total_amount × commission_rate
```

Example:
- Order total: R$ 50.00
- Commission rate: 10%
- Commission: R$ 5.00

### When Commission is Calculated

1. **Order Creation**: Initial commission calculated based on order total
2. **Item Addition**: Commission recalculated when items added to order
3. **Payment Confirmation**: Commission becomes "confirmed" and counted in reports

---

## Payment Status Impact

### Two Types of Commission

The system tracks two separate commission values:

#### 1. Pending Commission
- Orders with `payment_status = 'pending'`
- Estimated commission, not yet earned
- Shown separately in UI
- Not included in confirmed totals
- May change if order is modified

#### 2. Confirmed Commission
- Orders with `payment_status = 'confirmed'`
- Actual earned commission
- Included in reports and totals
- Cannot be modified (order locked)
- Used for payout calculations

### Why Separate Tracking?

**Problem**: Waiters could see inflated commission numbers from unpaid orders

**Solution**: Show both pending and confirmed commissions separately

**Benefits**:
- Accurate tracking of actual earnings
- Clear visibility of potential earnings
- Prevents confusion about unpaid orders
- Enables better financial planning

---

## Calculation Logic

### Database Level

Commission is stored in the `orders` table:

```sql
CREATE TABLE orders (
  ...
  total_amount DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  ...
);
```

### Calculation on Order Creation

```sql
-- When order is created
INSERT INTO orders (
  total_amount,
  commission_amount,
  payment_status,
  waiter_id
) VALUES (
  50.00,                    -- total_amount
  50.00 * 0.10,            -- commission_amount (10%)
  'pending',               -- payment_status
  'waiter-uuid'            -- waiter_id
);
```

### Recalculation on Item Addition

```sql
-- When items are added
UPDATE orders
SET 
  total_amount = (
    SELECT SUM(price * quantity)
    FROM order_items
    WHERE order_id = orders.id
  ),
  commission_amount = (
    SELECT SUM(price * quantity) * 0.10
    FROM order_items
    WHERE order_id = orders.id
  )
WHERE id = 'order-uuid';
```

### Filtering by Payment Status

```sql
-- Get confirmed commission
SELECT 
  waiter_id,
  SUM(commission_amount) as confirmed_commission
FROM orders
WHERE waiter_id = 'waiter-uuid'
  AND payment_status = 'confirmed'
  AND created_at >= '2024-01-01'
GROUP BY waiter_id;

-- Get pending commission
SELECT 
  waiter_id,
  SUM(commission_amount) as pending_commission
FROM orders
WHERE waiter_id = 'waiter-uuid'
  AND payment_status = 'pending'
  AND created_at >= '2024-01-01'
GROUP BY waiter_id;
```

---

## Implementation Details

### TypeScript Interfaces

```typescript
interface Order {
  id: string;
  total_amount: number;
  commission_amount: number;
  payment_status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  waiter_id: string;
  created_at: string;
}

interface CommissionSummary {
  confirmedCommission: number;
  pendingCommission: number;
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
}
```

### Commission Calculation Functions

Located in `src/lib/commissionUtils.ts`:

```typescript
/**
 * Calculate confirmed commission (payment_status = 'confirmed')
 */
export function calculateConfirmedCommission(
  orders: Order[],
  startDate?: Date,
  endDate?: Date
): number {
  return orders
    .filter(order => {
      // Only confirmed payments
      if (order.payment_status !== 'confirmed') return false;
      
      // Apply date filters if provided
      if (startDate && new Date(order.created_at) < startDate) return false;
      if (endDate && new Date(order.created_at) > endDate) return false;
      
      return true;
    })
    .reduce((sum, order) => sum + (order.commission_amount || 0), 0);
}

/**
 * Calculate pending commission (payment_status = 'pending')
 */
export function calculatePendingCommission(
  orders: Order[],
  startDate?: Date,
  endDate?: Date
): number {
  return orders
    .filter(order => {
      // Only pending payments
      if (order.payment_status !== 'pending') return false;
      
      // Apply date filters
      if (startDate && new Date(order.created_at) < startDate) return false;
      if (endDate && new Date(order.created_at) > endDate) return false;
      
      return true;
    })
    .reduce((sum, order) => sum + (order.commission_amount || 0), 0);
}

/**
 * Get commission summary with both confirmed and pending
 */
export function getCommissionSummary(
  orders: Order[],
  startDate?: Date,
  endDate?: Date
): CommissionSummary {
  const filteredOrders = orders.filter(order => {
    if (startDate && new Date(order.created_at) < startDate) return false;
    if (endDate && new Date(order.created_at) > endDate) return false;
    return true;
  });

  const confirmedOrders = filteredOrders.filter(
    o => o.payment_status === 'confirmed'
  );
  const pendingOrders = filteredOrders.filter(
    o => o.payment_status === 'pending'
  );

  return {
    confirmedCommission: confirmedOrders.reduce(
      (sum, o) => sum + (o.commission_amount || 0), 
      0
    ),
    pendingCommission: pendingOrders.reduce(
      (sum, o) => sum + (o.commission_amount || 0), 
      0
    ),
    totalOrders: filteredOrders.length,
    confirmedOrders: confirmedOrders.length,
    pendingOrders: pendingOrders.length
  };
}
```

### Real-time Updates

Commission updates automatically when:

1. **Payment Confirmed**: Via MercadoPago webhook
```typescript
// In webhook handler
await supabase
  .from('orders')
  .update({ 
    payment_status: 'confirmed',
    payment_confirmed_at: new Date().toISOString()
  })
  .eq('id', orderId);

// Real-time subscription triggers UI update
// Commission moves from pending to confirmed
```

2. **Items Added**: Via add-items API
```typescript
// Recalculate commission
const newTotal = items.reduce(
  (sum, item) => sum + (item.price * item.quantity), 
  0
);
const newCommission = newTotal * 0.10;

await supabase
  .from('orders')
  .update({ 
    total_amount: newTotal,
    commission_amount: newCommission
  })
  .eq('id', orderId);
```

---

## UI Display

### CommissionToggle Component

Located in `src/components/CommissionToggle.tsx`:

```typescript
interface CommissionToggleProps {
  orders: Order[];
  selectedDate: Date;
}

export function CommissionToggle({ orders, selectedDate }: CommissionToggleProps) {
  const summary = getCommissionSummary(orders, selectedDate);
  
  return (
    <div className="commission-display">
      {/* Confirmed Commission */}
      <div className="commission-confirmed">
        <span className="label">Confirmado</span>
        <span className="amount">
          R$ {summary.confirmedCommission.toFixed(2)}
        </span>
        <span className="count">
          {summary.confirmedOrders} pedidos
        </span>
      </div>
      
      {/* Pending Commission */}
      <div className="commission-pending">
        <span className="label">Pendente</span>
        <span className="amount">
          R$ {summary.pendingCommission.toFixed(2)}
        </span>
        <span className="count">
          {summary.pendingOrders} pedidos
        </span>
      </div>
      
      {/* Tooltip explaining difference */}
      <Tooltip>
        <TooltipTrigger>
          <Info className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Confirmado: Pagamentos recebidos</p>
          <p>Pendente: Aguardando pagamento</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
```

### Visual Design

**Confirmed Commission**:
- Color: Green (#10b981)
- Icon: Check circle
- Prominent display
- Used in reports

**Pending Commission**:
- Color: Orange (#f59e0b)
- Icon: Clock
- Secondary display
- Shown with explanation

### Example Display

```
┌─────────────────────────────────────┐
│  Comissões - Hoje                   │
├─────────────────────────────────────┤
│  ✓ Confirmado                       │
│     R$ 45,00                        │
│     9 pedidos                       │
├─────────────────────────────────────┤
│  ⏰ Pendente                         │
│     R$ 15,00                        │
│     3 pedidos                       │
├─────────────────────────────────────┤
│  ℹ️ Comissão confirmada é de        │
│     pagamentos recebidos            │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### Problem: Commission Not Updating After Payment

**Cause**: Payment status not updated or real-time subscription not working

**Solution**:
```sql
-- Check payment status
SELECT 
  id,
  order_number,
  payment_status,
  commission_amount,
  payment_confirmed_at
FROM orders
WHERE id = 'order-uuid';

-- If payment confirmed but status wrong, update manually
UPDATE orders
SET 
  payment_status = 'confirmed',
  payment_confirmed_at = NOW()
WHERE id = 'order-uuid'
  AND payment_status = 'pending';
```

### Problem: Pending and Confirmed Don't Match Expected

**Cause**: Orders in wrong payment status or date filter incorrect

**Solution**:
```sql
-- Audit commission by payment status
SELECT 
  payment_status,
  COUNT(*) as order_count,
  SUM(commission_amount) as total_commission,
  SUM(total_amount) as total_sales
FROM orders
WHERE waiter_id = 'waiter-uuid'
  AND created_at >= CURRENT_DATE
GROUP BY payment_status;
```

### Problem: Commission Calculation Incorrect

**Cause**: Commission rate wrong or total_amount incorrect

**Solution**:
```sql
-- Verify commission calculation
SELECT 
  id,
  order_number,
  total_amount,
  commission_amount,
  (commission_amount / NULLIF(total_amount, 0) * 100) as commission_rate
FROM orders
WHERE waiter_id = 'waiter-uuid'
ORDER BY created_at DESC
LIMIT 10;

-- Recalculate if needed
UPDATE orders
SET commission_amount = total_amount * 0.10
WHERE waiter_id = 'waiter-uuid'
  AND ABS(commission_amount - (total_amount * 0.10)) > 0.01;
```

### Problem: Commission Shows After Order Cancelled

**Cause**: Cancelled orders not filtered out

**Solution**:
```typescript
// Always filter cancelled orders
const activeOrders = orders.filter(
  order => order.status !== 'cancelled'
);

const summary = getCommissionSummary(activeOrders, startDate, endDate);
```

---

## Best Practices

### 1. Always Filter by Payment Status

```typescript
// ✅ Good: Separate confirmed and pending
const confirmed = orders.filter(o => o.payment_status === 'confirmed');
const pending = orders.filter(o => o.payment_status === 'pending');

// ❌ Bad: Mix all orders together
const total = orders.reduce((sum, o) => sum + o.commission_amount, 0);
```

### 2. Use Date Filters Consistently

```typescript
// ✅ Good: Apply same date filter to both
const summary = getCommissionSummary(orders, startDate, endDate);

// ❌ Bad: Different date filters
const confirmed = calculateConfirmedCommission(orders, startDate);
const pending = calculatePendingCommission(orders, differentDate);
```

### 3. Handle Edge Cases

```typescript
// ✅ Good: Handle null/undefined
const commission = order.commission_amount || 0;

// ✅ Good: Handle division by zero
const rate = total > 0 ? (commission / total) * 100 : 0;

// ✅ Good: Round to 2 decimals
const display = commission.toFixed(2);
```

### 4. Validate Commission Calculations

```typescript
// ✅ Good: Validate before saving
if (commission < 0 || commission > total) {
  throw new Error('Invalid commission amount');
}

// ✅ Good: Verify rate is reasonable
const rate = commission / total;
if (rate < 0 || rate > 0.5) {
  console.warn('Unusual commission rate:', rate);
}
```

---

## Reporting

### Daily Commission Report

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE payment_status = 'confirmed') as confirmed_orders,
  COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_orders,
  SUM(commission_amount) FILTER (WHERE payment_status = 'confirmed') as confirmed_commission,
  SUM(commission_amount) FILTER (WHERE payment_status = 'pending') as pending_commission
FROM orders
WHERE waiter_id = 'waiter-uuid'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Waiter Commission Comparison

```sql
SELECT 
  p.full_name as waiter_name,
  COUNT(*) FILTER (WHERE o.payment_status = 'confirmed') as confirmed_orders,
  SUM(o.commission_amount) FILTER (WHERE o.payment_status = 'confirmed') as confirmed_commission,
  SUM(o.commission_amount) FILTER (WHERE o.payment_status = 'pending') as pending_commission
FROM orders o
JOIN profiles p ON o.waiter_id = p.id
WHERE o.created_at >= CURRENT_DATE
  AND p.role = 'waiter'
GROUP BY p.full_name
ORDER BY confirmed_commission DESC;
```

### Commission Conversion Rate

```sql
-- Percentage of pending orders that get confirmed
SELECT 
  waiter_id,
  COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE payment_status = 'confirmed') as confirmed_count,
  ROUND(
    COUNT(*) FILTER (WHERE payment_status = 'confirmed')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as confirmation_rate
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY waiter_id;
```

---

## Future Enhancements

### Potential Improvements

1. **Variable Commission Rates**
   - Different rates for different product categories
   - Bonus rates for high-value orders
   - Promotional commission multipliers

2. **Commission Tiers**
   - Higher rates for top performers
   - Progressive rates based on monthly totals
   - Team-based commission bonuses

3. **Advanced Analytics**
   - Commission trends over time
   - Conversion rate tracking (pending → confirmed)
   - Average time to payment confirmation
   - Commission per hour worked

4. **Automated Payouts**
   - Integration with payment systems
   - Automatic commission transfers
   - Payout schedules (daily, weekly, monthly)
   - Tax withholding calculations

5. **Commission Adjustments**
   - Manual adjustments for special cases
   - Refund handling
   - Dispute resolution
   - Audit trail for all changes
