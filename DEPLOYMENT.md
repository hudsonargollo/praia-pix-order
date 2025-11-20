# Deployment Guide

This guide covers deploying the Coco Loko Açaiteria application to GitHub and Cloudflare Pages.

## Prerequisites

1. **GitHub Account** with repository access
2. **Cloudflare Account** with Pages enabled
3. **Git** installed locally
4. **Node.js** and npm installed

## Step 1: Push to GitHub

### First Time Setup

If this is your first time pushing to GitHub:

```bash
# Add all changes
git add .

# Commit changes
git commit -m "feat: Add waiter edit permissions and improvements"

# Push to GitHub
git push origin main
```

### Regular Updates

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

## Step 2: Configure GitHub Secrets

For automated deployment, add these secrets to your GitHub repository:

1. Go to: `https://github.com/hudsonargollo/praia-pix-order/settings/secrets/actions`

2. Add the following secrets:

### Cloudflare Secrets
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Application Secrets
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key
- `VITE_MERCADOPAGO_PUBLIC_KEY` - MercadoPago public key (for credit card payments)
- `VITE_MERCADOPAGO_ACCESS_TOKEN` - MercadoPago access token (for PIX and card payments)
- `VITE_EVOLUTION_API_URL` - Evolution API URL for WhatsApp
- `VITE_EVOLUTION_API_KEY` - Evolution API key
- `VITE_EVOLUTION_INSTANCE_NAME` - Evolution instance name

