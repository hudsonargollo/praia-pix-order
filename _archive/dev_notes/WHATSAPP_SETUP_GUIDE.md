# WhatsApp Notifications Setup Guide

## Overview

The system automatically sends WhatsApp notifications to customers at key points in the order lifecycle:

1. **Payment Confirmed** - When PIX payment is approved
2. **Order Preparing** - When kitchen starts preparing (optional)
3. **Order Ready** - When order is ready for pickup

All notifications include detailed order information.

## Message Templates

### 1. Payment Confirmed Message

Sent automatically when payment is approved. Includes:
- Order number
- Customer name and phone
- Complete list of items with quantities and prices
- Total amount
- Estimated preparation time (15-20 minutes)

**Example:**
```
🌴 Coco Loko Açaiteria 🌴

✅ Pedido Confirmado!

📋 Pedido #123
👤 Cliente: João Silva
📱 Telefone: +5573999999999

📝 Itens do Pedido:
• 1x Açaí 300ml - R$ 12.00
• 2x Água de Coco - R$ 5.00

💰 Total: R$ 22.00

⏰ Tempo estimado: 15-20 minutos

Você receberá uma nova mensagem quando seu pedido estiver pronto para retirada!

Obrigado por escolher a Coco Loko! 🥥🌊
```

### 2. Order Ready Message

Sent when kitchen marks order as ready. Includes:
- Order number (prominently displayed)
- Customer name
- Pickup instructions

**Example:**
```
🌴 Coco Loko Açaiteria 🌴

🎉 Pedido Pronto!

📋 Pedido #123
👤 Cliente: João Silva

✨ Seu pedido está pronto para retirada no balcão!

Por favor, apresente este número do pedido: #123

Aproveite seu açaí! 🥥🌊
```

### 3. Order Preparing Message (Optional)

Sent when kitchen starts preparing. Includes:
- Order number
- Customer name
- Estimated time

**Example:**
```
🌴 Coco Loko Açaiteria 🌴

👨‍🍳 Pedido em Preparo!

📋 Pedido #123
👤 Cliente: João Silva

Seu pedido está sendo preparado com carinho!

⏰ Tempo estimado: 15-20 minutos

Em breve você receberá uma notificação quando estiver pronto! 🥥🌊
```

## Automatic Triggers

### Payment Confirmation
- **Trigger**: Order status changes from `pending_payment` to `paid`
- **Location**: Payment polling service (`src/integrations/mercadopago/polling.ts`)
- **Function**: `notificationTriggers.onPaymentConfirmed(orderId)`

### Order Ready
- **Trigger**: Kitchen staff clicks "Marcar como Pronto"
- **Location**: Kitchen page (`src/pages/Kitchen.tsx`)
- **Function**: `notificationTriggers.onOrderStatusChange(orderId, 'ready', oldStatus)`

### Order Preparing (Optional)
- **Trigger**: Kitchen staff clicks "Iniciar Preparo"
- **Location**: Kitchen page (`src/pages/Kitchen.tsx`)
- **Function**: `notificationTriggers.onOrderStatusChange(orderId, 'in_preparation', oldStatus)`

## Setup Instructions

### 1. WhatsApp Connection

The system uses Baileys (WhatsApp Web API) for sending messages.

**Steps:**
1. Go to `/whatsapp-admin` page
2. Click "Connect WhatsApp"
3. Scan QR code with your WhatsApp
4. Wait for "Connected" status

**Important:**
- Use a dedicated WhatsApp Business number
- Keep the browser tab open or use a server for 24/7 operation
- Connection persists across page reloads

### 2. Database Setup

The system requires these tables (already created via migrations):

- `whatsapp_sessions` - Stores WhatsApp connection state
- `whatsapp_notifications` - Logs all sent notifications
- `notification_templates` - Customizable message templates
- `whatsapp_error_logs` - Tracks delivery failures
- `whatsapp_opt_out` - Manages customer opt-outs

### 3. Environment Variables

No additional environment variables needed for WhatsApp. The system uses:
- Supabase for data storage
- Browser-based WhatsApp Web connection

### 4. Testing Notifications

#### Test Payment Confirmation
```sql
-- In Supabase SQL Editor
UPDATE orders
SET status = 'paid',
    payment_confirmed_at = NOW()
WHERE order_number = YOUR_ORDER_NUMBER;
```

Check `whatsapp_notifications` table to verify notification was queued:
```sql
SELECT * FROM whatsapp_notifications
WHERE order_id = 'YOUR_ORDER_ID'
ORDER BY created_at DESC;
```

#### Test Order Ready
1. Go to Kitchen panel (`/kitchen`)
2. Find a paid order
3. Click "Iniciar Preparo" (optional)
4. Click "Marcar como Pronto"
5. Customer should receive notification

## Customizing Templates

### Via Database

