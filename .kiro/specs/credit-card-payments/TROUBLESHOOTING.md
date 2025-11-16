# Credit Card Payments - Troubleshooting Guide

This guide helps diagnose and resolve common issues with the MercadoPago credit card payment integration.

## Table of Contents

- [Payment Brick Issues](#payment-brick-issues)
- [Tokenization Errors](#tokenization-errors)
- [Payment Processing Errors](#payment-processing-errors)
- [Backend API Errors](#backend-api-errors)
- [Environment Configuration](#environment-configuration)
- [Testing and Debugging](#testing-and-debugging)

---

## Payment Brick Issues

### Payment Brick Not Loading

**Symptoms:**
- Blank space where payment form should appear
- Loading spinner never disappears
- Console error: "Failed to load MercadoPago SDK"

**Possible Causes:**
1. MercadoPago SDK script failed to load
2. Invalid public key
3. Network connectivity issues
4. Ad blocker or browser extension blocking script

**Solutions:**

1. **Check SDK Script Loading:**
   ```javascript
   // Open browser console and check for:
   console.log(window.MercadoPago); // Should not be undefined
   ```

2. **Verify Public Key:**
   ```bash
   # Check .env file
   cat .env | grep VITE_MERCADOPAGO_PUBLIC_KEY
   
   # Should start with: APP_USR-
   ```

3. **Check Network Tab:**
   - Open browser DevTools → Network tab
   - Look for request to `sdk.mercadopago.com/js/v2`
   - Status should be 200 OK

4. **Disable Ad Blockers:**
   - Temporarily disable ad blockers or privacy extensions
   - Whitelist `mercadopago.com` domain

5. **Check CORS:**
   - Ensure your domain is allowed in MercadoPago dashboard
   - For localhost, CORS should work by default

**Prevention:**
- Add error boundary around CreditCardPayment component
- Implement fallback to PIX if Payment Brick fails to load
- Monitor SDK load failures in production

---

### Payment Brick Renders But Form Fields Are Disabled

**Symptoms:**
- Payment Brick appears but fields are grayed out
- Cannot type in card number or other fields
- No error messages displayed

**Possible Causes:**
1. Invalid amount (zero or negative)
2. MercadoPago account not activated
3. Public key from test environment used in production

**Solutions:**

1. **Verify Amount:**
   ```typescript
   // Check that amount is valid
   console.log('Payment amount:', amount); // Should be > 0
   ```

2. **Check MercadoPago Account Status:**
   - Log into MercadoPago dashboard
   - Verify account is activated and approved
   - Check if payment methods are enabled

3. **Verify Environment Keys:**
   ```bash
   # Test keys start with: TEST-
   # Production keys start with: APP_USR-
   
   # Make sure you're using the right key for your environment
   ```

---

## Tokenization Errors

### "Número de cartão inválido" (Invalid Card Number)

**Symptoms:**
- Error appears when clicking "Pagar com Cartão"
- Payment Brick shows validation error

**Possible Causes:**
1. Invalid card number entered
2. Card type not supported
3. Test card used in production

**Solutions:**

1. **Verify Card Number:**
   - Check for typos
   - Ensure card number is 13-19 digits
   - Verify card type is supported (Visa, Mastercard, etc.)

2. **Use Correct Test Cards:**
   ```
   For Testing (Sandbox):
   - Approved: 5031 4332 1540 6351
   - Rejected: 5031 4332 1540 6351 (with specific amounts)
   
   For Production:
   - Use real, valid credit cards only
   ```

3. **Check Card Type Support:**
   - Verify card brand is enabled in MercadoPago dashboard
   - Some cards may not be supported in certain regions

---

### "Token inválido ou expirado" (Invalid or Expired Token)

**Symptoms:**
- Payment fails with token error
- Error occurs after form submission

**Possible Causes:**
1. Token expired (tokens are short-lived)
2. Token already used (single-use only)
3. Network delay between tokenization and submission

**Solutions:**

1. **Retry Payment:**
   - Click "Tentar Novamente" button
   - This generates a fresh token

2. **Check Token Expiration:**
   ```typescript
   // Tokens expire quickly (usually 5-10 minutes)
   // Don't store tokens - generate fresh for each payment
   ```

3. **Reduce Network Latency:**
   - Check internet connection
   - Verify backend API is responding quickly
   - Consider implementing timeout warnings

---

## Payment Processing Errors

### "Fundos insuficientes" (Insufficient Funds)

**Symptoms:**
- Payment rejected with insufficient funds message
- Customer claims card has balance

**Possible Causes:**
1. Card actually has insufficient funds
2. Card limit reached
3. International transaction blocked
4. Card issuer declined transaction

**Solutions:**

1. **Verify with Customer:**
   - Ask customer to check card balance
   - Verify card is not blocked
   - Try different card

2. **Check Transaction Amount:**
   - Ensure amount is correct
   - Verify currency (BRL)

3. **Contact Card Issuer:**
   - Customer should contact their bank
   - May need to authorize international transactions
   - May need to increase card limit

---

### "Pagamento recusado pelo banco" (Payment Rejected by Bank)

**Symptoms:**
- Generic rejection message
- No specific reason provided

**Possible Causes:**
1. Fraud detection triggered
2. Card blocked by issuer
3. Incorrect card details
4. Card expired

**Solutions:**

1. **Verify Card Details:**
   - Check expiration date
   - Verify CVV is correct
   - Ensure cardholder name matches

2. **Try Different Card:**
   - Use alternative payment method
   - Try PIX as fallback

3. **Contact Bank:**
   - Customer should call card issuer
   - Verify card is active and not blocked
   - Authorize the transaction

---

### "Pagamento em análise" (Payment Under Review)

**Symptoms:**
- Payment status shows "in_process"
- Order not immediately confirmed
- Customer waiting for approval

**Possible Causes:**
1. Fraud prevention review
2. High-value transaction
3. First-time customer
4. Unusual transaction pattern

**Solutions:**

1. **Wait for Approval:**
   - Review typically takes 5-30 minutes
   - Customer will receive WhatsApp notification when approved
   - Check payment status in MercadoPago dashboard

2. **Monitor Webhook:**
   ```bash
   # Check webhook logs
   # Payment status will update automatically when approved
   ```

3. **Manual Review:**
   - If payment stuck for >1 hour, contact MercadoPago support
   - Provide payment ID for investigation

---

## Backend API Errors

### "Erro ao processar pagamento" (Payment Processing Error)

**Symptoms:**
- Generic error message
- Payment fails after tokenization
- Backend returns 500 error

**Possible Causes:**
1. Invalid access token
2. MercadoPago API down
3. Network timeout
4. Database connection error

**Solutions:**

1. **Check Access Token:**
   ```bash
   # Verify access token in environment
   # For Cloudflare Pages Functions:
   wrangler pages secret list
   
   # Should show: VITE_MERCADOPAGO_ACCESS_TOKEN
   ```

2. **Check API Status:**
   - Visit MercadoPago status page
   - Check for service outages
   - Verify API endpoint is accessible

3. **Review Backend Logs:**
   ```bash
   # Check Cloudflare Pages logs
   wrangler pages deployment tail
   
   # Look for error details
   ```

4. **Test Backend Directly:**
   ```bash
   # Test edge function
   curl -X POST https://your-domain.com/api/mercadopago/create-card-payment \
     -H "Content-Type: application/json" \
     -d '{"orderId":"test","token":"test_token","amount":10,"paymentMethodId":"visa","payer":{"email":"test@test.com","identification":{"type":"CPF","number":"12345678900"}}}'
   ```

---

### Database Update Failures

**Symptoms:**
- Payment approved but order status not updated
- Payment confirmed but order still shows "pending_payment"

**Possible Causes:**
1. Supabase connection error
2. RLS policy blocking update
3. Invalid order ID
4. Service role key missing

**Solutions:**

1. **Verify Service Role Key:**
   ```bash
   # Check Supabase service role key
   # Should be set in Cloudflare environment
   ```

2. **Check RLS Policies:**
   ```sql
   -- Verify service role can update orders
   SELECT * FROM orders WHERE id = 'order-id';
   
   -- Update manually if needed
   UPDATE orders 
   SET status = 'paid', 
       payment_confirmed_at = NOW(),
       mercadopago_payment_id = 'payment-id'
   WHERE id = 'order-id';
   ```

3. **Rely on Webhook:**
   - Webhook will update order status as fallback
   - Check webhook logs for processing

---

## Environment Configuration

### Missing Environment Variables

**Symptoms:**
- "Configuração de pagamento não disponível" error
- Payment Brick not initializing
- Backend API errors

**Required Environment Variables:**

**Frontend (.env):**
```bash
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Backend (Cloudflare Pages Secrets):**
```bash
VITE_MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**How to Set:**

1. **Frontend:**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit and add keys
   nano .env
   ```

2. **Backend (Cloudflare):**
   ```bash
   # Set secrets
   wrangler pages secret put VITE_MERCADOPAGO_ACCESS_TOKEN
   wrangler pages secret put SUPABASE_SERVICE_KEY
   ```

---

### Test vs Production Keys

**Symptoms:**
- Test cards work but real cards don't
- Real cards work in test but not production

**Solution:**

1. **Verify Key Type:**
   ```bash
   # Test keys start with: TEST-
   # Production keys start with: APP_USR-
   ```

2. **Use Correct Keys:**
   - Development: Use TEST keys
   - Production: Use APP_USR keys
   - Never mix test and production keys

3. **Get Production Keys:**
   - Log into MercadoPago dashboard
   - Navigate to Credentials section
   - Copy production keys (not test keys)

---

## Testing and Debugging

### Test Cards for Sandbox

Use these cards in test/sandbox environment:

**Approved Payment:**
```
Card: 5031 4332 1540 6351
CVV: 123
Expiry: 11/25
Name: APRO (or any name)
CPF: Any valid CPF
```

**Rejected - Insufficient Funds:**
```
Card: 5031 4332 1540 6351
CVV: 123
Expiry: 11/25
Name: FUND (or any name)
Amount: Use specific test amounts per MercadoPago docs
```

**Rejected - Other Reasons:**
```
Card: 5031 4332 1540 6351
CVV: 123
Expiry: 11/25
Name: OTHE (or any name)
```

---

### Debug Mode

Enable detailed logging:

```typescript
// In CreditCardPayment.tsx
// Temporarily uncomment console.log statements for debugging

// Check Payment Brick state
console.log('Brick ready:', isBrickReady);
console.log('Form data:', formDataRef.current);

// Check payment request
console.log('Payment request:', paymentRequest);

// Check payment response
console.log('Payment response:', response);
```

---

### Browser Console Checks

**Check SDK:**
```javascript
// Should return MercadoPago object
window.MercadoPago
```

**Check Public Key:**
```javascript
// Should return your public key
import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY
```

**Check Payment Brick:**
```javascript
// Should return brick instance
paymentBrickService.getBrickController()
```

---

### Network Debugging

**Check API Calls:**
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for:
   - `sdk.mercadopago.com` (SDK load)
   - `/api/mercadopago/create-card-payment` (Payment API)
   - `api.mercadopago.com/v1/payments` (MercadoPago API)

**Check Response:**
- Status should be 200 for success
- Check response body for error details
- Verify request payload is correct

---

## Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Erro ao carregar formulário de pagamento" | SDK failed to load | Check network, public key, and CORS |
| "Número de cartão inválido" | Invalid card number | Verify card number, use test cards in sandbox |
| "Data de validade inválida" | Invalid expiry date | Check expiry format (MM/YY) |
| "Código de segurança inválido" | Invalid CVV | Verify CVV is 3-4 digits |
| "Fundos insuficientes" | Insufficient funds | Try different card or payment method |
| "Cartão desabilitado" | Card blocked | Contact card issuer |
| "Entre em contato com seu banco" | Bank authorization needed | Customer should call bank |
| "Pagamento recusado por segurança" | Fraud detection | Try different card or contact bank |
| "Token inválido ou expirado" | Token expired or used | Retry payment to generate new token |
| "Erro de conexão" | Network error | Check internet connection, retry |

---

## Getting Help

### MercadoPago Support

- **Documentation:** https://www.mercadopago.com.br/developers
- **Support:** https://www.mercadopago.com.br/developers/panel/support
- **Status Page:** https://status.mercadopago.com/

### Internal Support

1. **Check Logs:**
   - Browser console for frontend errors
   - Cloudflare Pages logs for backend errors
   - Supabase logs for database errors

2. **Review Documentation:**
   - [Design Document](.kiro/specs/credit-card-payments/design.md)
   - [Requirements](.kiro/specs/credit-card-payments/requirements.md)
   - [Setup Guide](.kiro/specs/credit-card-payments/SETUP.md)

3. **Test Environment:**
   - Use sandbox/test environment first
   - Verify with test cards before production
   - Check all error scenarios

---

## Prevention Best Practices

1. **Always Use HTTPS:**
   - Payment Brick requires secure connection
   - Test with HTTPS even in development

2. **Validate Input:**
   - Validate amount before creating brick
   - Check required fields before submission

3. **Handle Errors Gracefully:**
   - Show user-friendly error messages
   - Provide retry options
   - Offer fallback to PIX

4. **Monitor Production:**
   - Set up error tracking (Sentry, etc.)
   - Monitor payment success rates
   - Track common error patterns

5. **Keep Keys Secure:**
   - Never commit keys to git
   - Use environment variables
   - Rotate keys periodically

6. **Test Regularly:**
   - Test with various card types
   - Test error scenarios
   - Verify mobile responsiveness

---

## Quick Checklist

Before deploying to production:

- [ ] Public key configured in frontend
- [ ] Access token configured in backend
- [ ] Service role key configured for database
- [ ] Test cards work in sandbox
- [ ] Real cards work in production test
- [ ] Error messages are user-friendly
- [ ] Retry functionality works
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Webhook configured and tested
- [ ] Database updates working
- [ ] Monitoring/logging enabled

---

**Last Updated:** November 2024

For additional support, refer to the [MercadoPago Payment Brick documentation](https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/payment-brick/introduction).
