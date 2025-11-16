# Environment Variables Reference

Quick reference for all environment variables required for the credit card payment feature.

## Required Variables

### Frontend (Client-Side)

| Variable | Purpose | Example | Where Used |
|----------|---------|---------|------------|
| `VITE_MERCADOPAGO_PUBLIC_KEY` | Payment Brick SDK initialization | `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | `payment-brick.ts` |
| `VITE_MERCADOPAGO_ACCESS_TOKEN` | MercadoPago API calls | `APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-...` | `client.ts` |

### Backend (Cloudflare Functions)

| Variable | Purpose | Example | Where Used |
|----------|---------|---------|------------|
| `VITE_MERCADOPAGO_ACCESS_TOKEN` | Payment processing | `APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-...` | `create-card-payment.ts` |
| `VITE_SUPABASE_URL` | Database connection | `https://xxx.supabase.co` | `create-card-payment.ts` |
| `SUPABASE_SERVICE_KEY` | Database updates | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | `create-card-payment.ts` |

## Configuration Files

### Local Development (`.env`)

```env
# MercadoPago Configuration (PIX and Credit Card Payments)
VITE_MERCADOPAGO_PUBLIC_KEY="APP_USR-ef0ab051-6520-4ea1-a3e3-5e53825685fe"
VITE_MERCADOPAGO_ACCESS_TOKEN="APP_USR-4813437808298526-110522-fa108581dfa5cb10a87458875e5c8136-1769074499"
```

### Cloudflare Pages (`wrangler.toml`)

```toml
[vars]
# MercadoPago Configuration (PIX and Credit Card Payments)
VITE_MERCADOPAGO_PUBLIC_KEY = "APP_USR-ef0ab051-6520-4ea1-a3e3-5e53825685fe"
VITE_MERCADOPAGO_ACCESS_TOKEN = "APP_USR-4813437808298526-110522-fa108581dfa5cb10a87458875e5c8136-1769074499"

# Server-side (for Cloudflare Functions)
MERCADOPAGO_ACCESS_TOKEN = "APP_USR-4813437808298526-110522-fa108581dfa5cb10a87458875e5c8136-1769074499"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### GitHub Secrets (CI/CD)

Add these secrets in GitHub repository settings:

- `VITE_MERCADOPAGO_PUBLIC_KEY`
- `VITE_MERCADOPAGO_ACCESS_TOKEN`

### Cloudflare Pages Environment Variables

Configure in Cloudflare Dashboard > Pages > Settings > Environment variables:

**Production Environment:**
- `VITE_MERCADOPAGO_PUBLIC_KEY`
- `VITE_MERCADOPAGO_ACCESS_TOKEN`
- `SUPABASE_SERVICE_KEY`

**Preview Environment:**
- Same as production (or use test credentials)

## Getting Credentials

### MercadoPago Credentials

1. Login to: https://www.mercadopago.com.br/developers/panel/app
2. Create or select application
3. Navigate to credentials tab:
   - **Test Credentials** (for development): Use `TEST-` prefixed keys
   - **Production Credentials** (for production): Use `APP_USR-` prefixed keys

### Supabase Credentials

1. Login to: https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy:
   - **Project URL**: `VITE_SUPABASE_URL`
   - **Service Role Key**: `SUPABASE_SERVICE_KEY` (keep secret!)

## Validation Checklist

Use this checklist to verify your configuration:

- [ ] `.env` file has `VITE_MERCADOPAGO_PUBLIC_KEY`
- [ ] `.env` file has `VITE_MERCADOPAGO_ACCESS_TOKEN`
- [ ] `wrangler.toml` has MercadoPago variables in `[vars]` section
- [ ] GitHub secrets are configured (if using CI/CD)
- [ ] Cloudflare Pages environment variables are set
- [ ] Cloudflare Pages has been redeployed after adding variables
- [ ] Test credentials work in development
- [ ] Production credentials work in production

## Testing Configuration

### Test Locally

```bash
# Verify environment variables are loaded
npm run dev

# Check browser console for:
# - No "undefined" errors for MercadoPago keys
# - Payment Brick loads successfully
# - Card tokenization works
```

### Test in Production

```bash
# Check Cloudflare Functions logs
# Navigate to: Cloudflare Dashboard > Pages > Functions > Logs

# Look for:
# - No "Configuration not available" errors
# - Successful payment processing logs
# - Successful database update logs
```

## Troubleshooting

### "Configuration not available" Error

**Cause**: `VITE_MERCADOPAGO_ACCESS_TOKEN` not set in Cloudflare

**Solution**:
1. Add variable in Cloudflare Pages settings
2. Redeploy the application
3. Clear browser cache

### "MercadoPago is not defined" Error

**Cause**: `VITE_MERCADOPAGO_PUBLIC_KEY` not set or SDK not loaded

**Solution**:
1. Verify variable in `.env` file
2. Check MercadoPago SDK script in `index.html`
3. Restart development server

### Payment Processing Fails

**Cause**: Invalid credentials or missing `SUPABASE_SERVICE_KEY`

**Solution**:
1. Verify credentials are correct in MercadoPago dashboard
2. Check `SUPABASE_SERVICE_KEY` is set in Cloudflare
3. Review Cloudflare Functions logs for specific errors

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit credentials to Git**
   - Keep `.env` in `.gitignore`
   - Use `.env.example` for templates only

2. **Treat Access Token as Secret**
   - Even though prefixed with `VITE_`, the access token should be protected
   - Don't expose in client-side code directly
   - Only use in server-side functions

3. **Use Test Credentials in Development**
   - Always use `TEST-` prefixed keys locally
   - Only use `APP_USR-` keys in production

4. **Rotate Keys Regularly**
   - Change credentials periodically
   - Update in all environments when rotating

## Additional Resources

- [MercadoPago Credentials Guide](https://www.mercadopago.com.br/developers/pt/docs/credentials)
- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

Last Updated: November 2025
