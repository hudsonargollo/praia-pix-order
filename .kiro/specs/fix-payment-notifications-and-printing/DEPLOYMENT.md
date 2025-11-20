# Deployment Guide: Payment Confirmation & Auto-Print

## Overview

This guide covers the deployment process for the payment confirmation and auto-print fixes. The deployment involves database migrations, edge function deployment, and frontend updates.

## Prerequisites

- Supabase CLI installed and configured
- Access to Supabase project (service role key)
- Node.js and npm installed
- Git repository access

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Edge function deployed
- [ ] Frontend code deployed
- [ ] Environment variables configured
- [ ] Smoke tests passed
- [ ] Monitoring configured

## Step-by-Step Deployment

### 1. Database Migration

#### 1.1 Create Payment Confirmation Log Table

```sql
-- Create table for tracking payment confirmations
CREATE TABLE IF NOT EXISTS payment_confirmation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  source TEXT NOT NULL,
  payment_method TEXT,
  payment_id TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_payment_confirmation_log_order 
ON payment_confirmation_log(order_id, created_at DESC);

-- Add RLS policy (service role can access all)
ALTER TABLE payment_confirmation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage payment confirmation logs"
ON payment_confirmation_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

#### 1.2 Add Deduplication Column to WhatsApp Notifications

```sql
-- Add dedupe_key column for preventing duplicate notifications
ALTER TABLE whatsapp_notifications 
ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

-- Create index for efficient deduplication checks
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_dedupe 
ON whatsapp_notifications(dedupe_key, created_at);
```

#### 1.3 Apply Migration

**Option A: Using Supabase CLI**
```bash
# Create migration file
supabase migration new payment_confirmation_infrastructure

# Add SQL from above to the migration file
# Then apply migration
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste SQL from sections 1.1 and 1.2
3. Click "Run" to execute

#### 1.4 Verify Migration

```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payment_confirmation_log', 'whatsapp_notifications');

-- Verify dedupe_key column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_notifications' 
  AND column_name = 'dedupe_key';

-- Verify indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('payment_confirmation_log', 'whatsapp_notifications');
```

### 2. Deploy Edge Function

#### 2.1 Verify Edge Function Files

Ensure these files exist:
- `supabase/functions/confirm-payment/index.ts`
- `supabase/functions/confirm-payment/paymentConfirmationService.ts`

#### 2.2 Deploy Edge Function

```bash
# Navigate to project root
cd /path/to/project

# Deploy the confirm-payment function
supabase functions deploy confirm-payment

# Verify deployment
supabase functions list
```

#### 2.3 Set Environment Variables

The edge function needs these environment variables:

```bash
# Set via Supabase CLI
supabase secrets set EVOLUTION_API_URL=your_evolution_api_url
supabase secrets set EVOLUTION_API_KEY=your_evolution_api_key
supabase secrets set EVOLUTION_INSTANCE_NAME=your_instance_name

# Or set via Supabase Dashboard:
# Project Settings > Edge Functions > Environment Variables
```

#### 2.4 Test Edge Function

```bash
# Test the deployed function
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/confirm-payment" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-id",
    "source": "manual"
  }'

# Expected response:
# {
#   "success": true,
#   "orderId": "test-order-id",
#   "notificationSent": true
# }
```

### 3. Deploy Frontend Changes

#### 3.1 Build Frontend

```bash
# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

#### 3.2 Deploy to Cloudflare Pages

**Option A: Using Wrangler CLI**
```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy dist

# Or if configured in package.json
npm run deploy
```

**Option B: Using Git Push (if connected)**
```bash
# Commit changes
git add .
git commit -m "Deploy payment confirmation and auto-print fixes"

# Push to main branch (triggers automatic deployment)
git push origin main
```

#### 3.3 Verify Deployment

1. Visit your production URL
2. Open browser console
3. Check for any errors
4. Verify pages load correctly

### 4. Update MercadoPago Webhook (if needed)

If the webhook handler was modified:

```bash
# Deploy mercadopago-webhook function
supabase functions deploy mercadopago-webhook

# Verify webhook URL in MercadoPago dashboard
# Should be: https://YOUR_PROJECT_REF.supabase.co/functions/v1/mercadopago-webhook
```

### 5. Smoke Tests

#### 5.1 Test Manual Payment Confirmation

1. Log in as cashier
2. Create a test order
3. Click "Confirmar Pagamento"
4. Verify:
   - Success message appears
   - Order status changes to 'in_preparation'
   - Check database for single WhatsApp notification
   - Check customer receives WhatsApp message

#### 5.2 Test Auto-Print

1. Open Kitchen page
2. Enable auto-print toggle
3. Confirm payment for an order (from Cashier panel)
4. Verify:
   - Kitchen receipt prints automatically
   - Order appears in kitchen display
   - No error messages

#### 5.3 Test Duplicate Prevention

1. Confirm payment for an order
2. Try to confirm again immediately
3. Verify:
   - No duplicate notification sent
   - Only one entry in `whatsapp_notifications` table
   - No error shown to user

#### 5.4 Database Verification

```sql
-- Check recent payment confirmations
SELECT * FROM payment_confirmation_log 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- Check for duplicate notifications
SELECT 
  order_id,
  COUNT(*) as notification_count
