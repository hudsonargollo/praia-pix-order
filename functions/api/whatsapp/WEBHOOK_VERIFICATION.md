# WhatsApp Webhook Verification Guide

This guide helps you verify that the WhatsApp webhook is properly configured and working.

## Prerequisites Checklist

Before testing the webhook, ensure:

- [ ] Cloudflare Function is deployed (`functions/api/whatsapp/webhook.ts`)
- [ ] Environment variables are set in Cloudflare Pages:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Database table `whatsapp_chat_messages` exists
- [ ] Evolution API is running and accessible
- [ ] Evolution API webhook is configured with your endpoint URL

## Step 1: Verify Function Deployment

### Check Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com/
2. Navigate to: **Workers & Pages** > **Your Project**
3. Click on **Functions** tab
4. Verify `/api/whatsapp/webhook` is listed

### Test Endpoint Accessibility

```bash
# Test that endpoint exists (should return 405 for GET)
curl -X GET https://your-domain.pages.dev/api/whatsapp/webhook

# Expected: 405 Method Not Allowed
# If 404: Function not deployed or routing issue
```

## Step 2: Run Automated Tests

### Using Test Script

```bash
# Run comprehensive test suite
node scripts/test-whatsapp-webhook.js

# Or with custom URL
WEBHOOK_URL=https://your-domain.pages.dev/api/whatsapp/webhook \
  node scripts/test-whatsapp-webhook.js
```

### Expected Results

```
✓ Test 1 Passed - HTTP 200 (Valid inbound message)
✓ Test 2 Passed - HTTP 200 (Outbound message ignored)
✓ Test 3 Passed - HTTP 200 (Extended text format)
✓ Test 4 Passed - HTTP 400 (Invalid payload rejected)
✓ Test 5 Passed - HTTP 200 (Non-message event ignored)
✓ Test 6 Passed - HTTP 405 (GET request rejected)

Results: 6/6 tests passed
```

### Troubleshooting Test Failures

**All tests return 405:**
- Function not deployed to Cloudflare Pages
- Deploy with: `npm run build && wrangler pages deploy dist`

**Tests return 500:**
- Check environment variables in Cloudflare Pages
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
- Check Cloudflare Functions logs for errors

**Tests timeout:**
- Check Cloudflare Pages is accessible
- Verify network connectivity
- Check if domain is correct

## Step 3: Verify Database Integration

### Check Message Storage

After running tests, verify messages are stored:

```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  order_id,
  phone_number,
  direction,
  content,
  status,
  created_at
FROM whatsapp_chat_messages
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- Messages from test script should appear
- `direction` should be 'inbound'
- `status` should be 'sent'
- `order_id` may be NULL if no active orders exist for test phone

### Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'whatsapp_chat_messages';

-- Should return: rowsecurity = true

-- Check policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'whatsapp_chat_messages';
```

## Step 4: Test with Real WhatsApp Messages

### Setup Test Order

1. Create a test order in the system
2. Note the customer phone number
3. Ensure order status is NOT 'completed' or 'cancelled'

### Send Test Message

1. Send a WhatsApp message from the customer's phone
2. Message should be sent to the WhatsApp number connected to Evolution API
3. Wait 2-3 seconds for processing

### Verify in Admin UI

1. Open admin dashboard
2. Navigate to the order
3. Open order details/edit dialog
4. Check chat panel for the message
5. Verify audio notification played

### Check Logs

```bash
# Monitor webhook activity in real-time
wrangler tail --format pretty

# Look for these log messages:
# ✓ "Received webhook: messages.upsert"
# ✓ "Extracted phone number: XXXXX"
# ✓ "Found X active orders"
# ✓ "Associating message with order: XXX"
# ✓ "Message stored successfully: XXX"
```

## Step 5: Configure Evolution API Webhook

### Verify Webhook Configuration

```bash
# Check current webhook settings
curl -X GET "${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}"
```

**Expected Response:**
```json
{
  "url": "https://your-domain.pages.dev/api/whatsapp/webhook",
  "enabled": true,
  "events": ["MESSAGES_UPSERT"]
}
```

### Update Webhook if Needed

```bash
# Set webhook URL
curl -X POST "${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.pages.dev/api/whatsapp/webhook",
    "webhook_by_events": true,
    "events": ["MESSAGES_UPSERT"]
  }'
```

## Step 6: End-to-End Verification

### Complete Flow Test

1. **Create Order**
   - Create new order with customer phone: `5573999988888`
   - Ensure status is 'pending' or 'in_preparation'

2. **Send WhatsApp Message**
   - From phone `5573999988888`, send: "Quanto tempo para ficar pronto?"
   - Wait 2-3 seconds