**Note**: Both `VITE_MERCADOPAGO_PUBLIC_KEY` and `VITE_MERCADOPAGO_ACCESS_TOKEN` are required for the credit card payment feature. Get these from your [MercadoPago Developer Dashboard](https://www.mercadopago.com.br/developers/panel/app).

### How to Get Cloudflare Credentials

#### Get API Token:
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Add "Cloudflare Pages" permissions
5. Copy the token

#### Get Account ID:
1. Go to: https://dash.cloudflare.com/
2. Select your account
3. Copy the Account ID from the URL or sidebar

### Configuring Cloudflare Pages Environment Variables

After deploying to Cloudflare Pages, you need to configure environment variables:

1. **Go to Cloudflare Pages Dashboard**
   - Navigate to: https://dash.cloudflare.com/
   - Select "Pages" from the sidebar
   - Select your project (e.g., "coco-loko-acaiteria")

2. **Add Environment Variables**
   - Go to "Settings" > "Environment variables"
   - Add each variable for both "Production" and "Preview" environments:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_MERCADOPAGO_PUBLIC_KEY`
     - `VITE_MERCADOPAGO_ACCESS_TOKEN`
     - `VITE_EVOLUTION_API_URL`
     - `VITE_EVOLUTION_API_KEY`
     - `VITE_EVOLUTION_INSTANCE_NAME`
     - `SUPABASE_SERVICE_KEY` (for Cloudflare Functions)

3. **Redeploy After Adding Variables**
   - After adding environment variables, trigger a new deployment
   - Go to "Deployments" tab
   - Click "Retry deployment" on the latest deployment
   - Or push a new commit to trigger automatic deployment

**Important**: Environment variables are only available after redeployment. Changes to environment variables require a new deployment to take effect.

## Step 3: Automated Deployment (Recommended)

Once GitHub secrets are configured, deployment is automatic:

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **GitHub Actions will automatically**:
   - Install dependencies
   - Run tests
   - Build the application
   - Deploy to Cloudflare Pages

3. **Monitor deployment**:
   - Go to: `https://github.com/hudsonargollo/praia-pix-order/actions`
   - Watch the deployment progress

## Step 4: Manual Deployment (Alternative)

If you prefer manual deployment:

### Using Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the application
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=main
```

### Using Deployment Script

```bash
# Run the automated deployment script
npm run deploy:full
```

This script will:
1. Check environment variables
2. Install dependencies
3. Run tests
4. Build application
5. Deploy to Cloudflare Pages

## MercadoPago Configuration

### Getting Your MercadoPago Credentials

The application supports both PIX and credit card payments through MercadoPago. You'll need two credentials:

1. **Public Key** (`VITE_MERCADOPAGO_PUBLIC_KEY`)
   - Used by the frontend Payment Brick SDK to tokenize credit card data
   - Safe to expose in client-side code
   - Format: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

2. **Access Token** (`VITE_MERCADOPAGO_ACCESS_TOKEN`)
   - Used by backend to create payments and process transactions
   - Must be kept secret (though prefixed with VITE_ for Cloudflare compatibility)
   - Format: `APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx`

### How to Get Your Credentials

1. **Login to MercadoPago**
   - Go to: https://www.mercadopago.com.br/developers/panel/app
   - Login with your MercadoPago account

2. **Create or Select an Application**
   - Create a new application or select an existing one
   - Give it a descriptive name (e.g., "Coco Loko Açaiteria")

3. **Get Your Credentials**
   - Navigate to "Credenciais de produção" (Production Credentials) or "Credenciais de teste" (Test Credentials)
   - Copy the **Public Key** (Chave pública)
   - Copy the **Access Token** (Access token)

4. **Add to Environment Variables**
   - Add both credentials to your `.env` file
   - Add both to GitHub Secrets for automated deployment
   - Add both to Cloudflare Pages environment variables

### Testing vs Production

**Test Mode** (Sandbox):
- Use test credentials from "Credenciais de teste"
- Test with MercadoPago test cards
- No real money is processed
- Recommended for development

**Production Mode**:
- Use production credentials from "Credenciais de produção"
- Real payments are processed
- Requires verified MercadoPago account
- Use only after thorough testing

### Test Cards for Development

When using test credentials, use these test cards:

**Approved Payment**:
- Card: `5031 4332 1540 6351`
- CVV: `123`
- Expiry: `11/25`
- Name: Any name
- CPF: `12345678909`

**Rejected Payment (Insufficient Funds)**:
- Card: `5031 4332 1540 6351`
- CVV: `123`
- Expiry: `11/25`
- Amount: Specific test amounts per MercadoPago docs

See [MercadoPago Test Cards Documentation](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards) for more test scenarios.

## Step 5: Verify Deployment

After deployment:

1. **Check Cloudflare Dashboard**:
   - Go to: https://dash.cloudflare.com/
   - Navigate to Pages > coco-loko-acaiteria
   - Verify deployment status

2. **Test the Application**:
   - Visit: https://coco-loko-acaiteria.pages.dev
   - Test key features:
     - Customer menu access
     - Waiter dashboard with payment workflow
     - Kitchen dashboard
     - Admin panel

3. **Test Waiter Payment Workflow** (New Feature):
   - Login as waiter
   - Create an order (should go directly to preparation)
   - Verify order shows `payment_status='pending'`
   - Generate PIX QR code for the order
   - Test payment confirmation via webhook
   - Verify commission calculation updates
   - Test adding items to existing orders

4. **Test WhatsApp Integration**:
   - Go to: https://coco-loko-acaiteria.pages.dev/whatsapp-admin
   - Scan QR code to connect
   - Test notifications

## Deployment Workflow

```
┌─────────────────┐
│  Local Changes  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Git Commit    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push to GitHub │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│  - Run Tests    │
│  - Build App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloudflare Pages│
│   Deployment    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Live Site     │
└─────────────────┘
```

## Environment Variables

The application requires these environment variables:

### Frontend (VITE_*)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- `VITE_MERCADOPAGO_PUBLIC_KEY` - MercadoPago public key (for Payment Brick SDK)
- `VITE_MERCADOPAGO_ACCESS_TOKEN` - MercadoPago access token (for API calls)
- `VITE_EVOLUTION_API_URL` - WhatsApp API URL
- `VITE_EVOLUTION_API_KEY` - WhatsApp API key
- `VITE_EVOLUTION_INSTANCE_NAME` - WhatsApp instance name

### Backend (Cloudflare Functions)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `VITE_MERCADOPAGO_ACCESS_TOKEN` - MercadoPago access token (for payment processing)
- `WHATSAPP_SESSION_ID` - WhatsApp session identifier

**Important**: The `VITE_MERCADOPAGO_ACCESS_TOKEN` must be available in both frontend and backend environments for the credit card payment feature to work properly.

## WhatsApp Webhook Configuration

The application includes a two-way WhatsApp chat feature that requires webhook configuration in Evolution API.

### Webhook URL Format

Your webhook endpoint URL should be:

```
https://your-domain.pages.dev/api/whatsapp/webhook
```

Or with custom domain:

```
https://your-custom-domain.com/api/whatsapp/webhook
```

### Configuring Evolution API Webhook

1. **Access Evolution API Admin Panel**
   - Login to your Evolution API instance
   - Navigate to the instance settings (e.g., "cocooo" instance)

2. **Configure Webhook Settings**
   - Find the "Webhook" or "Events" configuration section
   - Set the webhook URL to your Cloudflare endpoint
   - Enable the following events:
     - ✅ `messages.upsert` - Required for incoming messages
   - Disable or ignore other events (they will be filtered by the webhook)

3. **Webhook Configuration Example**

   ```json
   {
     "webhook": {
       "url": "https://coco-loko-acaiteria.pages.dev/api/whatsapp/webhook",
       "enabled": true,
       "events": ["messages.upsert"]
     }
   }
   ```

4. **Environment Variables Required**

   Ensure these are set in Cloudflare Pages:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (not anon key)
   - `VITE_EVOLUTION_API_URL` - Evolution API base URL
   - `VITE_EVOLUTION_API_KEY` - Evolution API key
   - `VITE_EVOLUTION_INSTANCE_NAME` - Instance name (e.g., "cocooo")

### Testing Webhook Delivery

#### Method 1: Send Test Message from WhatsApp

1. Create an active order with a customer phone number
2. Send a WhatsApp message from that phone number
3. Check the admin dashboard - message should appear in the order chat
4. Audio notification should play when message arrives

#### Method 2: Manual Webhook Test with curl

```bash
# Replace with your actual webhook URL
WEBHOOK_URL="https://coco-loko-acaiteria.pages.dev/api/whatsapp/webhook"

# Send test payload
curl -X POST $WEBHOOK_URL \
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
        "conversation": "Test message from webhook"
      },
      "messageTimestamp": 1700000000
    }
  }'
