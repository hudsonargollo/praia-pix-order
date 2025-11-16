# WhatsApp Templates - Quick Reference

## 🎯 What Changed

All WhatsApp notifications now include:
- ✅ **Customer's first name** for personalization
- ✅ **Complete order items list** with quantities
- ✅ **Table number**
- ✅ **Total amount**
- ✅ **Context-aware messages**

## 📱 Message Examples

### 1. Payment Confirmed (PIX or Credit Card)
```
🌴 Coco Loko Açaiteria 🌴

Olá João! 👋

✅ Pagamento Confirmado!

Seu pedido foi recebido e já está sendo preparado com muito carinho! 🥥

📋 Pedido #123
🪑 Mesa: 5

📝 Seus Itens:
• 2x Açaí 500ml - R$ 30.00
• 1x Água de Coco - R$ 8.00

💰 Total Pago: R$ 38.00

⏰ Tempo estimado: 15-20 minutos
```

### 2. Order Ready for Pickup
```
🌴 Coco Loko Açaiteria 🌴

🎉 João, seu pedido está pronto!

Pode vir buscar no balcão! 🥥✨

📋 Pedido #123
🪑 Mesa: 5

📝 Seus Itens:
• 2x Açaí 500ml
• 1x Água de Coco

💰 Total: R$ 38.00

✨ Por favor, apresente o número do seu pedido: #123
```

### 3. Order Preparing
```
🌴 Coco Loko Açaiteria 🌴

Olá João! 👋

👨‍🍳 Seu pedido está sendo preparado!

📋 Pedido #123
🪑 Mesa: 5

📝 Seus Itens:
• 2x Açaí 500ml
• 1x Água de Coco

💰 Total: R$ 38.00

⏰ Tempo estimado: 15-20 minutos
```

## 🔄 When Messages Are Sent

| Status Change | Message Type | Trigger |
|--------------|--------------|---------|
| `pending_payment` → `paid` | Payment Confirmed | Automatic after payment |
| `paid` → `in_preparation` | Order Preparing | Manual from cashier/kitchen |
| `in_preparation` → `ready` | Ready for Pickup | Manual from cashier/kitchen |

## 🧪 Testing

To test the new templates:

1. **Create a test order**:
   - Go to menu and add items
   - Complete checkout with customer info
   - Pay with PIX or Credit Card

2. **Check payment confirmation**:
   - Customer should receive personalized message
   - Verify all items are listed
   - Check total amount is correct

3. **Move to preparing**:
   - Go to cashier/kitchen dashboard
   - Change order status to "in_preparation"
   - Check WhatsApp message

4. **Mark as ready**:
   - Change order status to "ready"
   - Check final WhatsApp message

## 📝 Notes

- **First name extraction**: Automatically extracts first name from full name
  - "João Silva" → "João"
  - "Maria" → "Maria"
  
- **Item totals**: Payment confirmation shows individual item totals
  - `2x Açaí 500ml - R$ 30.00` (2 × R$ 15.00)
  
- **Other messages**: Show items without individual prices
  - `2x Açaí 500ml`

## 🚀 Deployment

**Latest deployment**: https://0aa98bb8.coco-loko-acaiteria.pages.dev

Changes are live and will be used for all new orders!

## 📄 Files Modified

- `src/integrations/whatsapp/templates.ts` - All template functions updated

## 💡 Benefits

1. **More Personal**: Using first names makes messages feel friendly
2. **Complete Info**: Customers see exactly what they ordered
3. **Professional**: Well-formatted messages with emojis
4. **Less Questions**: Complete information reduces customer inquiries
5. **Better UX**: Clear, easy-to-read format
