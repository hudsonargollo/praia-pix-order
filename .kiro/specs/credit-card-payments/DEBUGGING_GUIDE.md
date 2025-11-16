# Credit Card Payment Debugging Guide

## Test Page Deployed

🌐 **Test URL**: https://d58d94c7.coco-loko-acaiteria.pages.dev/card-payment-test

This page provides detailed logging and testing for the Card Payment Brick integration.

## Test Card Numbers

### Approved Payment
- **Card**: 5031 4332 1540 6351
- **CVV**: 123
- **Expiry**: 11/25
- **Name**: Any name
- **CPF**: Any valid CPF (e.g., 12345678909)

### Rejected Payment (Insufficient Funds)
- **Card**: 5031 7557 3453 0604
- **CVV**: 123
- **Expiry**: 11/25

## Debugging Steps

### 1. Check Environment Variables

Ensure these are set in Cloudflare Pages:
- `VITE_MERCADOPAGO_PUBLIC_KEY` - Public key for frontend
- `VITE_MERCADOPAGO_ACCESS_TOKEN` - Access token for backend API

### 2. Test the Card Payment Brick

1. Go to `/card-payment-test`
2. Check the logs section at the bottom
3. Look for these key messages:
   - ✓ MercadoPago SDK loaded
   - ✓ MercadoPago SDK initialized
   - ✓ Card Payment Brick ready

### 3. Test Payment Flow

1. Fill in the card form with test card number
2. Click "Pay R$ 10,00"
3. Watch the logs for:
   - Getting form data from brick
   - Form data received (should show hasToken: true)
   - Token extracted
   - Sending payment request to backend
   - Payment response

### 4. Common Issues and Solutions

#### Issue: "Brick controller not initialized"
**Solution**: The Payment Brick failed to load. Check:
- Public key is correct
- Network connection is stable
- Browser console for SDK loading errors

#### Issue: "Form data is empty"
**Solution**: The form wasn't filled correctly. Ensure:
- All required fields are filled
- Card number is valid
- Expiry date is in the future
- CVV is 3-4 digits

#### Issue: "Token not found"
**Solution**: Tokenization failed. Check:
- Card number format is correct
- MercadoPago SDK is properly loaded
- No JavaScript errors in console

#### Issue: Payment rejected
**Solution**: Check the error message:
- "Fundos insuficientes" - Use a different test card
- "Número de cartão inválido" - Check card number
- "Código de segurança inválido" - Check CVV

### 5. Backend API Debugging

Check Cloudflare Pages Functions logs:
1. Go to Cloudflare Dashboard
2. Navigate to Pages > coco-loko-acaiteria
3. Click on "Functions" tab
4. View real-time logs

Look for:
- Request received with token
- MercadoPago API response
- Database update status

### 6. Network Debugging

Open browser DevTools (F12) and check:

**Network Tab**:
- POST to `/api/mercadopago/create-card-payment`
- Status should be 200 for successful requests
- Response body shows payment status

**Console Tab**:
- Look for error messages
- Check for SDK loading issues
- Verify brick initialization

## Key Files

### Frontend
- `src/integrations/mercadopago/payment-brick-fixed.ts` - Simplified brick service
- `src/pages/debug/CardPaymentTest.tsx` - Test page with logging
- `src/components/CreditCardPayment.tsx` - Production component

### Backend
- `functions/api/mercadopago/create-card-payment.ts` - Payment processing API

## Next Steps

1. **Test on the deployed page**: Visit `/card-payment-test` and try a payment
2. **Check the logs**: Look for any error messages in the logs section
3. **Verify the response**: Ensure the payment response is correct
4. **Test with different cards**: Try both approved and rejected test cards

## Expected Flow

```
1. User fills card form
   ↓
2. User clicks "Pay"
   ↓
3. Brick validates form
   ↓
4. Brick tokenizes card data (client-side)
   ↓
5. Frontend gets token from brick
   ↓
6. Frontend sends token + order data to backend
   ↓
7. Backend calls MercadoPago API with token
   ↓
8. MercadoPago processes payment
   ↓
9. Backend updates order status
   ↓
10. Frontend shows success/error message
```

## Troubleshooting Checklist

- [ ] Public key is configured
- [ ] Access token is configured
- [ ] SDK loads without errors
- [ ] Brick initializes successfully
- [ ] Form can be filled
- [ ] Token is extracted from form data
- [ ] Backend receives the request
- [ ] MercadoPago API responds
- [ ] Order status is updated
- [ ] User sees appropriate message

## Contact

If issues persist after following this guide, check:
1. MercadoPago API status: https://status.mercadopago.com/
2. Cloudflare Pages status
3. Browser compatibility (use latest Chrome/Firefox)