```

Expected response: `200 OK` with message "Webhook processed successfully"

#### Method 3: Check Cloudflare Logs

```bash
# Monitor webhook activity in real-time
wrangler tail --format pretty

# Or view logs in Cloudflare Dashboard:
# Dashboard > Workers & Pages > Your Project > Logs
```

### Webhook Payload Structure

The webhook expects this payload format from Evolution API:

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
      "conversation": "Message text here"
    },
    "messageTimestamp": 1700000000
  }
}
```

**Key Fields:**
- `event`: Must be "messages.upsert"
- `data.key.remoteJid`: Customer's WhatsApp ID (phone@s.whatsapp.net)
- `data.key.fromMe`: Must be `false` (inbound messages only)
- `data.message.conversation`: Message text content
- `data.message.extendedTextMessage.text`: Alternative message text location

### How Webhook Processing Works

1. **Receives Message** - Evolution API sends webhook when customer sends message
2. **Extracts Phone** - Parses phone number from `remoteJid` (e.g., "5573999988888@s.whatsapp.net" → "5573999988888")
3. **Finds Active Orders** - Queries database for orders with matching `customer_phone` and status NOT 'completed' or 'cancelled'
4. **Selects Most Recent** - If multiple active orders exist, associates with the newest one
5. **Stores Message** - Inserts into `whatsapp_chat_messages` table with `direction='inbound'`
6. **Real-time Broadcast** - Supabase notifies connected admin clients
7. **Ignores if No Match** - Messages without active orders are not stored

### Verifying Webhook Deployment

After deploying to Cloudflare Pages, verify the webhook is accessible:

**1. Check Function Deployment**
```bash
# View deployed functions in Cloudflare Dashboard
# Navigate to: Workers & Pages > Your Project > Functions
# Verify: /api/whatsapp/webhook is listed
```

