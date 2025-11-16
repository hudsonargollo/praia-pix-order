# Credit Card Payment Setup Guide

This guide walks you through setting up the credit card payment feature using MercadoPago's Payment Brick integration.

## Prerequisites

- MercadoPago account (Brazil)
- Access to MercadoPago Developer Dashboard
- Cloudflare Pages deployment (or local development environment)
- Supabase project with service role key

## Environment Variables Required

### Frontend Variables

These variables are used by the React application and must be prefixed with `VITE_`:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_MERCADOPAGO_PUBLIC_KEY` | Public key for Payment Brick SDK | MercadoPago Developer Dashboard |
| `VITE_MERCADOPAGO_ACCESS_TOKEN` | Access token for API calls | MercadoPago Developer Dashboard |

### Backend Variables (Cloudflare Functions)

These variables are used by the Cloudflare Functions API endpoints:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_MERCADOPAGO_ACCESS_TOKEN` | Access token for payment processing | MercadoPago Developer Dashboard |
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `SUPABASE_SERVICE_KEY` | Service role key for database updates | Supabase Dashboard |

**Note**: The `VITE_MERCADOPAGO_ACCESS_TOKEN` is used in both frontend and backend. While it's prefixed with `VITE_`, it should still be treated as a secret and not exposed in client-side code directly.

## Step-by-Step Setup

### 1. Get MercadoPago Credentials

1. **Login to MercadoPago Developer Dashboard**
   - Go to: https://www.mercadopago.com.br/developers/panel/app
   - Login with your MercadoPago account

2. **Create or Select Application**
   - Click "Criar aplicação" (Create application) or select existing one
   - Give it a name: "Coco Loko Açaiteria"
   - Select "Pagamentos online" (Online payments)

3. **Get Test Credentials** (for development)
   - Navigate to "Credenciais de teste" tab
   - Copy the **Public Key** (starts with `TEST-`)
   - Copy the **Access Token** (starts with `TEST-`)

4. **Get Production Credentials** (for production)
   - Navigate to "Credenciais de produção" tab
   - Copy the **Public Key** (starts with `APP_USR-`)
   - Copy the **Access Token** (starts with `APP_USR-`)

### 2. Configure Local Development

1. **Update `.env` file**

```bash
# Add to your .env file
VITE_MERCADOPAGO_PUBLIC_KEY="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
VITE_MERCADOPAGO_ACCESS_TOKEN="TEST-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx"
```

2. **Verify Configuration**

```bash
# Start development server
npm run dev

# Navigate to payment page
# Select "Cartão de Crédito" payment method
# Verify Payment Brick loads correctly
```

### 3. Configure GitHub Secrets (for CI/CD)

1. **Go to GitHub Repository Settings**
   - Navigate to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

2. **Add Secrets**
   - Click "New repository secret"
   - Add each secret:
     - Name: `VITE_MERCADOPAGO_PUBLIC_KEY`
     - Value: Your MercadoPago public key
   - Repeat for `VITE_MERCADOPAGO_ACCESS_TOKEN`

### 4. Configure Cloudflare Pages

1. **Go to Cloudflare Pages Dashboard**
   - Navigate to: https://dash.cloudflare.com/
   - Select "Pages" > Your project

2. **Add Environment Variables**
   - Go to "Settings" > "Environment variables"
   - Click "Add variable"
   - Add for **both Production and Preview**:

```
Variable name: VITE_MERCADOPAGO_PUBLIC_KEY
Value: APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Environment: Production and Preview

Variable name: VITE_MERCADOPAGO_ACCESS_TOKEN
Value: APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx
Environment: Production and Preview

Variable name: SUPABASE_SERVICE_KEY
Value: your_supabase_service_role_key
Environment: Production and Preview
```

3. **Redeploy**
   - Go to "Deployments" tab
   - Click "Retry deployment" on latest deployment
   - Or push a new commit to trigger deployment

### 5. Configure Supabase Edge Functions (if using)