Templates are stored in `notification_templates` table and can be customized:

```sql
-- Update payment confirmation template
UPDATE notification_templates
SET content = 'Your custom message with {{orderNumber}} and {{customerName}}'
WHERE template_type = 'payment_confirmed';
```

### Available Variables

Use these variables in templates (wrapped in `{{variable}}`):

- `{{orderNumber}}` - Order number (e.g., 123)
- `{{customerName}}` - Customer name
- `{{customerPhone}}` - Customer phone
- `{{tableNumber}}` - Table number (deprecated, shows "-")
- `{{totalAmount}}` - Total with currency (e.g., R$ 22.00)
- `{{status}}` - Order status in Portuguese
- `{{itemCount}}` - Number of items
- `{{itemsList}}` - Formatted list of items with prices
- `{{createdAt}}` - Order creation date/time
- `{{estimatedTime}}` - Estimated preparation time

### Example Custom Template

```sql
INSERT INTO notification_templates (template_type, content, is_active)
VALUES (
  'payment_confirmed',
  '🎉 Pagamento confirmado!

Pedido #{{orderNumber}}
Cliente: {{customerName}}

Itens:
{{itemsList}}

Total: {{totalAmount}}

Seu pedido ficará pronto em {{estimatedTime}}!',
  true
);
```

## Monitoring

### Check Notification Status

```sql
-- Recent notifications
SELECT 
  wn.id,
  wn.order_id,
  o.order_number,
  wn.customer_phone,
  wn.notification_type,
  wn.status,
  wn.sent_at,
  wn.error_message
FROM whatsapp_notifications wn
JOIN orders o ON o.id = wn.order_id
ORDER BY wn.created_at DESC
LIMIT 20;
```

### Check Delivery Failures

```sql
-- Failed notifications
SELECT 
  wn.id,
  o.order_number,
  wn.customer_phone,
  wn.notification_type,
  wn.error_message,
  wn.retry_count,
  wn.created_at
FROM whatsapp_notifications wn
JOIN orders o ON o.id = wn.order_id
WHERE wn.status = 'failed'
ORDER BY wn.created_at DESC;
```

### Check Error Logs

```sql
-- Recent errors
SELECT *
FROM whatsapp_error_logs
ORDER BY created_at DESC
LIMIT 20;
```

## Troubleshooting

### Notifications Not Sending

**Check 1: WhatsApp Connection**
- Go to `/whatsapp-admin`
- Verify status is "Connected"
- If disconnected, scan QR code again

**Check 2: Notification Queue**
```sql
SELECT * FROM whatsapp_notifications
WHERE status = 'pending'
ORDER BY created_at DESC;
```

**Check 3: Error Logs**
```sql
SELECT * FROM whatsapp_error_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Check 4: Phone Number Format**
- Must be in format: `+5573999999999`
- Includes country code (+55) and area code
- No spaces or special characters

### Customer Not Receiving Messages

**Check 1: Phone Number**
- Verify phone number is correct in order
- Check format: `+55` + DDD + number

**Check 2: WhatsApp Account**
- Customer must have WhatsApp installed
- Number must be active on WhatsApp

**Check 3: Opt-Out Status**
```sql
SELECT * FROM whatsapp_opt_out
WHERE phone_number = '+5573999999999';
```

### Messages Delayed

**Check 1: Queue Status**
- System processes notifications sequentially
- Check queue length:
```sql
SELECT COUNT(*) FROM whatsapp_notifications
WHERE status = 'pending';
```

**Check 2: Rate Limiting**
- System respects WhatsApp rate limits
- Delays between messages to avoid blocking

## Best Practices

1. **Keep Connection Active**
   - Use a dedicated device/browser for WhatsApp connection
   - Consider running on a server for 24/7 operation

2. **Monitor Regularly**
   - Check notification status daily
   - Review error logs weekly
   - Test notification flow after updates

3. **Customer Communication**
   - Inform customers they'll receive WhatsApp notifications
   - Provide opt-out option if requested
   - Keep messages concise and informative

4. **Template Management**
   - Test template changes before deploying
   - Keep backup of working templates
   - Use variables for dynamic content

5. **Error Handling**
   - System automatically retries failed notifications
   - Manual retry available via WhatsApp Admin panel
   - Failed notifications don't block order processing

## Production Checklist

- [ ] WhatsApp Business number configured
- [ ] WhatsApp connected and verified
- [ ] Test notifications sent successfully
- [ ] Templates customized (if needed)
- [ ] Monitoring queries saved
- [ ] Staff trained on notification system
- [ ] Customer communication prepared
- [ ] Backup plan for WhatsApp downtime
- [ ] Error notification alerts configured

## Support

For issues or questions:
1. Check error logs in database
2. Review browser console for errors
3. Test with known working phone number
4. Verify WhatsApp connection status
5. Check Supabase realtime is enabled