**2. Run Automated Tests**
```bash
# Test webhook endpoint
node scripts/test-whatsapp-webhook.js

# Expected: 6/6 tests passed
# If tests fail with 405 errors, function is not deployed
```

**3. Manual Verification**
```bash
# Quick test with curl
curl -X POST https://your-domain.pages.dev/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":{"key":{"remoteJid":"5573999988888@s.whatsapp.net","fromMe":false},"message":{"conversation":"test"}}}'

# Expected: 200 OK with JSON response
# If 405: Function not deployed or routing issue
```

**4. Check Cloudflare Logs**
```bash
# Monitor webhook activity
wrangler tail --format pretty

# Or view in dashboard:
# Cloudflare Dashboard > Workers & Pages > Your Project > Logs
```

### Webhook Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | Success | Message processed and stored successfully |
| 200 | Ignored | Event ignored (outbound message, no active order, etc.) |
| 400 | Bad Request | Invalid payload structure or missing required fields |
| 405 | Method Not Allowed | Non-POST request received |
| 500 | Server Error | Database error or processing failure |

### Troubleshooting Webhook Issues

#### Messages Not Appearing in Admin UI

**Symptoms:**
- Customer sends WhatsApp message
- Message doesn't appear in order chat panel
- No audio notification plays

**Solutions:**
1. Verify webhook is configured in Evolution API with correct URL
2. Check customer has an active order (not completed/cancelled)
3. Verify phone number in order matches WhatsApp sender
4. Check Cloudflare Functions logs for webhook errors
5. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
6. Verify `whatsapp_chat_messages` table exists in database

**Debug Steps:**
```bash
# Check webhook logs
wrangler tail --format pretty | grep webhook

# Test webhook manually
curl -X POST https://your-domain.pages.dev/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":{"key":{"remoteJid":"5573999988888@s.whatsapp.net","fromMe":false},"message":{"conversation":"test"}}}'

# Check database for messages
# Run in Supabase SQL Editor:
SELECT * FROM whatsapp_chat_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

#### Webhook Returns 500 Error

**Symptoms:**
- Webhook logs show 500 Internal Server Error
- Messages not being stored

**Solutions:**
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Verify database table exists: `whatsapp_chat_messages`
3. Check RLS policies allow service role inserts
4. Review Cloudflare Functions logs for detailed error
5. Verify Supabase project is accessible

#### Phone Number Not Matching

**Symptoms:**
- Webhook processes but says "No active orders found"
- Customer has active order but message not associated

**Solutions:**
1. Check phone number format in orders table
2. Verify normalization removes all non-digits
3. Ensure `customer_phone` field is populated
4. Check for country code differences
5. Review webhook logs for extracted phone number

**Debug Steps:**
```sql
-- Check order phone format
SELECT id, customer_phone, status, created_at
FROM orders
WHERE customer_phone LIKE '%999988888%'
ORDER BY created_at DESC;

-- Verify active orders
SELECT id, customer_phone, status
FROM orders
WHERE status NOT IN ('completed', 'cancelled')
  AND customer_phone IS NOT NULL
ORDER BY created_at DESC;
```

#### Multiple Orders for Same Phone

**Behavior:**
- Webhook associates message with most recently created active order
- This is expected behavior

**To verify:**
```sql
-- Check multiple orders for same phone
SELECT id, customer_phone, status, created_at
FROM orders
WHERE customer_phone = '5573999988888'
  AND status NOT IN ('completed', 'cancelled')
