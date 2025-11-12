# WhatsApp Messages Not Sending - Fix Applied

## 🐛 Problem
WhatsApp messages weren't being sent after payment approval or manual attempts.

## 🔍 Root Cause
**Environment variables not loaded in production**

The Evolution API credentials were in `wrangler.toml` under `[env.production.vars]` which are only available at runtime for Cloudflare Workers, but NOT during Vite build time. This meant the client-side code couldn't access them.

### Error in Console
```
Evolution API not fully configured. Check environment variables.
WhatsApp credentials not configured
```

## ✅ Solution Applied

### 1. Moved Environment Variables
Changed from:
```toml
[env.production.vars]
VITE_EVOLUTION_API_URL = "..."
```

To:
```toml
[vars]
VITE_EVOLUTION_API_URL = "..."
```

This makes them available at both build time and runtime.

### 2. Added Debug Logging
Added console logs to show Evolution API configuration status:
```typescript
console.log('Evolution API configured:', {
  url: this.config.apiUrl,
  instance: this.config.instanceName
});
```

### 3. Rebuilt and Redeployed
- ✅ Built with environment variables
- ✅ Deployed to production

## 🚀 New Deployment

**Production URL**: https://244ffdc7.coco-loko-acaiteria.pages.dev

## 🧪 Testing

### 1. Check Browser Console

Open the production site and check console. You should now see:
```
Evolution API configured: {
  url: "http://wppapi.clubemkt.digital",
  instance: "cocooo"
}
```

Instead of:
```
Evolution API not fully configured
```

### 2. Test Order Flow

1. Create order: https://244ffdc7.coco-loko-acaiteria.pages.dev
2. Use phone: **73999548537**
3. Pay via PIX
4. Wait 5-30 seconds
5. Check WhatsApp for confirmation message

### 3. Manual Test from Cashier

1. Go to Cashier dashboard
2. Find an order
3. Click "Enviar Mensagem Personalizada"
4. Type "TESTE"
5. Click send
6. Check WhatsApp

## 🔍 Verify Configuration

### In Browser Console

After page loads, check for:
```javascript
// Should see this:
Evolution API configured: {
  url: "http://wppapi.clubemkt.digital",
  instance: "cocooo"
}

// Should NOT see this:
Evolution API not fully configured
```

### Test Evolution API Directly

```javascript
// In browser console on production site:
const { evolutionClient } = await import('/src/integrations/whatsapp/evolution-client.ts');

// Check if configured
console.log('Is configured:', evolutionClient.isConfigured());
// Should return: true

// Check connection
const isConnected = await evolutionClient.isConnected();
console.log('Is connected:', isConnected);
// Should return: true

// Test send message
const response = await evolutionClient.sendTextMessage({
  number: '5573999548537',
  text: 'Teste do sistema',
  delay: 0
});
console.log('Message sent:', response);
```

## 📊 Expected Flow

```
1. Customer pays via PIX
   ↓
2. Payment polling detects approval
   ↓
3. Order status updated to "in_preparation"
   ↓
4. notificationTriggers.onPaymentConfirmed() called
   ↓
5. Notification queued in database
   ↓
6. queueManager.processPendingNotifications() called
   ↓
7. evolutionClient.sendTextMessage() called
   ↓  (NOW WORKS - credentials loaded!)
8. Evolution API sends WhatsApp message
   ↓
9. Customer receives confirmation
```

## 🐛 If Still Not Working

### Check 1: Environment Variables Loaded

In browser console:
```javascript
console.log('Env check:', {
  url: import.meta.env.VITE_EVOLUTION_API_URL,
  instance: import.meta.env.VITE_EVOLUTION_INSTANCE_NAME
});
```

Should show the actual values, not undefined.

### Check 2: Evolution API Connection

```bash
curl http://wppapi.clubemkt.digital/instance/connectionState/cocooo \
  -H "apikey: DD451E404240-4C45-AF35-BFCA6A976927"
```

Should return:
```json
{
  "instance": {
    "instanceName": "cocooo",
    "state": "open"
  }
}
```

### Check 3: Notification Queue

Run in Supabase SQL Editor:
```sql
SELECT 
  id,
  order_id,
  notification_type,
  status,
  error_message,
  created_at
FROM whatsapp_notifications
ORDER BY created_at DESC
LIMIT 10;
```

Check for:
- Status should be "sent" (not "failed" or "pending")
- error_message should be null
- sent_at should have a timestamp

### Check 4: Queue Processing

The queue should auto-process every 5 seconds. Check console for:
```
Processing X pending notifications
Notification enqueued: { id: ..., orderId: ..., type: ... }
Notification X sent successfully
```

## 📝 Files Changed

1. `wrangler.toml` - Moved vars from `[env.production.vars]` to `[vars]`
2. `src/integrations/whatsapp/evolution-client.ts` - Added debug logging

## ✅ Deployment Status

**Build**: ✅ Successful with environment variables  
**Deploy**: ✅ Successful  
**URL**: https://244ffdc7.coco-loko-acaiteria.pages.dev  
**Evolution API**: ✅ Credentials should now be loaded  
**SQL Migration**: ⚠️ Make sure `FIX_PAYMENT_RLS_SIMPLE.sql` was run  

## 🎯 Next Steps

1. Open production site
2. Check browser console for "Evolution API configured" message
3. Test order flow with payment
4. Verify WhatsApp message is sent
5. If still not working, check the troubleshooting steps above

---

**Status**: Environment variables fixed and deployed. WhatsApp messages should now send.

**Production URL**: https://244ffdc7.coco-loko-acaiteria.pages.dev
