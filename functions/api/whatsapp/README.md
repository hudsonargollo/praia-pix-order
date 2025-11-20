# WhatsApp Webhook Integration

This directory contains the Cloudflare Function that handles incoming WhatsApp messages from Evolution API and integrates them with the order management system.

## Overview

The webhook enables two-way WhatsApp communication by:
- Receiving incoming customer messages via Evolution API webhooks
- Automatically associating messages with active orders based on phone number
- Storing messages in the database for display in the admin UI
- Enabling real-time chat updates through Supabase subscriptions

## Files

- **`webhook.ts`** - Main Cloudflare Function that processes incoming webhooks
- **`WEBHOOK_SETUP.md`** - Complete setup and configuration guide
- **`WEBHOOK_VERIFICATION.md`** - Step-by-step verification and testing guide

## Quick Start

### 1. Deploy the Function

The webhook is automatically deployed when you deploy to Cloudflare Pages:

```bash
npm run build
wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

### 2. Configure Environment Variables

Set these in Cloudflare Pages dashboard:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (not anon key)

### 3. Configure Evolution API

Set your webhook URL in Evolution API settings:

```
https://your-domain.pages.dev/api/whatsapp/webhook
```

Subscribe to events: `MESSAGES_UPSERT` or `messages.upsert`

### 4. Test the Webhook

Run the automated test suite:

```bash
node scripts/test-whatsapp-webhook.js
```

Expected: 6/6 tests passed

## How It Works

### Message Flow

```
Customer WhatsApp → Evolution API → Webhook → Supabase → Admin UI
                                      ↓
                              Order Association
                              (by phone number)
```

### Order Association Logic

1. Extract phone number from WhatsApp message
2. Normalize phone (remove non-digits)
3. Query for active orders with matching `customer_phone`
4. Select most recently created active order
5. Store message linked to that order
6. Ignore message if no active orders found

### Active Orders

An order is considered "active" if its status is NOT:
- `completed`
- `cancelled`

Only messages associated with active orders are stored.

## Key Features

- **Intelligent Routing**: Automatically links messages to the correct order
- **Active Order Filtering**: Only processes messages for active orders
- **Duplicate Prevention**: Ignores outbound messages (fromMe: true)
- **Error Handling**: Graceful handling of invalid payloads and edge cases
- **Real-time Updates**: Instant message delivery to admin UI via Supabase
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

## Webhook Endpoint

**URL:** `/api/whatsapp/webhook`

**Method:** `POST`

**Content-Type:** `application/json`

### Request Payload

```json
{
  "event": "messages.upsert",
  "instance": "cocooo",
  "data": {
    "key": {
      "id": "message-id",
      "remoteJid": "5573999988888@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Message text here"
    },
    "messageTimestamp": 1700000000
  }
}
```

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success - Message processed or ignored (expected) |
| 400 | Bad Request - Invalid payload structure |
| 405 | Method Not Allowed - Non-POST request |
| 500 | Server Error - Database or processing error |

## Testing

### Automated Tests

```bash
# Run full test suite
node scripts/test-whatsapp-webhook.js

# Test custom URL
WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook \
  node scripts/test-whatsapp-webhook.js

# Test with custom phone
TEST_PHONE=5573999988888 node scripts/test-whatsapp-webhook.js
```

### Manual Testing

```bash
# Send test message
curl -X POST https://your-domain.pages.dev/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "data": {
      "key": {
        "remoteJid": "5573999988888@s.whatsapp.net",
        "fromMe": false
      },
      "message": {
        "conversation": "Test message"
      }
    }
  }'
```

### End-to-End Testing

1. Create an active order with customer phone
2. Send WhatsApp message from that phone
3. Verify message appears in admin UI
4. Check audio notification plays
5. Send reply from admin UI
6. Verify customer receives reply

## Monitoring

### View Logs

```bash
# Real-time logs
wrangler tail --format pretty

# Filter webhook logs
wrangler tail --format pretty | grep webhook

# Filter errors
wrangler tail --format pretty | grep -i error
```

### Key Log Messages

**Success:**
- `Received webhook: messages.upsert`
- `Extracted phone number: XXXXX`
- `Found X active orders`
- `Associating message with order: XXX`
- `Message stored successfully: XXX`

**Expected Ignores:**
- `Ignoring outbound message`
- `No active orders found, ignoring message`
- `Ignoring non-message event`

**Errors:**
- `Missing remoteJid in payload`
- `Failed to query orders`
- `Failed to insert message`
- `Missing Supabase credentials`

## Troubleshooting

### Common Issues

**Webhook returns 405:**
- Function not deployed - run `npm run build && wrangler pages deploy dist`
- Check `_routes.json` includes `/api/*`

**Messages not stored:**
- Check environment variables in Cloudflare Pages
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check RLS policies allow service role inserts

**Phone not matching:**
- Verify `customer_phone` format in orders table
- Webhook normalizes to digits only
- Check logs for extracted phone number

**No active orders:**
- Verify order status is not 'completed' or 'cancelled'
- Check `customer_phone` field is populated
- Ensure phone number matches exactly

## Documentation

- **Setup Guide**: `WEBHOOK_SETUP.md` - Complete configuration instructions
- **Verification Guide**: `WEBHOOK_VERIFICATION.md` - Testing and troubleshooting
- **Deployment Guide**: `../../DEPLOYMENT.md` - Full deployment instructions
- **Feature Specs**: `../../.kiro/specs/whatsapp-conversational-ui/` - Requirements and design

## Security

- Validates payload structure before processing
- Uses service role key (not exposed to client)
- RLS policies enforce data access rules
- Sanitizes phone numbers and message content
- Rate limiting handled by Cloudflare automatically

## Performance

- **Target Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **Real-time Latency**: < 2s from send to receive

### Optimizations

- Indexed queries on `customer_phone` and `created_at`
- Efficient phone number normalization
- Minimal database operations
- Optimistic UI updates in frontend

## Future Enhancements

- Webhook signature verification
- Media message support (images, audio, video)
- Message queuing for retry on failure
- Analytics and metrics tracking
- Multi-language support

## Support

For issues or questions:

1. Check the documentation files in this directory
2. Review Cloudflare Functions logs
3. Test with automated test script
4. Verify database and RLS policies
5. Check Evolution API configuration

## Related Components

- **Frontend Hook**: `src/hooks/useOrderChat.ts`
- **UI Component**: `src/components/OrderChatPanel.tsx`
- **Database Table**: `whatsapp_chat_messages`
- **Migration**: `supabase/migrations/20251120000001_create_whatsapp_chat_messages_table.sql`
- **Test Scripts**: `scripts/test-whatsapp-webhook.js`, `scripts/test-whatsapp-webhook.sh`
