# ✅ Test WhatsApp Notifications Now!

## Database Tables Created ✅

The required tables are now in your production database:
- ✅ `whatsapp_notifications`
- ✅ `whatsapp_opt_out`
- ✅ `whatsapp_error_logs`

## Production URL
**https://2b17598f.coco-loko-acaiteria.pages.dev**

## Test 1: Manual Notification (Notificar Pronto)

1. **Go to Kitchen**: https://2b17598f.coco-loko-acaiteria.pages.dev/kitchen
2. **Find an order** in "Em Preparação"
3. **Click "Marcar como Pronto"**
4. **Click "Notificar Pronto"** button
5. **Check WhatsApp** - Customer should receive message!

Expected message:
```
🍇 *Coco Loko Açaiteria*

🎉 *Seu pedido está pronto!*

📋 *Pedido #XXXX*
👤 Cliente: [Name]
🪑 Mesa: [Table]

Por favor, venha buscar seu pedido no balcão.

Obrigado pela preferência! 🍇
```

## Test 2: Custom Message from Cashier

1. **Go to Cashier**: https://2b17598f.coco-loko-acaiteria.pages.dev/cashier
2. **Find an order**
3. **Click "Enviar Mensagem Personalizada"**
4. **Type**: "Teste do sistema"
5. **Click "Enviar Mensagem"**
6. **Check WhatsApp** - Should receive custom message!

## Test 3: Complete Order Flow

1. **Create new order**: https://2b17598f.coco-loko-acaiteria.pages.dev
2. **Customer phone**: 73999548537
3. **Pay via PIX**
4. **Wait 5-30 seconds**
5. **Check WhatsApp** - Should receive payment confirmation!

Expected message:
```
🍇 *Coco Loko Açaiteria*

✅ *Pedido Confirmado!*

📋 *Pedido #XXXX*
👤 Cliente: [Name]
🪑 Mesa: [Table]

*Itens do Pedido:*
• [Items]

💰 *Total: R$ XX,XX*

⏱️ Tempo estimado: 15 minutos

Você receberá uma notificação quando seu pedido estiver pronto! 🎉
```

## Verify in Database

Check notifications were sent:

```sql
SELECT 
  id,
  order_id,
  notification_type,
  status,
  sent_at,
  whatsapp_message_id,
  error_message,
  created_at
FROM whatsapp_notifications
ORDER BY created_at DESC
LIMIT 10;
```

Should show:
- ✅ `status = 'sent'`
- ✅ `sent_at` has timestamp
- ✅ `whatsapp_message_id` has value
- ✅ `error_message` is null

## Check Browser Console

Should see:
```
Evolution API initialized: { url: "...", instance: "cocooo", configured: true }
Notification enqueued: { id: ..., orderId: ..., type: ... }
Processing X pending notifications
Notification X sent successfully
```

## Expected Results

### ✅ All Working
- Order status updates after payment
- Orders appear in Kitchen dashboard
- "Notificar Pronto" button sends WhatsApp
- Custom messages send from Cashier
- Payment confirmations send automatically
- Notifications logged in database

### ⚠️ Warnings (OK)
- "Phone encryption not configured" - This is just a warning, not an error
- Phone numbers stored in plain text - Acceptable for now

## If Still Not Working

### Check 1: Evolution API Connection
```bash
curl http://wppapi.clubemkt.digital/instance/connectionState/cocooo \
  -H "apikey: DD451E404240-4C45-AF35-BFCA6A976927"
```

Should return: `{ "instance": { "state": "open" } }`

### Check 2: Browser Console
Look for errors. Should see "Evolution API initialized" with `configured: true`

### Check 3: Database
```sql
-- Check if notification was created
SELECT * FROM whatsapp_notifications 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

### Check 4: Phone Number Format
Make sure phone number is in format: `5573999548537` (country code + number)

## Success Indicators

After testing, you should have:
- ✅ WhatsApp messages received
- ✅ Notifications in database with status 'sent'
- ✅ No errors in browser console
- ✅ Orders updating correctly
- ✅ Kitchen/Cashier dashboards working

---

**Everything is ready! Test now and WhatsApp notifications should work! 🎉**
