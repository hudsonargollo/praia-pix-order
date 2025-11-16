# Credit Card Payment Bug Fix

## Issue

When clicking "Pagar com Cartão" (Pay with Card), the payment fails with error message:
"Erro inesperado. Tente novamente." (Unexpected error. Try again.)

## Root Cause

The Payment Brick component was configured with `hidePaymentButton: true` to use a custom button, but the form data was never being captured. The original implementation relied on the `onSubmit` callback, which is only triggered when the Payment Brick's internal button is clicked. Since we hid that button, the callback was never called, and `formDataRef.current` remained `null`.

## Solution

Changed the payment submission flow to manually call `getFormData()` on the brick controller instead of relying on the `onSubmit` callback:

### Before (Broken)
```typescript
// Relied on onSubmit callback to populate formDataRef
onSubmit: async (formData: PaymentBrickFormData) => {
  formDataRef.current = formData;
}

// Later, when button clicked:
if (!formDataRef.current) {
  throw new Error('Por favor, preencha todos os dados do cartão');
}
const formData = formDataRef.current;
```

### After (Fixed)
```typescript
// No onSubmit callback needed

// When button clicked, directly get form data:
const formData = await brickController.getFormData();
if (!formData) {
  throw new Error('Por favor, preencha todos os dados do cartão');
}
```

## Changes Made

1. **src/components/CreditCardPayment.tsx**
   - Removed `formDataRef` ref (no longer needed)
   - Removed `onSubmit` callback from Payment Brick configuration
   - Changed `handlePaymentSubmit` to call `brickController.getFormData()` directly
   - Updated retry handler to remove formDataRef reference

2. **src/integrations/mercadopago/types.ts**
   - Added `getFormData()` method to `PaymentBrickInstance` interface

3. **src/pages/debug/CreditCardDebug.tsx** (New)
   - Created diagnostic page to help troubleshoot credit card payment issues
   - Accessible at `/credit-card-debug`

4. **src/App.tsx**
   - Added route for CreditCardDebug page

## Testing

To test the fix:

1. Navigate to payment page
2. Select "Cartão de Crédito" payment method
3. Fill in card details (use test card: 5031 4332 1540 6351)
4. Click "Pagar com Cartão"
5. Payment should process successfully

## Diagnostic Tool

If issues persist, use the diagnostic tool at `/credit-card-debug` to check:
- Public key configuration
- SDK loading
- SDK initialization
- Payment Brick creation

## Related Documentation

- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [MercadoPago Payment Brick Docs](https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/payment-brick/introduction)

---

**Fixed:** November 2024
**Status:** ✅ Resolved