3. **Verify in Admin**
   - Open order in admin dashboard
   - Message should appear in chat panel
   - Audio notification should play
   - Message should show timestamp

4. **Send Reply**
   - Type reply in chat panel: "15 minutos!"
   - Click send
   - Verify message appears in chat

5. **Verify Customer Receives**
   - Check customer's WhatsApp
   - Reply should be delivered
   - Message should show as sent/delivered

### Success Criteria

- [x] Webhook endpoint returns 200 for valid messages
- [x] Messages are stored in database
- [x] Messages appear in admin UI
- [x] Audio notification plays for inbound messages
- [x] Staff can send replies
- [x] Customer receives replies on WhatsApp
- [x] Real-time updates work across browser tabs
- [x] Webhook ignores outbound messages
- [x] Webhook ignores messages without active orders

## Common Issues and Solutions

### Issue: Webhook Returns 405

**Cause:** Function not deployed or routing misconfigured

**Solution:**
```bash
# Rebuild and deploy
npm run build
wrangler pages deploy dist --project-name=coco-loko-acaiteria

# Verify _routes.json includes /api/*
cat _routes.json
```

### Issue: Messages Not Stored

**Cause:** Missing environment variables or RLS policies

**Solution:**
1. Check Cloudflare Pages environment variables
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check RLS policies allow service role inserts
4. Review Cloudflare Functions logs

### Issue: Phone Number Not Matching

**Cause:** Phone format mismatch between order and WhatsApp

**Solution:**
```sql
-- Check phone format in orders
SELECT id, customer_phone, status 
FROM orders 
WHERE customer_phone LIKE '%999988888%';

-- Webhook normalizes to digits only
-- Ensure customer_phone in orders matches this format
```

### Issue: No Active Orders Found

**Cause:** Order is completed/cancelled or phone doesn't match

**Solution:**
1. Verify order status is NOT 'completed' or 'cancelled'
2. Check customer_phone field is populated
3. Ensure phone number matches exactly (digits only)
4. Review webhook logs for extracted phone number

### Issue: Audio Notification Not Playing

**Cause:** Browser permissions or audio file missing

**Solution:**
1. Check browser allows audio playback
2. Verify audio file exists in `src/assets/`
3. Check browser console for errors
4. Test in different browser

### Issue: Real-time Updates Not Working

**Cause:** Supabase real-time subscription issue

**Solution:**
1. Check Supabase project has real-time enabled
2. Verify RLS policies allow real-time access
3. Check browser console for WebSocket errors
4. Test manual refresh to verify data is stored

## Monitoring and Maintenance

### Regular Checks

**Daily:**
- Monitor Cloudflare Functions logs for errors
- Check webhook success rate in dashboard

**Weekly:**
- Review message volume and patterns
- Check for failed message deliveries
- Verify database storage is within limits

**Monthly:**
- Review and optimize RLS policies
- Check for webhook payload changes from Evolution API
- Update documentation if needed

### Key Metrics to Monitor

- **Webhook Success Rate**: Should be > 95%
- **Message Processing Time**: Should be < 500ms
- **Database Query Performance**: Should be < 100ms
- **Real-time Latency**: Should be < 2s

### Logging Best Practices

```bash
# Monitor webhook activity
wrangler tail --format pretty | grep webhook

# Filter for errors only
wrangler tail --format pretty | grep -i error

# Save logs to file for analysis
wrangler tail --format pretty > webhook-logs.txt
```

## Support and Troubleshooting

### Debug Checklist

When issues occur, check in this order:

1. [ ] Cloudflare Function is deployed
2. [ ] Environment variables are set correctly
3. [ ] Database table exists and has correct schema
4. [ ] RLS policies allow required operations
5. [ ] Evolution API webhook is configured
6. [ ] Test phone has active order
7. [ ] Webhook logs show message received
8. [ ] Database shows message inserted
9. [ ] Admin UI shows message in chat panel
10. [ ] Real-time subscription is active

### Getting Help

**Check Documentation:**
- `functions/api/whatsapp/WEBHOOK_SETUP.md` - Setup guide
- `DEPLOYMENT.md` - Deployment instructions
- `.kiro/specs/whatsapp-conversational-ui/` - Feature specs

**Review Logs:**
- Cloudflare Functions logs
- Supabase logs
- Browser console logs
- Evolution API logs

**Test Components:**
- Run automated test script
- Test webhook manually with curl
- Verify database directly with SQL
- Test Evolution API separately

## Conclusion

Once all verification steps pass, the webhook is properly configured and ready for production use. Regular monitoring and maintenance will ensure continued reliability.

For detailed setup instructions, see: `functions/api/whatsapp/WEBHOOK_SETUP.md`
