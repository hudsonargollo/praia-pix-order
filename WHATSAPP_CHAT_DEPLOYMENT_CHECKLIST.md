# WhatsApp Conversational UI - Deployment Checklist

## ✅ Completed Steps

### 1. Code Deployment
- [x] All code committed to Git
- [x] Pushed to GitHub (commit: 7a419b2)
- [x] GitHub Actions will automatically deploy to Cloudflare Pages

### 2. Files Deployed
- [x] Webhook endpoint: `functions/api/whatsapp/webhook.ts`
- [x] Chat panel component: `src/components/OrderChatPanel.tsx`
- [x] Chat hook: `src/hooks/useOrderChat.ts`
- [x] Unread messages hook: `src/hooks/useUnreadMessages.ts`
- [x] Database migration: `supabase/migrations/20251120000001_create_whatsapp_chat_messages_table.sql`
- [x] Test suite and documentation

## 🔄 Pending Steps

### 3. Database Migration

**Action Required**: Apply the database migration to create the `whatsapp_chat_messages` table.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy and paste the migration SQL from: `supabase/migrations/20251120000001_create_whatsapp_chat_messages_table.sql`
3. Click "Run" to execute
4. Verify table was created: Check "Table Editor" for `whatsapp_chat_messages`

**Option B: Via Supabase CLI**

```bash
# If you have Supabase CLI configured
npx supabase db push --include-all

# Or apply just this migration
psql $DATABASE_URL -f supabase/migrations/20251120000001_create_whatsapp_chat_messages_table.sql
```

**Verification Query:**
```sql
-- Check table exists
SELECT * FROM whatsapp_chat_messages LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'whatsapp_chat_messages';
```

### 4. Cloudflare Environment Variables

**Action Required**: Ensure these environment variables are set in Cloudflare Pages.

Go to: Cloudflare Dashboard > Pages > Your Project > Settings > Environment variables

**Required Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (NOT anon key)
- `VITE_EVOLUTION_API_URL` - Evolution API base URL
- `VITE_EVOLUTION_API_KEY` - Evolution API key
- `VITE_EVOLUTION_INSTANCE_NAME` - Instance name (e.g., "cocooo")

**Verification:**
```bash
# After setting variables, redeploy
# Go to: Cloudflare Dashboard > Pages > Deployments
# Click "Retry deployment" on latest deployment
```

### 5. Evolution API Webhook Configuration

**Action Required**: Configure webhook URL in Evolution API.

**Webhook URL Format:**
```
https://your-domain.pages.dev/api/whatsapp/webhook
```

**Configuration Steps:**

1. **Access Evolution API Admin Panel**
   - Login to your Evolution API instance
   - Navigate to instance settings (e.g., "cocooo" instance)

2. **Set Webhook URL**
   - Find "Webhook" or "Events" configuration
   - Set URL to: `https://your-domain.pages.dev/api/whatsapp/webhook`
   - Enable event: `messages.upsert`
   - Save configuration

3. **Test Webhook**
   ```bash
   # Test webhook is accessible
   curl -X POST https://your-domain.pages.dev/api/whatsapp/webhook \
     -H "Content-Type: application/json" \
     -d '{"event":"messages.upsert","data":{"key":{"remoteJid":"5573999988888@s.whatsapp.net","fromMe":false},"message":{"conversation":"test"}}}'
   
   # Expected: 200 OK response
   ```

**Verification:**
- Send a WhatsApp message from a customer with an active order
- Check if message appears in admin dashboard
- Check Cloudflare Functions logs for webhook activity

### 6. Testing

**Action Required**: Run end-to-end tests to verify deployment.

**Quick Test:**

1. **Create Test Order**
   - Create order with phone: `5573999988888`
   - Status should be active (not completed)

2. **Test Inbound Message**
   - Send WhatsApp message from that number
   - Open order in admin dashboard
   - Verify message appears in chat panel
   - Verify audio notification plays

3. **Test Outbound Message**
   - Type message in chat panel
   - Click send
   - Verify customer receives on WhatsApp
   - Verify message appears in chat panel

**Automated Tests:**

```bash
# Set environment variables
export VITE_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export WEBHOOK_URL="https://your-domain.pages.dev/api/whatsapp/webhook"

# Run automated test suite
node scripts/test-whatsapp-chat-e2e.js

# Expected: 7/7 tests passed
```

**Manual Test Guide:**

Follow comprehensive testing procedures in:
- `src/test/WHATSAPP_CHAT_E2E_TEST_GUIDE.md`
- `src/test/WHATSAPP_CHAT_QUICK_TEST.md`

## 📋 Deployment Verification Checklist

Use this checklist to verify deployment is complete:

