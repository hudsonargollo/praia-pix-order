# MercadoPago Credentials Issue

## Problem

The payment is being rejected with the error: **"Pagamento recusado por segurança"** (Payment rejected for security reasons).

This is happening because MercadoPago has **two separate environments**:

1. **Test Environment** - For development and testing
2. **Production Environment** - For real payments

## Root Cause

You're likely using **production credentials** (`VITE_MERCADOPAGO_ACCESS_TOKEN`) instead of **test credentials**.

When you use production credentials with test card numbers, MercadoPago's fraud prevention system rejects the payment for security reasons.

## Solution

You need to use **TEST credentials** from your MercadoPago account.

### Step 1: Get Test Credentials

1. Go to https://www.mercadopago.com.br/developers/panel
2. Click on your application
3. Go to "Credenciais de teste" (Test Credentials)
4. Copy both:
   - **Public Key (TEST)** - starts with `TEST-`
   - **Access Token (TEST)** - starts with `TEST-`

### Step 2: Update Environment Variables

In Cloudflare Pages, update these variables:

```
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx
```

**Important**: Both must start with `TEST-` for test mode!

### Step 3: Redeploy

After updating the environment variables in Cloudflare Pages:
1. Go to Settings > Environment Variables
2. Update both variables
3. Redeploy the application

## How to Verify

### Check if Using Test Credentials

The credentials should look like this:

**Test Public Key**:
```
TEST-12345678-1234-1234-1234-123456789012
```

**Test Access Token**:
```
TEST-1234567890123456-123456-1234567890abcdef1234567890abcdef-12345678
```

**Production credentials** do NOT have the `TEST-` prefix.

### Test Cards Only Work with Test Credentials

These test cards ONLY work with TEST credentials:

**Approved**:
- 5031 4332 1540 6351

**Rejected (insufficient funds)**:
- 5031 7557 3453 0604

If you use these cards with production credentials, they will be rejected for security reasons.

## Current Status

Based on the error "Pagamento recusado por segurança", you are currently using:
- ❌ Production credentials with test cards

You need to switch to:
- ✅ Test credentials with test cards

## After Fixing

Once you update to test credentials:

1. Visit: https://9ce48bf4.coco-loko-acaiteria.pages.dev/card-payment-test
2. Use test card: 5031 4332 1540 6351
3. CVV: 123, Expiry: 11/25
4. Payment should be approved

## Moving to Production

When you're ready for real payments:

1. Get **production credentials** from MercadoPago
2. Update environment variables (remove `TEST-` prefix)
3. Use real credit cards (test cards won't work)
4. Payments will be real and money will be charged

## Additional Resources

- **MercadoPago Test Cards**: https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/additional-content/test-cards
- **Credentials Guide**: https://www.mercadopago.com.br/developers/en/docs/credentials
- **Test vs Production**: https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/additional-content/test-mode

## Summary

**The payment is working correctly!** The rejection is expected behavior when using production credentials with test cards. Simply switch to test credentials and it will work.
