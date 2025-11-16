/**
 * Credit Card Payment Component
 * 
 * Handles the complete credit card payment flow using MercadoPago Payment Brick.
 * This component provides a secure, embedded payment form that tokenizes card data
 * client-side before sending to the backend for processing.
 * 
 * @module CreditCardPayment
 * @see {@link https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/payment-brick/introduction}
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { paymentBrickService } from '@/integrations/mercadopago/payment-brick';
import { mercadoPagoService } from '@/integrations/mercadopago/client';
import type { PaymentBrickFormData, CardPaymentRequest } from '@/integrations/mercadopago/types';

/**
 * Props for the CreditCardPayment component
 * 
 * @interface CreditCardPaymentProps
 * @property {string} orderId - Unique identifier for the order being paid
 * @property {number} amount - Payment amount in Brazilian Reais (BRL)
 * @property {string} [customerEmail] - Customer's email address (optional, can be entered in form)
 * @property {string} [customerDocument] - Customer's CPF or CNPJ number (optional, can be entered in form)
 * @property {'CPF' | 'CNPJ'} [customerDocumentType] - Type of document (defaults to 'CPF')
 * @property {function} onPaymentSuccess - Callback invoked when payment is approved
 * @property {function} onPaymentError - Callback invoked when payment fails or is rejected
 * @property {function} onPaymentPending - Callback invoked when payment is under review
 */
