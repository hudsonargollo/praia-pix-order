# 🚨 CORS Issue - Evolution API Blocking Browser Requests

## Problem

The Evolution API is rejecting requests from the browser due to CORS (Cross-Origin Resource Sharing) restrictions.

**Error**: "Failed to process notification" - Network error

## Root Cause

Your Evolution API server (`http://wppapi.clubemkt.digital`) is not configured to accept requests from your Cloudflare Pages domain (`https://2b17598f.coco-loko-acaiteria.pages.dev`).

## Solution Options

### Option 1: Configure CORS on Evolution API (Recommended)

SSH into your Evolution API server and update the configuration:

```bash
# SSH into server
ssh your-server

# Navigate to Evolution API directory
cd evolution-api

# Edit .env file
nano .env
```

Add/update these lines:
```env
# Allow all origins (for testing)
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_CREDENTIALS=true

# Or allow specific domain (more secure)
CORS_ORIGIN=https://2b17598f.coco-loko-acaiteria.pages.dev,https://coco-loko-acaiteria.pages.dev
```

Restart Evolution API:
```bash
pm2 restart evolution-api
```

### Option 2: Create Cloudflare Function Proxy (Quick Fix)

Create a serverless function that proxies requests to Evolution API, bypassing CORS:

**File**: `functions/api/whatsapp/send.ts`

```typescript
export async function onRequest(context) {
  const { request, env } = context;
  
  // Only allow POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    
    // Forward to Evolution API
    const response = await fetch(
      `http://wppapi.clubemkt.digital/message/sendText/cocooo`,
      {
        method: 'POST',
        headers: {
          'apikey': 'DD451E404240-4C45-AF35-BFCA6A976927',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

Then update Evolution client to use the proxy:

```typescript
// In evolution-client.ts
const url = `/api/whatsapp/send`; // Instead of direct Evolution API URL
```

### Option 3: Use HTTPS for Evolution API

The mixed content (HTTPS site calling HTTP API) might also be blocked by browsers.

Set up Nginx with Let's Encrypt on your Evolution API server:

```bash
# Install Nginx and Certbot
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/evolution-api
```

```nginx
server {
    listen 80;
    server_name wppapi.clubemkt.digital;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'apikey, Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

Enable and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/evolution-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d wppapi.clubemkt.digital
```

## Quick Test

Open browser console on your production site and run:

```javascript
// Test if CORS is the issue
fetch('http://wppapi.clubemkt.digital/instance/connectionState/cocooo', {
  headers: { 'apikey': 'DD451E404240-4C45-AF35-BFCA6A976927' }
})
.then(r => r.json())
.then(d => console.log('✅ CORS OK:', d))
.catch(e => console.error('❌ CORS Error:', e));
```

If you see a CORS error, you need to configure the Evolution API server.

## Recommended Approach

1. **Immediate**: Use Option 2 (Cloudflare Function Proxy) - No server changes needed
2. **Long-term**: Use Option 3 (HTTPS + CORS) - More secure and professional

## After Fix

Once CORS is configured:
1. Refresh production site
2. Try "Notificar Pronto" button again
3. WhatsApp message should send successfully!

---

**Current Status**: Evolution API is working but blocking browser requests due to CORS.

**Quick Fix**: I'll create the Cloudflare Function proxy now...