ORDER BY created_at DESC;
```

### Security Considerations

- Webhook validates payload structure before processing
- Uses service role key for database access (not exposed to client)
- RLS policies enforce data access rules
- Consider adding webhook signature verification for production
- Rate limiting handled by Cloudflare automatically

### Monitoring Webhook Activity

**Key Log Messages to Monitor:**

```
✅ "Received webhook: messages.upsert" - Webhook received
✅ "Extracted phone number: 5573999988888" - Phone parsed
✅ "Found X orders for phone" - Orders found
✅ "Found X active orders" - Active orders filtered
✅ "Associating message with order: xxx" - Order selected
✅ "Message stored successfully: xxx" - Message saved
ℹ️  "No active orders found, ignoring message" - Expected when no active orders
ℹ️  "Ignoring outbound message" - Expected for staff messages
```

**Error Messages to Watch:**

```
❌ "Invalid payload structure" - Check Evolution API configuration
❌ "Database error" - Check Supabase connection and credentials
❌ "Failed to store message" - Check RLS policies and table schema
```

For detailed webhook setup instructions, see: `functions/api/whatsapp/WEBHOOK_SETUP.md`

## Supabase Edge Functions

The application uses several Supabase Edge Functions for backend operations:

### Waiter Management Functions

1. **create-waiter** - Creates new waiter accounts
   - Requires admin authentication
   - Creates auth user and profile entry
   - Sets role to 'waiter'

2. **list-waiters** - Lists all waiter accounts
   - Requires admin authentication
   - Returns waiter details from profiles table

3. **delete-waiter** - Deletes waiter accounts
   - Requires admin authentication
   - Removes auth user and profile entry
   - Cascades to related data

4. **update-waiter** - Updates waiter information
   - Requires admin authentication
   - Updates email, name, and optionally password
   - Syncs auth user and profile data

### Deploying Edge Functions

```bash
# Deploy all functions
supabase functions deploy create-waiter
supabase functions deploy list-waiters
supabase functions deploy delete-waiter
supabase functions deploy update-waiter
supabase functions deploy mercadopago-webhook

# Or deploy all at once
supabase functions deploy
```

## Database Schema Changes

### Waiter Payment Workflow (v20251114000004)

The waiter payment workflow introduces independent payment status tracking:

**New Fields in `orders` table:**
- `payment_status` - Tracks payment state independently from order status
  - Values: `'pending'`, `'confirmed'`, `'failed'`, `'refunded'`
  - Default: `'pending'`
- `payment_confirmed_at` - Timestamp when payment was confirmed
- `pix_generated_at` - Timestamp when PIX QR code was generated
- `pix_qr_code` - Stores PIX QR code data
- `pix_expires_at` - PIX expiration timestamp

**Indexes for Performance:**
- `idx_orders_payment_status` - Fast payment status queries
- `idx_orders_waiter_payment` - Waiter-specific payment queries
- `idx_orders_status_payment` - Combined status filtering

**Migration Path:**
```sql
-- Existing completed orders are marked as payment confirmed
UPDATE orders 
SET payment_status = 'confirmed',
    payment_confirmed_at = updated_at
WHERE status = 'completed';
```

### Commission Calculation Changes

Commission calculations now filter by `payment_status`:
- **Confirmed Commission**: Only counts orders with `payment_status='confirmed'`
- **Pending Commission**: Shows estimated commission for `payment_status='pending'`
- Real-time updates when payment status changes

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Fails

1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Ensure Cloudflare API token has correct permissions
4. Check Cloudflare Pages dashboard for errors

### Environment Variables Not Working

1. Verify secrets in GitHub repository settings
2. Check `wrangler.toml` for correct variable names
3. Ensure variables are prefixed with `VITE_` for frontend

### WhatsApp Not Connecting

1. Check Evolution API is running
2. Verify API credentials in environment variables
3. Test API connection manually
4. Check Cloudflare Functions logs

### Payment Issues

#### PIX Generation Fails

**Symptoms:**
- "Gerar PIX" button doesn't work
- QR code doesn't display
- Error message appears

**Solutions:**
1. Check MercadoPago credentials in environment variables
2. Verify order has `payment_status='pending'`
3. Check Cloudflare Functions logs for API errors
4. Ensure order belongs to the waiter
5. Verify MercadoPago API is accessible

**Debug Steps:**
```bash
# Check function logs in Cloudflare dashboard
# Verify environment variables
echo $VITE_MERCADOPAGO_ACCESS_TOKEN

# Test MercadoPago API manually
curl -X POST https://api.mercadopago.com/v1/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### Payment Status Not Updating