### Database
- [ ] `whatsapp_chat_messages` table exists
- [ ] Enums `message_direction` and `message_status` created
- [ ] Indexes created (phone_number, order_id, created_at)
- [ ] RLS policies active (4 policies)
- [ ] Can query table without errors

### Cloudflare Deployment
- [ ] GitHub Actions deployment succeeded
- [ ] Cloudflare Pages shows latest deployment
- [ ] Environment variables set correctly
- [ ] Webhook endpoint accessible at `/api/whatsapp/webhook`
- [ ] Frontend build includes new components

### Evolution API
- [ ] Webhook URL configured
- [ ] Event `messages.upsert` enabled
- [ ] Test webhook returns 200 OK
- [ ] Webhook logs show activity

### Frontend
- [ ] Chat panel visible in order details
- [ ] Messages load correctly
- [ ] Send message button works
- [ ] Real-time updates work
- [ ] Audio notification plays
- [ ] Unread indicators show on order cards

### Backend
- [ ] Webhook processes inbound messages
- [ ] Messages stored in database
- [ ] Phone number normalization works
- [ ] Order association logic works
- [ ] Error handling works gracefully

## 🚨 Troubleshooting

### Issue: Webhook Returns 405 Error

**Cause**: Cloudflare Function not deployed or routing issue

**Solution**:
1. Check Cloudflare Dashboard > Workers & Pages > Functions
2. Verify `/api/whatsapp/webhook` is listed
3. Redeploy if missing
4. Check `functions/api/whatsapp/webhook.ts` file exists

### Issue: Messages Not Appearing

**Cause**: Database migration not applied or RLS policies blocking

**Solution**:
1. Verify table exists: `SELECT * FROM whatsapp_chat_messages;`
2. Check RLS policies allow service role inserts
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
4. Check Cloudflare Functions logs for errors

### Issue: Audio Not Playing

**Cause**: Browser permissions or Web Audio API not supported

**Solution**:
1. Check browser audio permissions
2. Test in different browser (Chrome recommended)
3. Check browser console for errors
4. Verify Web Audio API is supported

### Issue: Real-Time Not Working

**Cause**: Supabase real-time not enabled or RLS blocking subscriptions

**Solution**:
1. Enable real-time in Supabase dashboard
2. Check RLS policies allow authenticated reads
3. Verify WebSocket connection in network tab
4. Check browser console for subscription errors

## 📊 Monitoring

### Key Metrics to Monitor

1. **Webhook Success Rate**
   - Check Cloudflare Functions logs
   - Monitor for 500 errors
   - Track message processing time

2. **Message Delivery**
   - Monitor Evolution API logs
   - Check for failed sends
   - Track delivery status updates

3. **Database Performance**
   - Monitor query execution time
   - Check index usage
   - Watch for slow queries

4. **User Experience**
   - Track audio notification playback
   - Monitor real-time latency
   - Check for UI errors

### Logging

**Cloudflare Functions Logs:**
```bash
# Real-time monitoring
wrangler tail --format pretty

# Or view in dashboard:
# Cloudflare Dashboard > Workers & Pages > Your Project > Logs
```

**Database Logs:**
```sql
-- Recent messages
SELECT * FROM whatsapp_chat_messages 
ORDER BY created_at DESC 
LIMIT 20;

-- Message counts by direction
SELECT direction, COUNT(*) 
FROM whatsapp_chat_messages 
GROUP BY direction;

-- Failed messages
SELECT * FROM whatsapp_chat_messages 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## 🎉 Post-Deployment

### Announce to Team

Once deployment is verified:

1. **Notify staff** about new chat feature
2. **Provide training** on using chat panel
3. **Share documentation** links
4. **Set expectations** for response times

### Documentation Links

- **Setup Guide**: `functions/api/whatsapp/WEBHOOK_SETUP.md`
- **Quick Reference**: `functions/api/whatsapp/QUICK_REFERENCE.md`
- **Testing Guide**: `src/test/WHATSAPP_CHAT_E2E_TEST_GUIDE.md`
- **Test Summary**: `src/test/WHATSAPP_CHAT_TEST_SUMMARY.md`

### Next Steps

- Monitor webhook activity for first 24 hours
- Gather user feedback on chat experience
- Optimize based on usage patterns
- Consider adding features:
  - Message templates
  - Typing indicators
  - Read receipts
  - File attachments

## 📞 Support

If you encounter issues:

1. Check troubleshooting section above
2. Review Cloudflare Functions logs
3. Check Supabase logs
4. Test with automated script
5. Refer to comprehensive test guide

---

**Deployment Status**: 🟡 Partially Complete

**Remaining Actions**:
1. Apply database migration
2. Configure Evolution API webhook
3. Run verification tests

**Estimated Time**: 15-30 minutes

---

**Last Updated**: 2024-11-20
**Feature**: WhatsApp Conversational UI
**Version**: 1.0.0
