# 🔧 Fix WhatsApp Automatic Notifications

## Problem Analysis
Automatic WhatsApp notifications (payment confirmation, order ready) are failing while custom messages work.

### Console Errors Observed
```
❌ Error triggering reply notification: Error: Failed to enqueue notification
❌ Error checking opt-out status: Object
❌ Phone encryption not configured, storing phone number in plain text
❌ Failed to send resources: the server responded with status of 400 ()
❌ Evolution API Error: {"exists":false,"jid":"...@s.whatsapp.net"}
```

## Root Causes Identified

### ✅ Evolution API is Connected
```bash
curl http://wppapi.clubemkt.digital/instance/connectionState/cocooo
# Response: {"instance":{"instanceName":"cocooo","state":"open"}}
```

### ✅ Cloudflare Function is Deployed
The `/api/whatsapp/send-message` endpoint is working.

### ❌ Main Issue: Phone Number Validation
Evolution API is returning `{"exists":false}` for phone numbers, meaning:
1. The phone number doesn't have WhatsApp, OR
2. The phone number format is incorrect

### ⚠️ Secondary Issue: Phone Encryption Not Configured
The system warns about missing encryption but falls back to plain text (this is OK for now).

## Solution

### Option 1: Skip WhatsApp Existence Check (Recommended)
Modify the Evolution API client to send messages without checking if the number exists first.

### Option 2: Fix Phone Number Format
Ensure phone numbers are stored in the correct format: `5585999999999` (country code + DDD + number)


## Implementation

### Changes Made

#### 1. Enhanced Error Logging in `functions/api/whatsapp/send-message.ts`
- Added detailed error logging for Evolution API responses
- Better handling of "number doesn't exist" errors
- More informative error messages

#### 2. Improved Queue Manager Logging in `src/integrations/whatsapp/queue-manager.ts`
- Added phone number to log messages
- Better error context for debugging
- More detailed success messages

### Deployment

```bash
# Build the project
npm run build

# Deploy to Cloudflare
wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=main

# Or commit and push (auto-deploys)
git add functions/api/whatsapp/send-message.ts src/integrations/whatsapp/queue-manager.ts FIX_WHATSAPP_NOTIFICATIONS.md check-whatsapp-issue.sql
git commit -m "fix: improve WhatsApp notification error handling and logging"
git push origin main
```

## Testing

### 1. Test with a Real WhatsApp Number

Create a test order with a phone number that HAS WhatsApp:

```bash
# Test the API directly
curl -X POST "https://cocoloko.clubemkt.digital/api/whatsapp/send-message" \
  -H "Content-Type: application/json" \
  -d '{"number":"5585999714541","text":"🧪 Teste de notificação automática - Coco Loko"}'
```

### 2. Check Notification Queue

Run this SQL in Supabase:

```sql
-- Check recent notification attempts
SELECT 
  id,
  order_id,
  notification_type,
  status,
  attempts,
  error_message,
  created_at,
  sent_at
FROM whatsapp_notifications
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Monitor Console Logs

When creating an order and making payment:
1. Open browser console (F12)
2. Create order → Go to payment → Pay
3. Look for these logs:
   ```
   ✅ Payment confirmed trigger: { orderId: "..." }
   ✅ Payment confirmation notification queued: { orderId: "..." }
   ✅ Sending notification ... to 5585999714541
   ✅ Notification ... sent successfully
   ```

### 4. Test Order Ready Notification

In Kitchen dashboard:
1. Mark order as "Em Preparo"
2. Mark order as "Pronto"
3. Check console for:
   ```
   ✅ Order ready trigger: { orderId: "..." }
   ✅ Ready notification queued: { orderId: "..." }
   ```

## Common Issues & Solutions

### Issue 1: "Phone number does not have WhatsApp"
**Cause:** The phone number doesn't have WhatsApp installed or is invalid.

**Solution:**
- Verify the phone number has WhatsApp
- Check phone number format: `5585999999999` (country code + DDD + number)
- Test with your own WhatsApp number first

### Issue 2: "Evolution API Error (400)"
**Cause:** Evolution API rejected the request.

**Solutions:**
- Check if Evolution instance is connected:
  ```bash
  curl http://wppapi.clubemkt.digital/instance/connectionState/cocooo \
    -H "apikey: DD451E404240-4C45-AF35-BFCA6A976927"
  ```
- Verify phone number format
- Check Evolution API logs

### Issue 3: "Phone encryption not configured"
**Cause:** `VITE_PHONE_ENCRYPTION_KEY` environment variable not set.

**Solution:** This is a warning, not an error. The system falls back to storing phone numbers in plain text, which is acceptable for now. To fix:
1. Generate encryption key:
   ```javascript
   // Run in browser console
   const key = await crypto.subtle.generateKey(
     { name: 'AES-GCM', length: 256 },
     true,
     ['encrypt', 'decrypt']
   );
   const exported = await crypto.subtle.exportKey('raw', key);
   const keyString = btoa(String.fromCharCode(...new Uint8Array(exported)));
   console.log(keyString);
   ```
2. Add to `.env`:
   ```
   VITE_PHONE_ENCRYPTION_KEY=<generated_key>
   ```
3. Add to Cloudflare Pages environment variables

### Issue 4: Notifications Not Being Sent
**Debugging steps:**
1. Check if notifications are being queued:
   ```sql
   SELECT COUNT(*) FROM whatsapp_notifications WHERE status = 'pending';
   ```
2. Check for failed notifications:
   ```sql
   SELECT * FROM whatsapp_notifications WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5;
   ```
3. Manually trigger queue processing:
   - Go to WhatsApp Admin page
   - Click "Process Queue" button
4. Check browser console for errors

## Verification Checklist

- [ ] Evolution API is connected (`state: "open"`)
- [ ] Cloudflare Function is deployed
- [ ] Test message sends successfully
- [ ] Payment confirmation notification works
- [ ] Order ready notification works
- [ ] Notifications appear in database
- [ ] Customer receives WhatsApp messages
- [ ] No errors in browser console

## Next Steps

1. **Deploy the changes** (see Deployment section above)
2. **Test with real order** using a valid WhatsApp number
3. **Monitor logs** for any errors
4. **Verify customer receives messages**
5. **Optional:** Set up phone encryption for production

---

**Status:** 🟡 READY TO DEPLOY
**Priority:** 🔴 HIGH - Customers not receiving notifications
**Impact:** Improves customer experience and reduces support requests
