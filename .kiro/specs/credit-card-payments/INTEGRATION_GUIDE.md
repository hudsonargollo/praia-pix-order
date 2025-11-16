# Credit Card Payment Integration Guide

## Overview

This guide explains how the MercadoPago Payment Brick integration works and how to use it in your application.

## Architecture

### Components

1. **PaymentMethodSelector** - Toggle between PIX and credit card
2. **CreditCardPayment** - Main payment component with Payment Brick
3. **paymentBrickService** - Service for managing Payment Brick lifecycle
4. **mercadoPagoService** - API client for payment processing
5. **create-card-payment** - Backend edge function for payment processing

### Flow

```
Customer → PaymentMethodSelector → CreditCardPayment → Payment Brick (tokenize) 
→ Backend API → MercadoPago API → Database Update → Customer Notification
```

## Using the Components

### Basic Usage

```tsx
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import CreditCardPayment from '@/components/CreditCardPayment';

function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  
  return (
    <>
      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
      />
      
      {paymentMethod === 'credit_card' && (
        <CreditCardPayment
          orderId={order.id}
          amount={order.total_amount}
          onPaymentSuccess={(paymentId) => {
            // Handle success
          }}
          onPaymentError={(error) => {
            // Handle error
          }}
          onPaymentPending={() => {
            // Handle pending
          }}
        />
      )}
    </>
  );
}
```


### Advanced Configuration

```tsx
<CreditCardPayment
  orderId="order-123"
  amount={50.00}
  customerEmail="customer@example.com"
  customerDocument="12345678900"
  customerDocumentType="CPF"
  onPaymentSuccess={(paymentId) => {
    console.log('Payment approved:', paymentId);
    updateOrderStatus('paid');
    showSuccessMessage();
  }}
  onPaymentError={(error) => {
    console.error('Payment failed:', error);
    showErrorMessage(error);
  }}
  onPaymentPending={() => {
    console.log('Payment under review');
    showPendingMessage();
  }}
/>
```

## Payment Brick Service

### Initialization

The Payment Brick service automatically initializes when needed:

```typescript
import { paymentBrickService } from '@/integrations/mercadopago/payment-brick';

// Create brick
await paymentBrickService.createPaymentBrick(
  'container-id',
  {
    amount: 50.00,
    locale: 'pt-BR',
    customization: {
      visual: { hidePaymentButton: true },
      paymentMethods: { maxInstallments: 1 }
    }
  },
  {
    onReady: () => console.log('Ready'),
    onError: (error) => console.error(error),
    onSubmit: (formData) => console.log(formData)
  }
);

// Get token
const token = await paymentBrickService.getCardToken(formData);

// Unmount
await paymentBrickService.unmount();
```


## API Client

### Creating Card Payment

```typescript
import { mercadoPagoService } from '@/integrations/mercadopago/client';

const response = await mercadoPagoService.createCardPayment({
  orderId: 'order-123',
  token: 'card-token-from-brick',
  amount: 50.00,
  paymentMethodId: 'visa',
  payer: {
    email: 'customer@example.com',
    identification: {
      type: 'CPF',
      number: '12345678900'
    }
  }
});

if (response.success && response.status === 'approved') {
  console.log('Payment approved:', response.paymentId);
} else if (response.status === 'rejected') {
  console.error('Payment rejected:', response.error);
}
```

## Security Considerations

### PCI Compliance

- Card data never touches our servers
- Tokenization happens client-side via MercadoPago SDK
- Tokens are single-use and expire quickly
- All communication over HTTPS

### Best Practices

1. **Never log sensitive data:**
   ```typescript
   // ❌ Don't do this
   console.log('Card number:', cardNumber);
   
   // ✅ Do this
   console.log('Payment processing for order:', orderId);
   ```

2. **Validate on backend:**
   - Always validate payment data on backend
   - Don't trust client-side validation alone

3. **Handle errors gracefully:**
   - Show user-friendly error messages
   - Don't expose technical details to users


## Error Handling

### Frontend Errors

```typescript
try {
  const response = await mercadoPagoService.createCardPayment(request);
  // Handle response
} catch (error) {
  if (error.message.includes('network')) {
    showError('Erro de conexão. Verifique sua internet.');
  } else if (error.message.includes('token')) {
    showError('Erro ao processar cartão. Tente novamente.');
  } else {
    showError('Erro inesperado. Entre em contato com o suporte.');
  }
}
```

### Backend Errors

The backend automatically handles:
- Retry logic with exponential backoff
- MercadoPago API errors
- Database update failures
- Network timeouts

## Testing

### Test Cards (Sandbox)

```
Approved:
Card: 5031 4332 1540 6351
CVV: 123
Expiry: 11/25

Rejected (Insufficient Funds):
Card: 5031 4332 1540 6351
CVV: 123
Expiry: 11/25
Name: FUND
```

### Testing Checklist

- [ ] Payment Brick loads correctly
- [ ] Card tokenization works
- [ ] Approved payment updates order
- [ ] Rejected payment shows error
- [ ] Retry functionality works
- [ ] Mobile responsive
- [ ] Error messages are clear

## Monitoring

### Key Metrics

- Payment success rate
- Average payment time
- Error rate by type
- Token generation failures
- API response times

### Logging

```typescript
// Log important events (not sensitive data)
console.log('Payment initiated:', { orderId, amount });
console.log('Payment completed:', { orderId, status, paymentId });
console.error('Payment failed:', { orderId, error: error.message });
```

## Resources

- [MercadoPago Payment Brick Docs](https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/payment-brick/introduction)
- [Design Document](./design.md)
- [Requirements](./requirements.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Setup Guide](./SETUP.md)

---

**Last Updated:** November 2024
