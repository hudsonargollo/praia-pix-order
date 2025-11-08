# WhatsApp Notifications Deployment Checklist

Use this checklist to ensure all steps are completed for production deployment.

## Pre-Deployment

### Environment Setup
- [ ] Run `npm run setup:whatsapp` to generate encryption key
- [ ] Copy generated encryption key to secure location
- [ ] Update `.env` with `SUPABASE_SERVICE_ROLE_KEY` from Supabase dashboard
- [ ] Verify all environment variables in `.env` are set correctly

### Database Preparation
- [ ] Connect to Supabase project: `npx supabase link --project-ref <your-ref>`
- [ ] Review pending migrations in `supabase/migrations/`
- [ ] Push migrations to production: `npx supabase db push`
- [ ] Verify tables exist:
  - [ ] `whatsapp_sessions`
  - [ ] `whatsapp_notifications`
  - [ ] `notification_templates`
  - [ ] `whatsapp_error_logs`
  - [ ] `whatsapp_opt_out`
- [ ] Verify default message templates are inserted

### Code Review
- [ ] Review WhatsApp function code in `functions/api/whatsapp/`
- [ ] Verify error handling is comprehensive
- [ ] Check that all sensitive data is encrypted
- [ ] Ensure rate limiting is appropriate
- [ ] Review security measures (encryption, access control)

### Testing
- [ ] Run all tests: `npm run test:run`
- [ ] Verify WhatsApp integration tests pass
- [ ] Test notification triggers locally
- [ ] Test queue processing
- [ ] Test error handling and recovery

## Cloudflare Configuration

### Pages Setup
- [ ] Create/verify Cloudflare Pages project exists
- [ ] Connect GitHub repository (if using automatic deployment)
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Root directory: `/`

### Environment Variables
Set these in Cloudflare Dashboard (Pages → Settings → Environment Variables):

#### Production Environment
- [ ] `SUPABASE_URL` = `https://sntxekdwdllwkszclpiq.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase dashboard)
- [ ] `WHATSAPP_ENCRYPTION_KEY` = (generated encryption key)
- [ ] `WHATSAPP_SESSION_ID` = `coco-loko-main`
- [ ] `MERCADOPAGO_ACCESS_TOKEN` = (existing MercadoPago token)

#### Preview Environment (Optional)
- [ ] Set same variables for preview deployments
- [ ] Consider using separate Supabase project for preview

### Functions Configuration
- [ ] Verify functions are in `functions/api/whatsapp/` directory
- [ ] Check that `package.json` dependencies include:
  - [ ] `@whiskeysockets/baileys`
  - [ ] `@supabase/supabase-js`
  - [ ] `@hapi/boom`
- [ ] Ensure compatibility date is set in `wrangler.toml`

## Deployment

### Build and Deploy
- [ ] Install dependencies: `npm install`
- [ ] Run production build: `npm run build`
- [ ] Verify build output in `dist/` directory
- [ ] Check for build errors or warnings

### Deploy to Cloudflare
Choose one method:

#### Automatic Deployment (Recommended)
- [ ] Push code to GitHub main branch
- [ ] Monitor deployment in Cloudflare dashboard
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

#### Manual Deployment
- [ ] Install Wrangler: `npm install -g wrangler`
- [ ] Login to Cloudflare: `wrangler login`
- [ ] Deploy: `wrangler pages deploy dist --project-name=coco-loko-acaiteria`
- [ ] Verify deployment success

## Post-Deployment Verification

### Function Testing
- [ ] Test connection status endpoint:
  ```bash
  curl https://your-domain.pages.dev/api/whatsapp/connection?action=status
  ```
- [ ] Verify response is valid JSON
- [ ] Check that no errors are returned

### WhatsApp Connection
- [ ] Navigate to WhatsApp Admin page: `/whatsapp-admin`
- [ ] Click "Connect WhatsApp"
- [ ] Verify QR code appears
- [ ] Scan QR code with WhatsApp mobile app
- [ ] Wait for connection confirmation
- [ ] Verify connection status shows "connected"
- [ ] Check that phone number is displayed

### Session Persistence
- [ ] Verify session is saved in `whatsapp_sessions` table
- [ ] Check that session data is encrypted
- [ ] Refresh page and verify connection persists
- [ ] Test automatic reconnection (wait 5 minutes)

### Notification Testing
- [ ] Create a test order with valid phone number
- [ ] Mark order as paid
- [ ] Verify payment confirmation notification is sent
- [ ] Check notification appears in `whatsapp_notifications` table
- [ ] Verify customer receives WhatsApp message
- [ ] Test other notification types (preparing, ready)

### Error Handling
- [ ] Test with invalid phone number
- [ ] Verify error is logged in `whatsapp_error_logs`
- [ ] Check that system continues processing other notifications
- [ ] Test retry mechanism for failed messages

### Monitoring
- [ ] Access WhatsApp Admin dashboard
- [ ] Verify connection status is displayed
- [ ] Check delivery rate statistics
- [ ] Review error logs
- [ ] Test manual notification controls in Cashier dashboard

## Production Monitoring

### Daily Checks
- [ ] Monitor connection status in admin dashboard
- [ ] Review delivery rates (should be >90%)
- [ ] Check for error spikes in logs
- [ ] Verify automatic reconnection is working

### Weekly Checks
- [ ] Review `whatsapp_error_logs` for patterns
- [ ] Check notification queue for stuck messages
- [ ] Verify session is still active
- [ ] Review customer opt-out requests

### Monthly Checks
- [ ] Clean up old notification records (>30 days)
- [ ] Review and update message templates if needed
- [ ] Check database performance
- [ ] Review Cloudflare Functions usage and costs

## Rollback Plan

If issues occur:

### Immediate Actions
- [ ] Revert to previous deployment in Cloudflare dashboard
- [ ] Check Cloudflare Functions logs for errors
- [ ] Verify database is accessible
- [ ] Notify team of issues

### Investigation
- [ ] Review deployment logs
- [ ] Check environment variables are correct
- [ ] Verify database migrations were applied
- [ ] Test locally to reproduce issue

### Resolution
- [ ] Fix identified issues
- [ ] Test fixes locally
- [ ] Run all tests
- [ ] Redeploy with fixes
- [ ] Verify resolution in production

## Documentation

### Update Documentation
- [ ] Document any custom configurations
- [ ] Update team wiki with deployment notes
- [ ] Record encryption key location (securely)
- [ ] Document any issues encountered and solutions

### Team Training
- [ ] Train cashier staff on manual notification controls
- [ ] Show admin staff how to monitor connection status
- [ ] Explain error handling and recovery procedures
- [ ] Provide contact for technical support

## Sign-Off

- [ ] Deployment completed by: _________________ Date: _________
- [ ] Verification completed by: _________________ Date: _________
- [ ] Team training completed by: _________________ Date: _________
- [ ] Documentation updated by: _________________ Date: _________

## Notes

Use this section to record any issues, special configurations, or important information:

```
[Add deployment notes here]
```
