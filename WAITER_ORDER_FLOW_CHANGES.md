# Waiter Order Flow Changes

## Overview

Modified the order creation flow to handle waiter-placed orders differently from customer orders.

## Changes Made

### 1. Modified Checkout Flow (`src/pages/customer/Checkout.tsx`)

**Key Changes:**
- Detect if user is a waiter by checking `user.user_metadata.role === 'waiter'`
- Create orders with different status based on user type:
  - **Customers**: `status: 'pending_payment'` → Redirect to payment page
  - **Waiters**: `status: 'in_preparation'` → Redirect to waiter dashboard

**Waiter Order Creation:**
```typescript
{
  customer_name: capitalizedName,
  customer_phone: normalizedPhone,
  table_number: '-',
  status: 'in_preparation',        // ← Goes directly to preparation
  payment_status: 'pending',        // ← Payment still pending
  total_amount: totalAmount,
  waiter_id: user.id,              // ← Tagged with waiter ID
  commission_amount: totalAmount * 0.1  // ← Commission calculated
}
```

### 2. WhatsApp Notification

**Waiter Orders:**
- Sends `onOrderPreparing` notification immediately
- Customer receives notification that order is being prepared
- No payment link sent (payment handled later by waiter)

**Customer Orders:**
- Sends `onOrderCreatedWithLinks` notification
- Includes payment link and order status link

### 3. Redirect Behavior

**Waiter Flow:**
```
Menu → Checkout → Create Order → Waiter Dashboard
                      ↓
                WhatsApp Notification (Order Preparing)
                      ↓
                Kitchen Auto-Print
```

**Customer Flow:**
```
Menu → Checkout → Create Order → Payment Page
                      ↓
                WhatsApp Notification (Order Created with Links)
```

## Features Implemented

### ✅ 1. No Payment Page for Waiters
- Waiters skip payment page entirely
- Orders go directly to "in_preparation" status

### ✅ 2. Payment Pending Status
- `payment_status` remains 'pending'
- Waiter can generate PIX later from dashboard

### ✅ 3. Waiter Identification
- Order tagged with `waiter_id`
- Commission calculated and stored
- Visible in waiter dashboard

### ✅ 4. Redirect to Waiter Dashboard
- After order creation, waiter returns to their dashboard
- Can immediately see the new order
- Can generate payment from there

### ✅ 5. Generate Payment from Panel
- Waiter dashboard already has PIX generation
- "Gerar PIX" button available for pending payments
- Payment can be generated at any time

### ✅ 6. Auto WhatsApp Notification
- `onOrderPreparing` notification sent immediately
- Customer informed order is being prepared
- No manual intervention needed

### ✅ 7. Auto Kitchen Print
- Kitchen auto-print already implemented
- Triggers when order reaches "in_preparation"
- Waiter orders print automatically
- Can be toggled on/off in kitchen dashboard

## Order Status Flow

### Waiter Orders
```
Created (in_preparation, payment_status: pending)
    ↓
Kitchen receives & prints automatically
    ↓
Waiter generates PIX from dashboard
    ↓
Customer pays
    ↓
Payment confirmed (payment_status: confirmed)
    ↓
Order continues normal flow (ready → completed)
```

### Customer Orders
```
Created (pending_payment, payment_status: pending)
    ↓
Customer goes to payment page
    ↓
Customer pays
    ↓
Payment confirmed (in_preparation, payment_status: confirmed)
    ↓
Kitchen receives & prints automatically
    ↓
Order continues normal flow (ready → completed)
```

## Database Schema

No schema changes required. Existing fields support this flow:

- `waiter_id` - Already exists
- `commission_amount` - Already exists
- `payment_status` - Already exists
- `status` - Already exists

## Testing Checklist

### Waiter Order Flow
- [ ] Login as waiter
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] Enter customer name and phone
- [ ] Confirm order
- [ ] Verify redirect to waiter dashboard
- [ ] Verify order appears with "Em Preparo" status
- [ ] Verify order shows "Pagamento Pendente"
- [ ] Verify customer receives WhatsApp notification
- [ ] Verify kitchen receives order (if kitchen dashboard open)
- [ ] Verify kitchen auto-prints (if enabled)
- [ ] Click "Gerar PIX" on order
- [ ] Verify PIX QR code generates
- [ ] Verify customer can pay
- [ ] Verify payment confirmation updates status

### Customer Order Flow (Unchanged)
- [ ] Access menu as customer (not logged in)
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] Enter name and phone
- [ ] Confirm order
- [ ] Verify redirect to payment page
- [ ] Verify customer receives WhatsApp with payment link
- [ ] Complete payment
- [ ] Verify order goes to kitchen
- [ ] Verify kitchen auto-prints (if enabled)

## Commission Tracking

Waiter orders automatically track commission:

- **Commission Amount**: 10% of order total
- **Pending Commission**: Shows in dashboard while `payment_status = 'pending'`
- **Confirmed Commission**: Moves to confirmed when `payment_status = 'confirmed'`
- **Real-time Updates**: Commission cards update automatically

## Benefits

1. **Faster Service**: Waiters don't wait for payment before sending to kitchen
2. **Flexible Payment**: Payment can be generated when customer is ready
3. **Better UX**: Waiter stays in their dashboard workflow
4. **Automatic Notifications**: Customer informed immediately
5. **Kitchen Integration**: Orders print automatically
6. **Commission Tracking**: Waiter sees pending and confirmed commissions

## Edge Cases Handled

### 1. Waiter Creates Order But Customer Doesn't Pay
- Order stays in "in_preparation" with "payment_status: pending"
- Waiter can still generate PIX anytime
- Commission shows as "pending" until paid
- Order can be cancelled if needed

### 2. Multiple Waiters Creating Orders
- Each order tagged with correct `waiter_id`
- Each waiter sees only their orders
- Commissions tracked separately

### 3. Kitchen Auto-Print Disabled
- Order still goes to kitchen dashboard
- Staff can manually print if needed
- Auto-print can be toggled anytime

### 4. WhatsApp Notification Fails
- Order creation still succeeds
- Error logged but doesn't block flow
- Notification can be resent manually if needed

## Future Enhancements

Potential improvements for future iterations:

1. **Table Number Input**: Allow waiter to specify table number
2. **Order Notes**: Add special instructions field
3. **Split Payment**: Support multiple payment methods
4. **Tip Handling**: Add tip calculation
5. **Order Modification**: Edit order before payment
6. **Batch Orders**: Create multiple orders at once

## Rollback Plan

If issues arise, rollback is simple:

1. Revert `src/pages/customer/Checkout.tsx` to previous version
2. All orders will go through customer flow
3. No database changes needed
4. No data loss

## Support

For issues or questions:

1. Check Cloudflare Functions logs for errors
2. Check Supabase logs for database issues
3. Check browser console for frontend errors
4. Verify user role is set correctly in profiles table

---

**Status**: ✅ Implemented and Ready for Testing
**Date**: 2024-11-20
**Version**: 1.0.0
