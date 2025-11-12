# Waiter Commission Fix - Canceled Orders

## Issue
When an order is canceled, the waiter's commission is still being counted in their total earnings.

## Current Behavior
- Commission is calculated as: `totalSales * 0.10` (10%)
- `totalSales` includes ALL orders regardless of status
- Canceled orders still contribute to commission calculation

## Expected Behavior
- Canceled orders should NOT be included in commission calculation
- Only orders with status: `paid`, `preparing`, `ready`, or `completed` should count
- Canceled and expired orders should be excluded

## Location
File: `src/pages/waiter/WaiterDashboard.tsx`
Line: 126

## Current Code
```typescript
const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
const totalCommissions = totalSales * 0.1; // 10% commission
```

## Fix Required
```typescript
// Only count orders that are paid or in progress (exclude cancelled and expired)
const validOrders = orders.filter(order => 
  !['cancelled', 'expired', 'pending_payment'].includes(order.status)
);
const totalSales = validOrders.reduce((sum, order) => sum + order.total_amount, 0);
const totalCommissions = totalSales * 0.1; // 10% commission
```

## Additional Considerations
1. Should also exclude `pending_payment` orders since they haven't been paid yet
2. The order history table should show commission per order
3. Consider adding a visual indicator for canceled orders in the history

## Status
📝 Documented - Ready for implementation

## Date Noted
November 12, 2024