**Symptoms:**
- Payment completed but status still shows "Aguardando Pagamento"
- Commission not calculated after payment
- Order stuck in pending payment

**Solutions:**
1. Check MercadoPago webhook is configured correctly
2. Verify webhook endpoint is accessible: `/api/mercadopago/webhook`
3. Check webhook signature validation
4. Review Cloudflare Functions logs for webhook errors
5. Verify database connection in webhook handler

**Debug Steps:**
```sql
-- Check payment status in database
SELECT id, payment_status, payment_confirmed_at, pix_generated_at
FROM orders
WHERE id = 'ORDER_ID';

-- Check recent webhook activity
SELECT * FROM payment_webhooks
ORDER BY created_at DESC
LIMIT 10;
```

#### Commission Calculation Issues

**Symptoms:**
- Commission shows incorrect amount
- Pending vs confirmed commission mismatch
- Commission not updating after payment

**Solutions:**
1. Verify `payment_status` field is set correctly
2. Check commission calculation logic in `commissionUtils.ts`
3. Ensure real-time subscriptions include `payment_status`
4. Verify date filters are applied correctly
5. Check for duplicate orders in calculation

**Debug Steps:**
```sql
-- Verify commission data
SELECT 
  waiter_id,
  payment_status,
  commission_amount,
  total_amount,
  created_at
FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- Check commission totals
SELECT 
  payment_status,
  COUNT(*) as order_count,
  SUM(commission_amount) as total_commission
FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND created_at >= CURRENT_DATE
GROUP BY payment_status;
```

#### Add Items Not Working

**Symptoms:**
- "Adicionar Item" button disabled
- Items not added to order
- Total not recalculating

**Solutions:**
1. Verify order status is `'in_preparation'`
2. Check waiter owns the order
3. Ensure payment_status is `'pending'`
4. Verify menu items are available
5. Check Cloudflare Functions logs

**Debug Steps:**
```sql
-- Check order state
SELECT 
  id, 
  status, 
  payment_status, 
  waiter_id,
  total_amount
FROM orders
WHERE id = 'ORDER_ID';

-- Verify order items
SELECT * FROM order_items
WHERE order_id = 'ORDER_ID'
ORDER BY created_at;
```

#### Real-time Updates Not Working

**Symptoms:**
- Payment status doesn't update automatically
- New orders don't appear in dashboard
- PIX generation doesn't reflect in UI

**Solutions:**
1. Check Supabase real-time subscriptions are active
2. Verify `useRealtimeOrders` hook includes `payment_status`
3. Check browser console for WebSocket errors
4. Ensure Supabase project has real-time enabled
5. Verify RLS policies allow real-time access

**Debug Steps:**
```javascript
// Check real-time connection in browser console
// Look for WebSocket connection status
// Verify subscription channels are active

// Test manual refresh
window.location.reload();
```

## Custom Domain Setup

To use a custom domain:

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to "Custom domains"
4. Add your domain
5. Update DNS records as instructed

## Rollback

To rollback to a previous deployment:

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to "Deployments"
4. Find the previous working deployment
5. Click "Rollback to this deployment"

## Monitoring

### Cloudflare Analytics
- Go to: Cloudflare Dashboard > Pages > Analytics
- Monitor traffic, errors, and performance

### Application Logs
- Check Cloudflare Functions logs for backend errors
- Use browser console for frontend errors

## Support

For issues:
1. Check GitHub Actions logs
2. Review Cloudflare Pages deployment logs
3. Test locally with `npm run dev`
4. Check Supabase logs for database issues

## Quick Commands Reference

```bash
# Development
npm run dev                 # Start dev server

# Testing
npm run test               # Run tests in watch mode
npm run test:run           # Run tests once

# Building
npm run build              # Production build
npm run build:dev          # Development build

# Deployment
git push origin main       # Trigger auto-deployment
npm run deploy:full        # Manual deployment script
wrangler pages deploy dist # Direct Wrangler deployment

# Maintenance
npm install                # Install dependencies
npm run lint               # Check code quality
```
