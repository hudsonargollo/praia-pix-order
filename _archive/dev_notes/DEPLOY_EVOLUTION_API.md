# Deploy Evolution API Integration to Production

## 🚀 Quick Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

Or use the automated script:

```bash
npm run deploy
```

## 📋 Pre-Deployment Checklist

### ✅ 1. Environment Variables Configured
The following variables are already set in `wrangler.toml`:

```toml
VITE_EVOLUTION_API_URL = "http://wppapi.clubemkt.digital"
VITE_EVOLUTION_API_KEY = "DD451E404240-4C45-AF35-BFCA6A976927"
VITE_EVOLUTION_INSTANCE_NAME = "cocooo"
```

### ✅ 2. Evolution API Instance Connected
- Instance: `cocooo`
- Status: Connected (open)
- WhatsApp Number: 573189719731

### ✅ 3. Files Ready for Deployment
- `src/integrations/whatsapp/evolution-client.ts` - Evolution API client
- `wrangler.toml` - Updated with Evolution API variables
- `.env` - Local environment configured

## 🔧 Deployment Steps

### Step 1: Build the Application

```bash
npm run build
```

This creates the `dist` folder with your production build.

### Step 2: Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

Or use the shortcut:

```bash
npm run deploy
```

### Step 3: Verify Deployment

After deployment, you'll see output like:

```
✨ Success! Uploaded 1 files (X.XX sec)

✨ Deployment complete! Take a peek over at
   https://xxxxxxxx.coco-loko-acaiteria.pages.dev
```

## 🧪 Post-Deployment Testing

### 1. Test Evolution API Connection

Visit your production URL and open browser console:

```javascript
// Test in browser console
const { evolutionClient } = await import('/src/integrations/whatsapp/evolution-client.ts');
const isConnected = await evolutionClient.isConnected();
console.log('Connected:', isConnected);
```

### 2. Test Order Flow

1. Go to your production site
2. Create a test order
3. Complete payment
4. Verify WhatsApp notification is sent

### 3. Check Logs

Monitor Cloudflare Pages logs:

```bash
npx wrangler pages deployment tail
```

## 🔐 Security Considerations

### Current Setup
- Evolution API URL is HTTP (not HTTPS)
- API key is exposed in frontend code
- Instance is publicly accessible

### Recommended Improvements

#### 1. Add HTTPS to Evolution API
Use a reverse proxy (Nginx + Let's Encrypt):

```nginx
server {
    listen 443 ssl;
    server_name wppapi.clubemkt.digital;
    
    ssl_certificate /etc/letsencrypt/live/wppapi.clubemkt.digital/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wppapi.clubemkt.digital/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 2. Move API Key to Backend (Optional)
Create a Cloudflare Function to proxy WhatsApp requests:

```typescript
// functions/api/whatsapp/send.ts
export async function onRequest(context) {
  const { request, env } = context;
  
  // API key stored in Cloudflare environment
  const apiKey = env.EVOLUTION_API_KEY;
  
  // Forward request to Evolution API
  const response = await fetch(`${env.EVOLUTION_API_URL}/message/sendText/${env.EVOLUTION_INSTANCE_NAME}`, {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json',
    },
    body: await request.text(),
  });
  
  return response;
}
```

Then update client to use your function:

```typescript
// Instead of calling Evolution API directly
await fetch('/api/whatsapp/send', {
  method: 'POST',
  body: JSON.stringify({ number, text })
});
```

## 🔄 Update Existing WhatsApp Service

To use Evolution API in your existing notification system, update `src/integrations/whatsapp/service.ts`:

```typescript
import { evolutionClient } from './evolution-client';

// Replace in sendOrderConfirmation method:
const messageId = await evolutionClient.sendTextMessage({
  number: orderData.customerPhone,
  text: message,
  delay: 0
});
```

## 📊 Monitoring

### Check Instance Status

```bash
curl http://wppapi.clubemkt.digital/instance/connectionState/cocooo \
  -H "apikey: DD451E404240-4C45-AF35-BFCA6A976927"
```

### View Message Logs

Check Supabase `whatsapp_notifications` table for delivery status.

### Monitor Evolution API

```bash
# On your Evolution API server
pm2 logs evolution-api
```

## 🐛 Troubleshooting

### Issue: Instance Disconnected

**Solution:**
1. Get QR code: `GET /instance/connect/cocooo`
2. Scan with WhatsApp
3. Wait for connection

### Issue: Messages Not Sending

**Check:**
1. Instance connection status
2. Phone number format (must include country code)
3. Evolution API logs
4. Network connectivity

### Issue: CORS Errors

**Solution:**
Evolution API should have CORS enabled. If not, add to Evolution API config:

```yaml
# In Evolution API .env
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
```

## 🎯 Next Steps After Deployment

1. **Test thoroughly** - Create test orders and verify notifications
2. **Monitor logs** - Watch for any errors in first 24 hours
3. **Add HTTPS** - Secure your Evolution API endpoint
4. **Set up monitoring** - Add uptime monitoring for Evolution API
5. **Document for team** - Share WhatsApp connection process with staff

## 📞 Support

If you encounter issues:

1. Check Evolution API status: `http://wppapi.clubemkt.digital/instance/fetchInstances`
2. Review Cloudflare Pages logs: `npx wrangler pages deployment tail`
3. Check Supabase logs for database errors
4. Test locally first: `npm run dev`

## 🎉 Success Indicators

After deployment, you should see:

- ✅ Site loads at production URL
- ✅ Evolution API client initializes without errors
- ✅ Order notifications send successfully
- ✅ Messages appear in WhatsApp within seconds
- ✅ Notification logs appear in Supabase

---

**Ready to deploy?** Run `npm run deploy` and follow the prompts!
