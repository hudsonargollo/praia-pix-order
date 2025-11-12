# Evolution API Integration Guide

## Overview

Evolution API is a production-ready WhatsApp API that provides a REST interface for sending messages, managing connections, and handling webhooks. It's perfect for the Coco Loko ordering system.

## Setup Evolution API

### Option 1: Deploy to Railway (Recommended - Free Tier Available)

1. **Fork your Evolution API repo** (already done: https://github.com/hudsonargollo/evolution-api.git)

2. **Deploy to Railway**:
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `evolution-api` repository
   - Railway will auto-detect and deploy

3. **Set Environment Variables** in Railway:
   ```env
   AUTHENTICATION_API_KEY=your-secret-key-here
   DATABASE_ENABLED=true
   DATABASE_CONNECTION_URI=postgresql://... (Railway provides this)
   WEBHOOK_GLOBAL_ENABLED=true
   WEBHOOK_GLOBAL_URL=https://your-coco-loko-site.pages.dev/api/whatsapp/webhook
   ```

4. **Get your Evolution API URL**:
   - Railway will provide a URL like: `https://evolution-api-production.up.railway.app`
   - Save this URL - you'll need it

### Option 2: Deploy to Render

1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables (same as above)

### Option 3: Local Development

```bash
# Clone your repo
git clone https://github.com/hudsonargollo/evolution-api.git
cd evolution-api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start the server
npm start
```

Server will run on `http://localhost:8080`

## Configure Coco Loko to Use Evolution API

### 1. Add Environment Variables

In your Cloudflare Pages project settings, add:

```env
VITE_EVOLUTION_API_URL=https://your-evolution-api.up.railway.app
VITE_EVOLUTION_API_KEY=your-secret-key-here
```

### 2. Evolution API Endpoints

The integration will use these endpoints:

**Create Instance (Connect WhatsApp)**:
```http
POST /instance/create
{
  "instanceName": "coco-loko",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS"
}
```

**Get QR Code**:
```http
GET /instance/connect/coco-loko
```

**Send Message**:
```http
POST /message/sendText/coco-loko
{
  "number": "5573999999999",
  "text": "Your message here"
}
```

**Check Connection Status**:
```http
GET /instance/connectionState/coco-loko
```

## Integration Flow

### 1. Connect WhatsApp

```typescript
// User clicks "Conectar WhatsApp" button
// → POST to Evolution API /instance/create
// → Get QR code from response
// → Display QR code to user
// → Poll /instance/connectionState until connected
```

### 2. Send Notification

```typescript
// Order status changes to 'paid'
// → Trigger notification
// → Format message with order details
// → POST to Evolution API /message/sendText
// → Log delivery status
```

### 3. Webhook (Optional)

Evolution API can send webhooks for:
- Message delivery status
- Connection status changes
- Incoming messages (for future features)

## Testing

### 1. Test Evolution API is Running

```bash
curl https://your-evolution-api.up.railway.app/instance/fetchInstances \
  -H "apikey: your-secret-key-here"
```

Should return: `[]` (empty array if no instances yet)

### 2. Create Test Instance

```bash
curl -X POST https://your-evolution-api.up.railway.app/instance/create \
  -H "apikey: your-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "test",
    "qrcode": true
  }'
```

Should return QR code data

### 3. Test Message Sending

```bash
curl -X POST https://your-evolution-api.up.railway.app/message/sendText/test \
  -H "apikey: your-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5573999999999",
    "text": "Test message from Coco Loko!"
  }'
```

## Security

### API Key

- Generate a strong API key: `openssl rand -hex 32`
- Store in environment variables (never commit to code)
- Use different keys for development and production

### Webhook Signature

Evolution API can sign webhooks for verification:
```env
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
WEBHOOK_GLOBAL_WEBHOOK_BASE64=false
```

### Rate Limiting

Evolution API has built-in rate limiting to prevent WhatsApp blocks:
- Default: 20 messages per minute
- Configurable via environment variables

## Monitoring

### Check Instance Status

```bash
curl https://your-evolution-api.up.railway.app/instance/connectionState/coco-loko \
  -H "apikey: your-secret-key-here"
```

Response:
```json
{
  "instance": "coco-loko",
  "state": "open"
}
```

States:
- `open` - Connected and ready
- `connecting` - Connecting to WhatsApp
- `close` - Disconnected

### View Logs

- Railway: Dashboard → Deployments → Logs
- Render: Dashboard → Logs
- Local: Check console output

## Troubleshooting

### QR Code Not Generating

**Check 1**: Evolution API is running
```bash
curl https://your-evolution-api.up.railway.app/
```

**Check 2**: API key is correct
```bash
curl https://your-evolution-api.up.railway.app/instance/fetchInstances \
  -H "apikey: your-api-key"
```

**Check 3**: Instance doesn't already exist
```bash
# Delete existing instance
curl -X DELETE https://your-evolution-api.up.railway.app/instance/delete/coco-loko \
  -H "apikey: your-api-key"
```

### Messages Not Sending

**Check 1**: Instance is connected
```bash
curl https://your-evolution-api.up.railway.app/instance/connectionState/coco-loko \
  -H "apikey: your-api-key"
```

**Check 2**: Phone number format
- Must be: `5573999999999` (country code + area code + number)
- No `+`, spaces, or special characters

**Check 3**: Check Evolution API logs for errors

### Connection Drops

**Solution 1**: Restart instance
```bash
curl -X PUT https://your-evolution-api.up.railway.app/instance/restart/coco-loko \
  -H "apikey: your-api-key"
```

**Solution 2**: Reconnect
- Delete instance
- Create new instance
- Scan QR code again

## Production Checklist

- [ ] Evolution API deployed and running
- [ ] Environment variables configured
- [ ] API key is secure and stored safely
- [ ] Test instance created and connected
- [ ] Test message sent successfully
- [ ] Webhook endpoint configured (optional)
- [ ] Monitoring set up
- [ ] Backup plan for disconnections
- [ ] Staff trained on reconnection process

## Next Steps

1. Deploy Evolution API to Railway/Render
2. Get the API URL and key
3. Update Coco Loko environment variables
4. Update WhatsApp integration code to use Evolution API
5. Test connection and message sending
6. Deploy updated Coco Loko app

## Costs

### Railway
- Free tier: 500 hours/month (enough for 24/7 operation)
- Paid: $5/month for more resources

### Render
- Free tier: Available with limitations
- Paid: $7/month for always-on service

### Evolution API
- Open source and free
- No per-message costs
- Only pay for hosting

## Support

- Evolution API Docs: https://doc.evolution-api.com
- GitHub Issues: https://github.com/EvolutionAPI/evolution-api/issues
- Community: Discord/Telegram groups

---

Ready to integrate? Let me know when you have Evolution API deployed and I'll update the Coco Loko code to connect to it!
