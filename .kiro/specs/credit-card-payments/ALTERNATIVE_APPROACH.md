# Alternative Approach: Using onSubmit Callback

If `getFormData()` method doesn't work with the Card Payment Brick, we need to use the `onSubmit` callback approach instead.

## Problem

The Card Payment Brick might not expose a `getFormData()` method that we can call manually. This is because the brick is designed to handle submission through its own callback system.

## Solution

Instead of manually calling `getFormData()`, we let the brick handle the submission through the `onSubmit` callback.

## Implementation

### Step 1: Update Payment Brick Service

Modify the brick creation to store a submission handler:

```typescript
class PaymentBrickServiceFixed {
  private brickController: any = null;
  private submitHandler: ((formData: any) => Promise<void>) | null = null;

  async createPaymentBrick(
    containerId: string,
    config: PaymentBrickConfig,
    callbacks?: PaymentBrickCallbacks
  ): Promise<any> {
    // ... initialization code ...

    this.brickController = await bricksBuilder.create('cardPayment', containerId, {
      initialization: {
        amount: config.amount,
      },
      customization: {
        visual: {
          hidePaymentButton: false, // Show the brick's button
          hideFormTitle: true,
        },
        paymentMethods: {
          maxInstallments: 1,
        },
      },
      callbacks: {
        onReady: () => {
          console.log('✓ Card Payment Brick ready');
          callbacks?.onReady?.();
        },
        onError: (error: any) => {
          console.error('✗ Card Payment Brick error:', error);
          callbacks?.onError?.(error);
        },
        onSubmit: async (formData: any) => {
          console.log('Card Payment Brick onSubmit called');
          // Call the stored submit handler
          if (this.submitHandler) {
            await this.submitHandler(formData);
          }
          if (callbacks?.onSubmit) {
            await callbacks.onSubmit(formData);
          }
        },
      },
    });

    return this.brickController;
  }

  // Method to set the submit handler
  setSubmitHandler(handler: (formData: any) => Promise<void>) {
    this.submitHandler = handler;
  }
}
```

### Step 2: Update CreditCardPayment Component

Change the component to use the brick's built-in button:

```typescript
export default function CreditCardPayment({
  orderId,
  amount,
  customerEmail = '',
  customerDocument = '',
  customerDocumentType = 'CPF',
  onPaymentSuccess,
  onPaymentError,
  onPaymentPending,
}: CreditCardPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrickReady, setIsBrickReady] = useState(false);

  // Define the payment handler
  const handlePaymentSubmit = async (formData: PaymentBrickFormData) => {
    try {
      setIsProcessing(true);
      setError(null);
      setPaymentStatus('processing');

      console.log('Processing payment with form data:', formData);

      // Extract token
      const token = await paymentBrickService.getCardToken(formData);

      // Prepare payment request
      const paymentRequest: CardPaymentRequest = {
        orderId,
        token,
        amount,
        paymentMethodId: formData.payment_method_id,
        payer: {
          email: formData.payer.email || customerEmail,
          identification: {
            type: (formData.payer.identification.type as 'CPF' | 'CNPJ') || customerDocumentType,
            number: formData.payer.identification.number || customerDocument,
          },
        },
      };

      // Call backend API
      const response = await mercadoPagoService.createCardPayment(paymentRequest);

      // Handle response
      if (response.success && response.status === 'approved') {
        setPaymentStatus('success');
        onPaymentSuccess(response.paymentId!);
      } else if (response.status === 'rejected') {
        setPaymentStatus('error');
        setError(response.error || 'Pagamento recusado');
        onPaymentError(response.error || 'Pagamento recusado');
      } else if (response.status === 'in_process') {
        setPaymentStatus('pending');
        onPaymentPending();
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      setError(errorMessage);
      setPaymentStatus('error');
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeBrick = async () => {
      try {
        setError(null);
        setIsBrickReady(false);

        // Set the submit handler before creating the brick
        paymentBrickService.setSubmitHandler(handlePaymentSubmit);

        // Create brick with onSubmit callback
        await paymentBrickService.createPaymentBrick(
          'payment-brick-container',
          {
            amount,
            locale: 'pt-BR',
          },
          {
            onReady: () => {
              if (isMounted) {
                setIsBrickReady(true);
              }
            },
            onError: (error) => {
              if (isMounted) {
                console.error('Payment Brick error:', error);
                setError(error.message || 'Erro ao carregar formulário');
                setPaymentStatus('error');
              }
            },
            onSubmit: handlePaymentSubmit,
          }
        );
      } catch (error) {
        if (isMounted) {
          console.error('Failed to initialize Payment Brick:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erro ao inicializar formulário';
          setError(errorMessage);
          setPaymentStatus('error');
        }
      }
    };

    initializeBrick();

    return () => {
      isMounted = false;
      paymentBrickService.unmount().catch(console.error);
    };
  }, [amount]);

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {!isBrickReady && !error && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      )}

      {/* Payment Brick Container - brick will show its own button */}
      <div
        id="payment-brick-container"
        className={`min-h-[400px] w-full ${!isBrickReady || error ? 'hidden' : ''}`}
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {paymentStatus === 'success' && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>Pagamento aprovado!</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## Key Changes

1. **Remove custom button**: Let the brick show its own payment button
2. **Use onSubmit callback**: Process payment when brick's button is clicked
3. **Set hidePaymentButton to false**: Show the brick's built-in button
4. **Remove manual getFormData() call**: Let the brick handle it

## Advantages

- ✅ Works with brick's native flow
- ✅ Brick handles validation automatically
- ✅ No need to manually trigger submission
- ✅ Better UX with brick's loading states

## Disadvantages

- ❌ Less control over button styling
- ❌ Button text is in brick's default language
- ❌ Can't customize button behavior

## Hybrid Approach

If you want to keep your custom button but use onSubmit:

```typescript
customization: {
  visual: {
    hidePaymentButton: true, // Hide brick's button
  },
}

// Add your custom button that triggers the brick's submit
<Button onClick={() => {
  // Trigger brick's internal submit
  const brickController = paymentBrickService.getBrickController();
  if (brickController && brickController.submit) {
    brickController.submit();
  }
}}>
  Pagar com Cartão
</Button>
```

## Testing

After implementing this approach:

1. Test on `/card-payment-test` page
2. Verify onSubmit is called when button is clicked
3. Check that formData contains token
4. Confirm payment processes correctly

## Rollback Plan

If this approach doesn't work either:

1. Check MercadoPago SDK version
2. Review official documentation for latest API
3. Contact MercadoPago support
4. Consider using their hosted checkout instead