If you're using Supabase Edge Functions instead of Cloudflare Functions:

1. **Set Secrets**

```bash
# Set MercadoPago access token
supabase secrets set MERCADOPAGO_ACCESS_TOKEN="APP_USR-your-access-token"

# Verify secrets
supabase secrets list
```

2. **Deploy Edge Function**

```bash
# Deploy the card payment function
supabase functions deploy mercadopago-card-payment
```

## Testing the Integration

### Test in Development

1. **Start Development Server**
```bash
npm run dev
```

2. **Navigate to Payment Page**
   - Go to: http://localhost:8080/payment?orderId=YOUR_ORDER_ID
   - Select "Cartão de Crédito"
   - Verify Payment Brick loads

3. **Test with Test Card**
   - Card Number: `5031 4332 1540 6351`
   - CVV: `123`
   - Expiry: `11/25`
   - Name: `Test User`
   - CPF: `12345678909`
   - Click "Pagar com Cartão"
   - Verify payment processes successfully

### Test in Production

1. **Use Production Credentials**
   - Ensure production credentials are configured in Cloudflare
   - Deploy to production

2. **Test with Real Card** (small amount)
   - Use a real credit card
   - Test with a small amount (e.g., R$ 1.00)
   - Verify payment processes
   - Verify order status updates
   - Verify webhook receives notification

## Troubleshooting

### Payment Brick Doesn't Load

**Symptoms:**
- Empty payment form area
- Console error: "MercadoPago is not defined"

**Solutions:**
1. Verify `VITE_MERCADOPAGO_PUBLIC_KEY` is set correctly
2. Check browser console for errors
3. Verify MercadoPago SDK script is loaded in `index.html`
4. Clear browser cache and reload

### Payment Processing Fails

**Symptoms:**
- Error message: "Erro ao processar pagamento"
- Payment status doesn't update

**Solutions:**
1. Verify `VITE_MERCADOPAGO_ACCESS_TOKEN` is set in Cloudflare
2. Check Cloudflare Functions logs for errors
3. Verify `SUPABASE_SERVICE_KEY` is set correctly
4. Test MercadoPago API credentials manually

### Order Status Doesn't Update

**Symptoms:**
- Payment succeeds but order stays "pending_payment"
- No webhook notification received

**Solutions:**
1. Verify webhook URL is configured in MercadoPago
2. Check webhook endpoint is accessible: `/api/mercadopago/webhook`
3. Verify webhook signature validation
4. Check Cloudflare Functions logs for webhook errors
5. Manually update order status in database as workaround

### Environment Variables Not Working

**Symptoms:**
- Variables are undefined in code
- "Configuration not available" errors

**Solutions:**
1. Verify variables are set in Cloudflare Pages settings
2. Ensure variables are set for correct environment (Production/Preview)
3. Redeploy after adding variables
4. Check variable names match exactly (case-sensitive)
5. Verify `VITE_` prefix for frontend variables

## Security Best Practices

1. **Never Commit Credentials**
   - Keep `.env` in `.gitignore`
   - Use `.env.example` for templates
   - Never commit actual keys to Git

2. **Use Test Credentials in Development**
   - Always use test credentials locally
   - Only use production credentials in production

3. **Rotate Keys Regularly**
   - Rotate MercadoPago access tokens periodically
   - Update in all environments when rotating

4. **Monitor for Suspicious Activity**
   - Check MercadoPago dashboard for unusual transactions
   - Set up alerts for failed payments
   - Monitor Cloudflare logs for errors

## Additional Resources

- [MercadoPago Developer Documentation](https://www.mercadopago.com.br/developers/pt/docs)
- [Payment Brick Documentation](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/introduction)
- [Test Cards](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)
- [Webhook Configuration](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/notifications/webhooks)

## Support

For issues with:
- **MercadoPago Integration**: Check MercadoPago Developer Forum
- **Cloudflare Deployment**: Check Cloudflare Pages documentation
- **Application Issues**: Check project documentation and logs

---

Last Updated: November 2025
