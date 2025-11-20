# WhatsApp Chat - Quick Test Reference

## Quick Start Testing

### 1. Run Automated Tests

```bash
# Set environment variables (if not already in .env)
export VITE_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export WEBHOOK_URL="https://your-domain.com/api/whatsapp/webhook"

# Run the automated test script
node scripts/test-whatsapp-chat-e2e.js
```

Expected output:
```
✅ Passed: 7
❌ Failed: 0
```

### 2. Quick Manual Test

**Test inbound message flow:**

1. Create a test order with phone `5573999988888`
2. Open the order in admin dashboard
3. Send WhatsApp message from that number: "Test message"
4. Verify:
   - ✅ Message appears in chat panel
   - ✅ Audio notification plays
   - ✅ Message is left-aligned with white background

**Test outbound message flow:**

1. In the same order, type: "Reply from staff"
2. Click send
3. Check customer's WhatsApp
4. Verify:
   - ✅ Message appears in chat panel (right-aligned, purple)
   - ✅ Customer receives message on WhatsApp
   - ✅ Status indicator shows ✓

### 3. Verify Database

```sql
-- Check recent messages
SELECT 
  cm.*,
  o.status as order_status,
  o.created_at as order_created
FROM whatsapp_chat_messages cm
JOIN orders o ON cm.order_id = o.id
ORDER BY cm.created_at DESC
LIMIT 10;

-- Check message counts by direction
SELECT 
  direction,
  COUNT(*) as count
FROM whatsapp_chat_messages
GROUP BY direction;
```

### 4. Check Webhook Logs

```bash
# View Cloudflare function logs
wrangler tail

# Or check logs in Cloudflare dashboard
# Look for: "Message stored successfully"
```

## Common Issues

### Messages Not Appearing

**Check:**
1. Webhook URL configured in Evolution API
2. Order status is NOT 'completed' or 'cancelled'
3. Phone number matches order's customer_phone
4. Cloudflare function logs for errors

**Fix:**
```bash
# Verify webhook configuration
curl -X GET "${VITE_EVOLUTION_API_URL}/webhook/find/${VITE_EVOLUTION_INSTANCE_NAME}" \
  -H "apikey: ${VITE_EVOLUTION_API_KEY}"
```

### Audio Not Playing

**Check:**
1. Browser audio permissions
2. Browser console for errors
3. Test in different browser

**Fix:**
- Allow audio in browser settings
- Check if Web Audio API is supported

### Real-Time Not Working

**Check:**
1. Supabase real-time enabled
2. RLS policies allow subscriptions
3. WebSocket connection in network tab

**Fix:**
```sql
-- Verify RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'whatsapp_chat_messages';
```

## Test Scenarios Checklist

Quick checklist for manual testing:

- [ ] Inbound message appears with audio
- [ ] Outbound message sends to WhatsApp
- [ ] Phone formats normalize correctly
- [ ] Multiple orders select most recent
- [ ] No active orders ignores message
- [ ] Completed orders ignore message
- [ ] Real-time works across tabs
- [ ] Audio plays only for inbound
- [ ] Status indicators display
- [ ] Errors handled gracefully

## Performance Benchmarks

Expected performance:

- **Webhook response time**: < 500ms
- **Message load time**: < 1s for 100 messages
- **Real-time latency**: < 2s from send to receive
- **UI responsiveness**: No lag with 50+ messages

## Quick Cleanup

```sql
-- Remove test data
DELETE FROM whatsapp_chat_messages 
WHERE phone_number = '5573999988888';

DELETE FROM orders 
WHERE customer_phone = '5573999988888';
```

## Documentation

For detailed testing procedures, see:
- `src/test/WHATSAPP_CHAT_E2E_TEST_GUIDE.md` - Comprehensive manual testing guide
- `src/test/WHATSAPP_CHAT_TEST_SUMMARY.md` - Test coverage summary
- `scripts/test-whatsapp-chat-e2e.js` - Automated test script

## Support

If tests fail:
1. Check environment variables are set
2. Verify Evolution API is connected
3. Check Supabase connection
4. Review Cloudflare function logs
5. Check browser console for errors

For issues, refer to the troubleshooting section in `WHATSAPP_CHAT_E2E_TEST_GUIDE.md`