export interface CreditCardPaymentProps {
  orderId: string;
  amount: number;
  customerEmail?: string;
  customerDocument?: string;
  customerDocumentType?: 'CPF' | 'CNPJ';
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentPending: () => void;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error' | 'pending';

/**
 * Maps MercadoPago status detail codes to user-friendly Portuguese messages
 * 
 * @param {string} [statusDetail] - MercadoPago status detail code
 * @returns {string} User-friendly error message in Portuguese
 * @example
 * getStatusDetailMessage('cc_rejected_insufficient_amount') // Returns: 'Fundos insuficientes no cartão'
 */
const getStatusDetailMessage = (statusDetail?: string): string => {
  if (!statusDetail) return '';

  const messages: Record<string, string> = {
    'cc_rejected_insufficient_amount': 'Fundos insuficientes no cartão',
    'cc_rejected_bad_filled_card_number': 'Número de cartão inválido',
    'cc_rejected_bad_filled_date': 'Data de validade inválida',
    'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
    'cc_rejected_call_for_authorize': 'Entre em contato com seu banco para autorizar o pagamento',
    'cc_rejected_card_disabled': 'Cartão desabilitado. Entre em contato com seu banco',
    'cc_rejected_duplicated_payment': 'Pagamento duplicado detectado',
    'cc_rejected_high_risk': 'Pagamento recusado por motivos de segurança',
    'cc_rejected_max_attempts': 'Número máximo de tentativas excedido',
    'cc_rejected_card_error': 'Erro no processamento do cartão',
  };

  return messages[statusDetail] || 'Pagamento recusado. Tente outro cartão.';
};

/**
 * CreditCardPayment Component
 * 
 * Renders a secure credit card payment form using MercadoPago Payment Brick.
 * Handles the complete payment lifecycle including:
 * - Payment Brick initialization and rendering
 * - Card data tokenization (client-side, secure)
 * - Payment submission to backend
 * - Status updates and error handling
 * - Retry functionality for failed payments
 * 
 * Security Features:
 * - Card data never touches our servers (tokenized by MercadoPago SDK)
 * - PCI DSS compliant through MercadoPago
 * - Single-use tokens for each payment attempt
 * 
 * @component
 * @example
 * ```tsx
 * <CreditCardPayment
 *   orderId="order-123"
 *   amount={50.00}
 *   customerEmail="customer@example.com"
 *   onPaymentSuccess={(paymentId) => console.log('Paid:', paymentId)}
 *   onPaymentError={(error) => console.error('Error:', error)}
 *   onPaymentPending={() => console.log('Payment under review')}
 * />
 * ```
 */
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
  // State management
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrickReady, setIsBrickReady] = useState(false);
  
  // Refs
  const brickContainerRef = useRef<HTMLDivElement>(null);

  // Container ID for Payment Brick
  const BRICK_CONTAINER_ID = 'payment-brick-container';

  /**
   * Initialize Payment Brick on component mount
   * 
   * This effect:
   * 1. Initializes the MercadoPago Payment Brick with configuration
   * 2. Mounts the brick in the designated container
   * 3. Sets up event handlers for ready, error, and submit events
   * 4. Cleans up by unmounting the brick when component unmounts
   * 
   * Re-runs when the amount changes to update the brick configuration.
   */
  useEffect(() => {
    let isMounted = true;

    const initializeBrick = async () => {
      try {
        setError(null);
        setIsBrickReady(false);

        // Initialize Payment Brick with configuration
        await paymentBrickService.createPaymentBrick(
          BRICK_CONTAINER_ID,
          {
            amount,
            locale: 'pt-BR',
            customization: {
              visual: {
                hidePaymentButton: true, // We use our own button
              },
              paymentMethods: {
                maxInstallments: 1, // No installments
                minInstallments: 1,
              },
            },
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
                setError(error.message || 'Erro ao carregar formulário de pagamento');
                setPaymentStatus('error');
              }
            },
          }
        );
      } catch (error) {
        if (isMounted) {
          console.error('Failed to initialize Payment Brick:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erro ao inicializar formulário de pagamento';
          setError(errorMessage);
          setPaymentStatus('error');
        }
      }
    };

    initializeBrick();

    // Cleanup: unmount brick when component unmounts
    return () => {
      isMounted = false;
      paymentBrickService.unmount().catch((error) => {
        console.error('Error unmounting Payment Brick:', error);
      });
    };
  }, [amount]); // Re-initialize if amount changes

  /**
   * Handles payment submission when user clicks "Pagar com Cartão"
   * 
   * Process:
   * 1. Validates that Payment Brick is initialized and form is filled
   * 2. Extracts card token from form data (tokenization happens in Payment Brick)
   * 3. Sends token and payment details to backend API
   * 4. Handles response (approved, rejected, or in_process)
   * 5. Invokes appropriate callback based on payment status
   * 
   * @async
   * @throws {Error} If Payment Brick is not initialized or tokenization fails
   */
  const handlePaymentSubmit = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setPaymentStatus('processing');

      // Get the brick controller to access form data
      const brickController = paymentBrickService.getBrickController();
      
      if (!brickController) {
        throw new Error('Formulário de pagamento não inicializado');
      }

      // Get form data from Payment Brick
      // This triggers validation and tokenization
      const formData = await brickController.getFormData();
      
      if (!formData) {
        throw new Error('Por favor, preencha todos os dados do cartão');
      }

      // Extract card token from form data
      const token = await paymentBrickService.getCardToken(formData);

      if (!token) {
        throw new Error('Erro ao processar dados do cartão');
      }

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

      // Call backend API to process payment
      const response = await mercadoPagoService.createCardPayment(paymentRequest);

      // Handle payment response
      if (response.success && response.status === 'approved') {
        setPaymentStatus('success');
        setIsProcessing(false);
        if (response.paymentId) {
          onPaymentSuccess(response.paymentId);
        }
      } else if (response.status === 'rejected') {
        setPaymentStatus('error');
        setIsProcessing(false);
        
        // Get detailed error message based on status detail
        let errorMessage = response.error || 'Pagamento recusado';
        if (response.statusDetail) {
          const detailMessage = getStatusDetailMessage(response.statusDetail);
          if (detailMessage) {
            errorMessage = detailMessage;
          }
        }
        
        setError(errorMessage);
        onPaymentError(errorMessage);
      } else if (response.status === 'in_process') {
        setPaymentStatus('pending');
        setIsProcessing(false);
        onPaymentPending();
      } else {
        throw new Error(response.error || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      setError(errorMessage);
      setPaymentStatus('error');
      setIsProcessing(false);
      onPaymentError(errorMessage);
    }
  };

  /**
   * Handles retry after a failed payment attempt
   * 
   * This function:
   * 1. Resets component state to initial values
   * 2. Unmounts the existing Payment Brick
   * 3. Re-initializes a fresh Payment Brick instance
   * 4. Allows user to enter new card details or retry with same card
   * 
   * @async
   */
  const handleRetry = async () => {
    setPaymentStatus('idle');
    setError(null);
    setIsProcessing(false);
    setIsBrickReady(false);

    try {
      // Unmount existing brick
      await paymentBrickService.unmount();

      // Re-initialize brick
      await paymentBrickService.createPaymentBrick(
        BRICK_CONTAINER_ID,
        {
          amount,
          locale: 'pt-BR',
          customization: {
            visual: {
              hidePaymentButton: true,
            },
            paymentMethods: {
              maxInstallments: 1,
              minInstallments: 1,
            },
          },
        },
        {
          onReady: () => {
            setIsBrickReady(true);
          },
          onError: (error) => {
            console.error('Payment Brick error after retry:', error);
            setError(error.message || 'Erro ao carregar formulário de pagamento');
            setPaymentStatus('error');
          },
        }
      );
    } catch (error) {
      console.error('Failed to retry Payment Brick initialization:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reinicializar formulário';
      setError(errorMessage);
      setPaymentStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Loading State - Show while brick is initializing */}
      {!isBrickReady && !error && (
        <div className="flex items-center justify-center min-h-[400px] w-full border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
            <p className="text-sm text-gray-600">Carregando formulário de pagamento...</p>
          </div>
        </div>
      )}

      {/* Payment Brick Container */}
      <div
        id={BRICK_CONTAINER_ID}
        data-testid="payment-brick-container"
        ref={brickContainerRef}
        className={`min-h-[400px] w-full ${!isBrickReady || error ? 'hidden' : ''}`}
      />

      {/* Error Display */}
      {error && paymentStatus === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Erro no pagamento</p>
              <p>{error}</p>
              {error.includes('recusado') && (
                <p className="text-sm mt-2">
                  Verifique os dados do cartão ou tente outro cartão.
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {paymentStatus === 'success' && (
        <Alert className="border-green-500 bg-green-50 text-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Pagamento aprovado com sucesso!</p>
              <p className="text-sm">Seu pedido está sendo preparado.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Display */}
      {paymentStatus === 'pending' && (
        <Alert className="border-yellow-500 bg-yellow-50 text-yellow-900">
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Pagamento em análise</p>
              <p className="text-sm">
                Você receberá uma notificação quando for aprovado. Isso pode levar alguns minutos.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Button */}
      <Button
        onClick={handlePaymentSubmit}
        disabled={isProcessing || !isBrickReady || paymentStatus === 'success'}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando pagamento...
          </>
        ) : paymentStatus === 'success' ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Pagamento Aprovado
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pagar com Cartão
          </>
        )}
      </Button>

      {/* Retry Button (shown on error) */}
      {paymentStatus === 'error' && (
        <Button
          onClick={handleRetry}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Tentar Novamente
        </Button>
      )}
    </div>
  );
}
