# MercadoPago Webhook Deployment Guide

## Overview

The MercadoPago webhook handler needs to be deployed as a serverless function to receive payment notifications. This guide covers deployment options for different platforms.

## Webhook Endpoint

The webhook handler is located at `src/api/mercadopago-webhook.ts` and needs to be deployed as an HTTP endpoint that MercadoPago can call.

## Deployment Options

### Option 1: Vercel (Recommended)

1. Create a `api/mercadopago-webhook.ts` file in the project root:

```typescript
// api/mercadopago-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMercadoPagoWebhook } from '../src/api/mercadopago-webhook';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleMercadoPagoWebhook({
      body: req.body,
      headers: req.headers as any
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

2. Deploy to Vercel:
```bash
npm install -g vercel
vercel --prod
```

3. The webhook URL will be: `https://your-app.vercel.app/api/mercadopago-webhook`

### Option 2: Netlify Functions

1. Create `netlify/functions/mercadopago-webhook.ts`:

```typescript
import type { Handler } from '@netlify/functions';
import { handleMercadoPagoWebhook } from '../../src/api/mercadopago-webhook';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const result = await handleMercadoPagoWebhook({
      body: JSON.parse(event.body || '{}'),
      headers: event.headers as any
    });

    return {
      statusCode: result.status,
      body: JSON.stringify(result.body)
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

2. The webhook URL will be: `https://your-app.netlify.app/.netlify/functions/mercadopago-webhook`

### Option 3: Express.js Server

If you prefer a traditional server approach:

```typescript
// server/webhook.ts
import express from 'express';
import { handleMercadoPagoWebhook } from '../src/api/mercadopago-webhook';

const app = express();
app.use(express.json());

app.post('/api/mercadopago-webhook', async (req, res) => {
  try {
    const result = await handleMercadoPagoWebhook({
      body: req.body,
      headers: req.headers as any
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
```

## MercadoPago Configuration

After deploying the webhook endpoint, configure it in MercadoPago:

1. Log into your MercadoPago account
2. Go to "Developers" > "Your integrations"
3. Select your application
4. In "Webhooks" section, add your webhook URL
5. Select the events you want to receive:
   - `payment.created`
   - `payment.updated`

## Environment Variables

Make sure these environment variables are set in your deployment:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
```

## Testing

Test the webhook endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/mercadopago-webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: test-signature" \
  -d '{
    "id": "12345",
    "live_mode": false,
    "type": "payment",
    "date_created": "2023-01-01T00:00:00Z",
    "application_id": "123",
    "user_id": "456",
    "version": "1",
    "api_version": "v1",
    "action": "payment.updated",
    "data": {
      "id": "payment-123"
    }
  }'
```

## Security Considerations

1. **Signature Validation**: Always validate webhook signatures
2. **HTTPS Only**: Only accept webhooks over HTTPS
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Idempotency**: Handle duplicate webhooks gracefully
5. **Error Handling**: Return appropriate HTTP status codes

## Monitoring

Monitor webhook processing:

1. Log all webhook events
2. Set up alerts for failed webhooks
3. Monitor response times
4. Track payment success rates

## Troubleshooting

Common issues:

1. **Webhook not received**: Check MercadoPago configuration and URL
2. **Signature validation fails**: Verify webhook secret
3. **Database errors**: Check Supabase connection and permissions
4. **Timeout errors**: Optimize webhook processing time