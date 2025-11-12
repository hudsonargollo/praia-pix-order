# Payment Flow Guide

## How Payment Confirmation Works

### 1. Order Creation
- Customer adds items to cart
- Fills in name and WhatsApp
- Order created with `status='pending_payment'`
- `table_number` set to "-" (placeholder)

### 2. Payment Generation
- Mercado Pago PIX payment created
- `mercadopago_payment_id` stored in order
- `payment_expires_at` set to 15 minutes from now
- Customer sees QR code and PIX copy/paste code

### 3. Payment Confirmation (Automatic)

#### Method 1: Payment Polling (Primary)
- Frontend polls Mercado Pago API every 5-15 seconds
- When payment status = 'approved':
  - Order status updated to 'paid'
  - `payment_confirmed_at` timestamp set
  - WhatsApp notification triggered
  - Kitchen panel notified via realtime

#### Method 2: Webhook (Backup - if configured)
- Mercado Pago sends webhook to `/api/mercadopago/webhook`
- Webhook validates and updates order status
- Same flow as polling

### 4. Kitchen Display
- Kitchen panel subscribes to orders with status: 'paid', 'in_preparation', 'ready'
- When order status changes from 'pending_payment' to 'paid':
  - Realtime UPDATE event triggers
  - Order appears in Kitchen "Em Preparo" column
  - Notification sound plays (if enabled)

### 5. Order Processing
- Kitchen staff clicks "Iniciar Preparo" → status = 'in_preparation'
- Kitchen staff clicks "Marcar como Pronto" → status = 'ready'
- Cashier clicks "Finalizar Pedido" → status = 'completed'

## Troubleshooting

### Orders not appearing in Kitchen after payment

**Check 1: Order Status**
```sql
SELECT id, order_number, status, payment_confirmed_at, mercadopago_payment_id
FROM orders
WHERE status = 'paid'
ORDER BY created_at DESC
LIMIT 10;
```

**Check 2: Realtime Connection**
- Look for "Kitchen orders subscription status: SUBSCRIBED" in browser console
- Check connection indicator in Kitchen panel header

**Check 3: Payment Polling**
- Open browser console on payment page
- Look for "Payment polling check" logs
- Verify payment status changes from 'pending' to 'approved'

**Check 4: Manual Status Update (Testing)**
```sql
-- Manually mark order as paid for testing
UPDATE orders
SET status = 'paid',
    payment_confirmed_at = NOW()
WHERE id = 'YOUR_ORDER_ID';
```

### Payment not confirming automatically

**Check 1: Mercado Pago Credentials**
- Verify `VITE_MERCADOPAGO_PUBLIC_KEY` is set
- Verify Mercado Pago access token is valid

**Check 2: Payment Polling Active**
- Check browser console for "Payment polling check" logs
- Verify polling is running (should see logs every 5-15 seconds)

**Check 3: Payment Status in Mercado Pago**
- Log into Mercado Pago dashboard
- Check if payment was actually received
- Verify payment ID matches order's `mercadopago_payment_id`

## Database Schema

### Orders Table Key Fields
```sql
- id: UUID (primary key)
- order_number: INTEGER (auto-increment, display to users)
- customer_name: TEXT
- customer_phone: TEXT (format: +5573999999999)
- table_number: TEXT (deprecated, set to "-")
- status: TEXT (pending_payment, paid, in_preparation, ready, completed, cancelled, expired)
- total_amount: DECIMAL
- payment_confirmed_at: TIMESTAMP (set when payment approved)
- mercadopago_payment_id: TEXT (Mercado Pago payment ID)
- payment_expires_at: TIMESTAMP (15 minutes from creation)
- created_at: TIMESTAMP
```

## Testing Payment Flow

### 1. Create Test Order
1. Go to /menu
2. Add items to cart
3. Click "Ver Carrinho"
4. Fill in customer info
5. Click "Prosseguir para Pagamento"

### 2. Simulate Payment (Development)
```sql
-- In Supabase SQL Editor
UPDATE orders
SET status = 'paid',
    payment_confirmed_at = NOW()
WHERE order_number = YOUR_ORDER_NUMBER;
```

### 3. Verify Kitchen Display
1. Open Kitchen panel (/kitchen)
2. Order should appear in "Em Preparo" column
3. Check browser console for realtime events

### 4. Test Full Flow
1. Use Mercado Pago test credentials
2. Make actual test payment
3. Verify polling detects payment
4. Verify order appears in Kitchen
5. Test status transitions (in_preparation → ready → completed)

## Production Checklist

- [ ] Mercado Pago production credentials configured
- [ ] Supabase realtime enabled
- [ ] Payment polling working (check console logs)
- [ ] Kitchen panel receiving realtime updates
- [ ] WhatsApp notifications configured (optional)
- [ ] Test end-to-end flow with real payment
- [ ] Monitor payment_webhooks table for webhook delivery
- [ ] Set up monitoring for failed payments

## Common Issues

### Issue: "Order not showing in Kitchen after manual status update"
**Solution**: Refresh the Kitchen page or check realtime connection status

### Issue: "Payment polling stops after a few attempts"
**Solution**: Check browser console for errors, verify Mercado Pago API is accessible

### Issue: "Realtime not working"
**Solution**: 
- Check Supabase project has realtime enabled
- Verify no browser extensions blocking WebSocket
- Check network tab for WebSocket connection

### Issue: "Payment confirmed but order still pending_payment"
**Solution**: Check payment polling logs, verify order ID matches, manually update if needed
