# Waiter Order Flow - Testing Guide

## Quick Test Steps

### Test 1: Waiter Creates Order

1. **Login as Waiter**
   ```
   - Go to /auth
   - Login with waiter credentials
   - Should redirect to /waiter/dashboard
   ```

2. **Create Order**
   ```
   - Click "Novo Pedido" or go to /menu
   - Add items to cart
   - Click "Ver Carrinho"
   - Click "Finalizar Pedido"
   ```

3. **Enter Customer Info**
   ```
   - Enter customer name (e.g., "João Silva")
   - Enter WhatsApp with DDD (e.g., "73999988888")
   - Click "Continuar" through steps
   ```

4. **Verify Redirect**
   ```
   ✅ Should redirect to /waiter/dashboard (NOT /payment)
   ✅ Should see toast: "Pedido criado! Enviando notificação..."
   ✅ Should see toast: "Notificação enviada ao cliente! 📱"
   ```

5. **Verify Order in Dashboard**
   ```
   ✅ New order appears at top of list
   ✅ Status shows "Em Preparo" (purple badge)
   ✅ Payment status shows "Aguardando Pagamento" (yellow badge)
   ✅ Order shows waiter's name/tag
   ✅ Commission shows in "Comissão Pendente" card
   ```

6. **Verify Customer Notification**
   ```
   ✅ Customer receives WhatsApp message
   ✅ Message says order is being prepared
   ✅ Message includes order details
   ```

7. **Verify Kitchen**
   ```
   - Open /staff/kitchen in another tab
   ✅ Order appears in kitchen dashboard
   ✅ If auto-print enabled, order prints automatically
   ✅ Order shows "Em Preparo" status
   ```

8. **Generate Payment**
   ```
   - In waiter dashboard, find the order
   - Click "Gerar PIX" button
   ✅ PIX QR code modal opens
   ✅ QR code displays
   ✅ Copy/paste code works
   ✅ Timer shows expiration
   ```

9. **Test Payment**
   ```
   - Scan QR code or use test payment
   - Complete payment
   ✅ Order updates to "Pagamento Confirmado"
   ✅ Commission moves to "Comissão Confirmada"
   ✅ Order continues normal flow
   ```

### Test 2: Customer Creates Order (Verify Unchanged)

1. **Logout** (if logged in as waiter)

2. **Access Menu**
   ```
   - Go to /menu (not logged in)
   - Add items to cart
   - Click "Ver Carrinho"
   - Click "Finalizar Pedido"
   ```

3. **Enter Customer Info**
   ```
   - Enter name and WhatsApp
   - Click through steps
   ```

4. **Verify Redirect**
   ```
   ✅ Should redirect to /payment/{orderId}
   ✅ Should see payment page with PIX QR code
   ✅ Should NOT redirect to waiter dashboard
   ```

5. **Verify Customer Notification**
   ```
   ✅ Customer receives WhatsApp with payment link
   ✅ Message includes order details
   ✅ Message includes payment link
   ```

6. **Complete Payment**
   ```
   - Pay via PIX
   ✅ Order goes to kitchen after payment
   ✅ Kitchen auto-prints (if enabled)
   ```

## Expected Behavior Comparison

| Aspect | Waiter Order | Customer Order |
|--------|--------------|----------------|
| **Initial Status** | `in_preparation` | `pending_payment` |
| **Payment Status** | `pending` | `pending` |
| **Redirect After Creation** | `/waiter/dashboard` | `/payment/{orderId}` |
| **WhatsApp Notification** | "Order Preparing" | "Order Created with Links" |
| **Kitchen Visibility** | Immediate | After payment |
| **Auto-Print** | Immediate (if enabled) | After payment (if enabled) |
| **Payment Generation** | From waiter dashboard | Automatic on payment page |
| **Commission Tracking** | Yes (10%) | No |
| **Waiter Tag** | Yes (`waiter_id` set) | No (`waiter_id` null) |

## Common Issues & Solutions

### Issue: Waiter redirected to payment page

**Cause**: User role not set correctly

**Solution**:
```sql
-- Check user role
SELECT id, email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'waiter@example.com';

-- Update role if needed
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "waiter"}'::jsonb
WHERE email = 'waiter@example.com';
```

### Issue: Order not appearing in kitchen

**Cause**: Kitchen dashboard not subscribed to real-time updates

**Solution**:
- Refresh kitchen dashboard
- Check browser console for errors
- Verify Supabase real-time is enabled

### Issue: Auto-print not working

**Cause**: Auto-print disabled or printer not configured

**Solution**:
- Check auto-print toggle in kitchen dashboard
- Verify printer is connected
- Check browser console for print errors
- Try manual print button

### Issue: WhatsApp notification not sent

**Cause**: Evolution API not configured or offline

**Solution**:
- Check Evolution API status
- Verify environment variables
- Check Cloudflare Functions logs
- Notification failure doesn't block order creation

### Issue: Commission not showing

**Cause**: `waiter_id` not set on order

**Solution**:
```sql
-- Check order waiter_id
SELECT id, order_number, waiter_id, commission_amount, status, payment_status
FROM orders
WHERE id = 'order-id-here';

-- Verify waiter_id matches logged-in user
```

## Database Verification Queries

### Check Waiter Orders
```sql
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.status,
  o.payment_status,
  o.total_amount,
  o.commission_amount,
  o.waiter_id,
  p.display_name as waiter_name,
  o.created_at
FROM orders o
LEFT JOIN profiles p ON o.waiter_id = p.id
WHERE o.waiter_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;
```

### Check Order Status Flow
```sql
SELECT 
  id,
  order_number,
  status,
  payment_status,
  waiter_id IS NOT NULL as is_waiter_order,
  created_at,
  payment_confirmed_at
FROM orders
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Check WhatsApp Notifications
```sql
SELECT 
  wn.id,
  wn.order_id,
  o.order_number,
  wn.notification_type,
  wn.status,
  wn.sent_at,
  wn.created_at
FROM whatsapp_notifications wn
JOIN orders o ON wn.order_id = o.id
WHERE wn.created_at > NOW() - INTERVAL '1 hour'
ORDER BY wn.created_at DESC;
```

## Performance Checks

### Order Creation Speed
- Waiter order creation should be < 2 seconds
- Customer order creation should be < 2 seconds
- No noticeable difference in speed

### Real-time Updates
- Kitchen should receive order within 2 seconds
- Waiter dashboard should update within 2 seconds
- Payment status updates should be immediate

### Notification Delivery
- WhatsApp notification should send within 5 seconds
- Notification failure should not block order creation
- Failed notifications should be logged

## Success Criteria

All tests pass when:

✅ Waiter orders go to dashboard (not payment page)
✅ Waiter orders show "Em Preparo" immediately
✅ Customer orders go to payment page (unchanged)
✅ Kitchen receives waiter orders immediately
✅ Auto-print works for waiter orders
✅ WhatsApp notifications sent correctly
✅ Commission tracking works
✅ Payment can be generated from dashboard
✅ No errors in console or logs
✅ Performance is acceptable

## Rollback Procedure

If critical issues found:

1. **Immediate Rollback**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Verify Rollback**
   - Test waiter order creation
   - Should go to payment page again
   - All orders follow customer flow

3. **Investigate Issues**
   - Check logs
   - Review error reports
   - Fix issues in development

4. **Redeploy When Fixed**
   - Test thoroughly in development
   - Deploy to production
   - Monitor closely

---

**Testing Status**: Ready for QA
**Estimated Testing Time**: 30 minutes
**Priority**: High - Core waiter functionality
