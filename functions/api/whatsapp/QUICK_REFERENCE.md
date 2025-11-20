# WhatsApp Webhook Quick Reference

## Webhook URL

```
https://your-domain.pages.dev/api/whatsapp/webhook
```

## Evolution API Configuration

```bash
# Set webhook via API
curl -X POST "${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.pages.dev/api/whatsapp/webhook",
    "webhook_by_events": true,
    "events": ["MESSAGES_UPSERT"]
  }'
```

## Required Environment Variables

In Cloudflare Pages:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Test Commands

```bash
# Automated test
node scripts/test-whatsapp-webhook.js

# Manual test
curl -X POST https://your-domain.pages.dev/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":{"key":{"remoteJid":"5573999988888@s.whatsapp.net","fromMe":false},"message":{"conversation":"test"}}}'

# Monitor logs
wrangler tail --format pretty | grep webhook
```

## Response Codes

- **200** - Success or ignored (expected)
- **400** - Invalid payload
- **405** - Wrong HTTP method
- **500** - Server error

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 405 errors | Deploy function: `npm run build && wrangler pages deploy dist` |
| 500 errors | Check environment variables in Cloudflare Pages |
| No messages | Verify customer has active order (not completed/cancelled) |
| Phone mismatch | Check `customer_phone` format matches (digits only) |

## Documentation

- **Setup**: `WEBHOOK_SETUP.md`
- **Verification**: `WEBHOOK_VERIFICATION.md`
- **Overview**: `README.md`
- **Deployment**: `../../DEPLOYMENT.md`

## Key Behaviors

- ✅ Processes inbound messages only (fromMe: false)
- ✅ Associates with most recent active order
- ✅ Ignores messages without active orders
- ✅ Normalizes phone numbers (digits only)
- ✅ Supports conversation and extendedTextMessage formats
- ❌ Ignores outbound messages
- ❌ Ignores non-message events
- ❌ Ignores completed/cancelled orders