FROM whatsapp_notifications
WHERE notification_type = 'payment_confirmed'
  AND created_at > NOW() - INTERVAL '10 minutes'
GROUP BY order_id
HAVING COUNT(*) > 1;

-- Should return no rows if working correctly
```

## Rollback Procedure

If issues are discovered after deployment:

### 1. Rollback Frontend

```bash
# Revert to previous deployment
git revert HEAD
git push origin main

# Or rollback via Cloudflare Pages dashboard
# Deployments > Select previous deployment > Rollback
```

### 2. Rollback Edge Function

```bash
# Redeploy previous version
git checkout <previous-commit>
supabase functions deploy confirm-payment
git checkout main
```

### 3. Rollback Database (if needed)

```sql
-- Drop new table (only if causing issues)
DROP TABLE IF EXISTS payment_confirmation_log;

-- Remove dedupe_key column (only if causing issues)
ALTER TABLE whatsapp_notifications DROP COLUMN IF EXISTS dedupe_key;
```

**Note**: Database rollback should be a last resort. The new tables are additive and shouldn't break existing functionality.

## Post-Deployment Monitoring

### 1. Monitor Edge Function Logs

```bash
# Watch edge function logs in real-time
supabase functions logs confirm-payment --tail

# Look for errors or unexpected behavior
```

### 2. Monitor Database

```sql
-- Check payment confirmation success rate
SELECT 
  source,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN notification_sent THEN 1 ELSE 0 END) as successful_notifications,
  ROUND(100.0 * SUM(CASE WHEN notification_sent THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM payment_confirmation_log
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY source;

-- Check for errors
SELECT * FROM whatsapp_error_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### 3. Monitor User Reports

- Watch for customer complaints about duplicate notifications
- Monitor kitchen staff feedback on auto-print reliability
- Check support tickets for payment-related issues

### 4. Performance Monitoring

```sql
-- Check average response time (if logging timestamps)
SELECT 
  AVG(EXTRACT(EPOCH FROM (created_at - order_created_at))) as avg_confirmation_time_seconds
FROM payment_confirmation_log pcl
JOIN orders o ON o.id = pcl.order_id
WHERE pcl.created_at > NOW() - INTERVAL '1 day';
```

## Environment-Specific Notes

### Local Development

```bash
# Start local Supabase
supabase start

# Deploy functions locally
supabase functions serve

# Test locally
curl -X POST "http://localhost:54321/functions/v1/confirm-payment" \
  -H "Authorization: Bearer YOUR_LOCAL_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "test", "source": "manual"}'
```

### Staging Environment

1. Deploy to staging first
2. Run full test suite
3. Verify with real data (if available)
4. Get approval before production deployment

### Production Environment

1. Schedule deployment during low-traffic period
2. Have rollback plan ready
3. Monitor closely for first hour
4. Communicate with team about deployment

## Configuration Management

### Environment Variables

Ensure these are set in all environments:

**Supabase Edge Functions**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE_NAME`

**Frontend (Vite)**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_EVOLUTION_API_URL` (if needed)

### Verify Configuration

```bash
# Check Supabase secrets
supabase secrets list

# Check frontend environment
cat .env
```

## Troubleshooting Deployment Issues

### Issue: Edge Function Deployment Fails

```bash
# Check for syntax errors
deno check supabase/functions/confirm-payment/index.ts

# Check function logs
supabase functions logs confirm-payment

# Redeploy with verbose output
supabase functions deploy confirm-payment --debug
```

### Issue: Database Migration Fails

```bash
# Check migration status
supabase migration list

# Repair migration if needed
supabase migration repair <version>

# Reset local database (development only)
supabase db reset
```

### Issue: Frontend Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build

# Check for TypeScript errors
npm run type-check
```

## Success Criteria

Deployment is successful when:

- [ ] All database migrations applied without errors
- [ ] Edge function deployed and responding to requests
- [ ] Frontend deployed and accessible
- [ ] Smoke tests pass
- [ ] No duplicate WhatsApp notifications in production
- [ ] Auto-print working reliably
- [ ] No increase in error rates
- [ ] Team confirms functionality working as expected

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review payment confirmation logs for errors
2. **Monthly**: Analyze notification success rates
3. **Quarterly**: Review and optimize database indexes

### Monitoring Dashboards

Consider setting up:
- Supabase dashboard for database metrics
- Edge function performance monitoring
- Error tracking (e.g., Sentry)
- User feedback collection

### Documentation Updates

Keep these documents updated:
- IMPLEMENTATION_GUIDE.md - Architecture and integration details
- TROUBLESHOOTING.md - Common issues and solutions
- This DEPLOYMENT.md - Deployment procedures

## Contact Information

For deployment issues or questions:
- Technical Lead: [Contact Info]
- DevOps Team: [Contact Info]
- Supabase Support: https://supabase.com/support
