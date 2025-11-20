# WhatsApp Webhook Setup Guide

## Overview

The webhook endpoint at `/api/whatsapp/webhook` receives incoming WhatsApp messages from Evolution API and automatically associates them with active customer orders.

## Configuration

### 1. Environment Variables

Ensure these environment variables are set in your Cloudflare Workers environment:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Evolution API Webhook Configuration

Configure the Evolution API to send webhooks to your endpoint.

#### Step-by-Step Configuration

**A. Access Evolution API Admin Interface**

1. Open your Evolution API admin panel (usually at `https://your-evolution-api-url/manager`)
2. Login with your credentials
3. Navigate to your instance (e.g., "cocooo")

**B. Configure Webhook Settings**

Evolution API supports webhook configuration via API or admin interface. Choose one method:

**Method 1: Via Evolution API Admin Interface**

1. Go to your instance settings
2. Find the "Webhook" or "Events" section
3. Enter your webhook URL:
   ```
   https://your-domain.pages.dev/api/whatsapp/webhook
   ```
   Or with custom domain:
   ```
   https://your-custom-domain.com/api/whatsapp/webhook
   ```
4. Enable webhook events
5. Select events to subscribe:
   - ✅ `messages.upsert` - **Required** for incoming messages
   - ❌ Other events (optional, will be filtered by webhook)
6. Save configuration

**Method 2: Via Evolution API REST Endpoint**

```bash
# Set your Evolution API credentials
EVOLUTION_API_URL="https://your-evolution-api-url"
EVOLUTION_API_KEY="your-api-key"
INSTANCE_NAME="cocooo"
WEBHOOK_URL="https://your-domain.pages.dev/api/whatsapp/webhook"

# Configure webhook via API
curl -X POST "${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'${WEBHOOK_URL}'",
    "webhook_by_events": true,
    "events": [
      "MESSAGES_UPSERT"
    ]
  }'
```

**C. Verify Webhook Configuration**

Check that webhook is configured correctly:

```bash
# Get webhook configuration
curl -X GET "${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}"
```

Expected response:
```json
{
  "url": "https://your-domain.pages.dev/api/whatsapp/webhook",
  "enabled": true,
  "events": ["MESSAGES_UPSERT"]
}
```

**Webhook URL Format:**
```
https://your-domain.com/api/whatsapp/webhook
```

**Required Events:**
- `messages.upsert` or `MESSAGES_UPSERT` - New incoming messages

### 3. Testing the Webhook

You can test the webhook using automated test scripts or manual methods.

#### Automated Testing (Recommended)

**Important:** Before testing, ensure the Cloudflare Function is deployed. The webhook endpoint will only work after deployment to Cloudflare Pages.

Use the provided test scripts to verify webhook functionality:

**Using Node.js Script (Cross-platform):**
```bash
# Test production webhook (after deployment)
node scripts/test-whatsapp-webhook.js

# Test custom webhook URL
WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook node scripts/test-whatsapp-webhook.js

# Test with custom phone number
TEST_PHONE=5573999988888 node scripts/test-whatsapp-webhook.js
```

**Using Bash Script (Linux/Mac):**
```bash
# Test production webhook (after deployment)
./scripts/test-whatsapp-webhook.sh

# Test custom webhook URL
WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook ./scripts/test-whatsapp-webhook.sh
```

The test script will verify:
- ✅ Valid inbound messages are processed
- ✅ Outbound messages are ignored
- ✅ Extended text message format works
- ✅ Invalid payloads are rejected (400)
- ✅ Non-message events are ignored
- ✅ Non-POST requests are rejected (405)

**Note:** If tests return 405 errors, the function may not be deployed yet. Deploy to Cloudflare Pages first:
```bash
npm run build
wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

#### Manual Testing

You can also test the webhook manually:

#### Test Payload Example

```json
{
  "event": "messages.upsert",
  "instance": "cocooo",
  "data": {
    "key": {
      "id": "3EB0123456789ABCDEF",
      "remoteJid": "5573999988888@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Quanto tempo para ficar pronto?"
    },
    "messageTimestamp": 1700000000
  }
}
```

#### Using curl

```bash
curl -X POST https://your-domain.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "cocooo",
    "data": {
      "key": {
        "id": "test123",
        "remoteJid": "5573999988888@s.whatsapp.net",
        "fromMe": false
      },
      "message": {
        "conversation": "Test message"
      }
    }
  }'
```

## How It Works

### Message Processing Flow

1. **Webhook Receives Message** - Evolution API sends incoming message
2. **Extract Phone Number** - Extracts and normalizes phone from `remoteJid`
3. **Find Active Orders** - Queries database for active orders with matching phone
4. **Select Most Recent** - If multiple orders exist, selects the most recently created
5. **Store Message** - Inserts message into `whatsapp_chat_messages` table
6. **Real-time Update** - Supabase broadcasts to connected admin clients

### Intelligent Order Association

The webhook uses smart logic to associate messages with orders:

- **Phone Normalization**: Removes all non-digit characters for matching
- **Active Orders Only**: Ignores completed/cancelled orders
- **Most Recent First**: Associates with the newest active order
- **No Match = Ignore**: Messages without active orders are not stored

### Message Filtering

The webhook automatically filters out:

- ✅ **Processes**: Inbound text messages from customers
- ❌ **Ignores**: Outbound messages (fromMe: true)
- ❌ **Ignores**: Non-message events
- ❌ **Ignores**: Messages without text content
- ❌ **Ignores**: Messages from customers without active orders

## Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | Success | Message processed and stored |
| 200 | Ignored | Event/message ignored (expected behavior) |
| 400 | Bad Request | Invalid payload structure |
| 405 | Method Not Allowed | Non-POST request |
| 500 | Server Error | Database or processing error |

## Monitoring

Check Cloudflare Workers logs to monitor webhook activity:

```bash
# View recent logs
wrangler tail

# Filter for webhook logs
wrangler tail --format pretty | grep webhook
```

### Key Log Messages

- `Received webhook:` - Incoming webhook details
- `Extracted phone number:` - Normalized phone number
- `Found X orders for phone` - Order query results
- `Found X active orders` - Active order count
- `Associating message with order:` - Selected order ID
- `Message stored successfully:` - Confirmation with message ID
- `No active orders found, ignoring message` - Expected when no active orders

## Troubleshooting

### Messages Not Appearing in Admin UI

1. Check webhook is configured in Evolution API
2. Verify environment variables are set
3. Check Cloudflare Workers logs for errors
4. Ensure customer has an active order
5. Verify phone number format matches order

### Database Errors

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
- Check RLS policies allow webhook inserts
- Verify `whatsapp_chat_messages` table exists

### Phone Number Matching Issues

- Phone numbers are normalized (digits only)
- Ensure `customer_phone` in orders matches format
- Check logs for extracted phone number

## Security

- Webhook validates payload structure
- Uses service role key for database access
- RLS policies enforce data access rules
- Consider adding webhook signature verification in production
