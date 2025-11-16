import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mercadoPagoService } from "@/integrations/mercadopago/client";
import { paymentRecoveryService } from "@/integrations/mercadopago/recovery";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, Clock, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import CreditCardPayment from "@/components/CreditCardPayment";
import type { MercadoPagoPaymentResponse } from "@/integrations/mercadopago/types";

type PaymentMethod = 'pix' | 'credit_card';

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  table_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const Payment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentData, setPaymentData] = useState<MercadoPagoPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'expired' | 'error'>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Payment method state management (Task 7.1)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pix');
  
  // Handler for payment method changes
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  // Credit card payment callbacks (Task 7.4)
  const handleCardPaymentSuccess = (paymentId: string) => {
    setPaymentStatus('approved');
    setRetryCount(0);
    toast.success('Pagamento aprovado com sucesso!');
    
    // Update order status in database
    if (orderId) {
      supabase
        .from('orders')
        .update({
          status: 'paid',
          mercadopago_payment_id: paymentId,
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating order status:', error);
          }
        });
    }
  };

  const handleCardPaymentError = (error: string) => {
    setPaymentStatus('error');
    toast.error(error);
  };

  const handleCardPaymentPending = () => {
    setPaymentStatus('pending');
    toast.info('Pagamento em análise. Você receberá uma notificação quando for aprovado.');
  };

  // Load order and create payment
  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    loadOrderAndCreatePayment();
  }, [orderId]);

  // Payment status polling with custom hook
  const { stopPolling } = usePaymentPolling({
    paymentId: paymentData?.id || null,
    orderId: orderId || null,
    isActive: paymentStatus === 'pending',
    onSuccess: () => {
      setPaymentStatus('approved');
      setRetryCount(0);
      paymentRecoveryService.resetRecoveryAttempts(orderId!);
    },
    onError: (error) => {
      console.error('Payment polling error:', error);
      setPaymentStatus('error');
      handlePaymentError();
    },
    onTimeout: () => {
      setPaymentStatus('expired');
      handlePaymentTimeout();
    }
  });

  // Timer for payment expiration
  useEffect(() => {
    if (!paymentData) return;

    const expirationTime = new Date(paymentData.expirationDate).getTime();
    
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, expirationTime - now);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setPaymentStatus('expired');
        clearInterval(timerInterval);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [paymentData]);

  const loadOrderAndCreatePayment = async (isRetry: boolean = false) => {
    try {
      setLoading(true);
      if (isRetry) {
        setIsRecovering(true);
      }

      // Load order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order not found');

      setOrder(orderData);

      // Reset status for retry
      if (isRetry) {
        setPaymentStatus('pending');
        setRetryCount(prev => prev + 1);
      }

      // Create MercadoPago payment with enhanced error handling
      const paymentResponse = await mercadoPagoService.createPayment({
        orderId: orderData.id,
        amount: orderData.total_amount,
        description: `Pedido #${orderData.order_number} - ${orderData.customer_name}`,
        customerName: orderData.customer_name,
        customerPhone: orderData.customer_phone,
        tableNumber: orderData.table_number
      });

      setPaymentData(paymentResponse);

      // Update order with payment information
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'pending_payment',
          mercadopago_payment_id: paymentResponse.id,
          qr_code_data: paymentResponse.qrCodeBase64,
          pix_copy_paste: paymentResponse.pixCopyPaste,
          payment_expires_at: paymentResponse.expirationDate
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order with payment data:', updateError);
        // Don't fail the whole process for this error
      }

      if (isRetry) {
        toast.success('Novo pagamento gerado com sucesso!');
      }

    } catch (error) {
      console.error('Error loading order or creating payment:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (isRetry) {
        toast.error(`Erro ao gerar novo pagamento: ${errorMessage}`);
      } else {
        toast.error('Erro ao carregar pagamento. Tente novamente.');
      }
      
      setPaymentStatus('error');
      
      // Offer recovery options for certain errors
      if (retryCount < 3 && !isRetry) {
        setTimeout(() => {
          handlePaymentError();
        }, 2000);
      }
    } finally {
      setLoading(false);
      setIsRecovering(false);
    }
  };

  const handlePaymentError = async () => {
    if (!orderId) return;

    const recoveryAttempts = paymentRecoveryService.getRecoveryAttempts(orderId);
    
    if (recoveryAttempts < 3) {
      toast.error(
        'Erro no pagamento. Clique aqui para tentar novamente.',
        {
          duration: 10000,
          action: {
            label: 'Tentar Novamente',
            onClick: () => loadOrderAndCreatePayment(true)
          }
        }
      );
    } else {
      toast.error('Múltiplas tentativas falharam. Entre em contato com o suporte.');
    }
  };

  const handlePaymentTimeout = async () => {
    if (!orderId) return;

    // Use the recovery service to handle expired payments
    await paymentRecoveryService.handleExpiredPayment(orderId);
  };

  const handleManualRecovery = async () => {
    if (!orderId) return;

    setIsRecovering(true);
    const success = await paymentRecoveryService.recoverPayment({ orderId });
    
    if (success) {
      // Reload the page data to get the new payment info
      await loadOrderAndCreatePayment(true);
    }
    
    setIsRecovering(false);
  };

  const formatPixSnippet = (pixCode: string): string => {
    if (!pixCode || pixCode.length < 16) return pixCode;
    const first10 = pixCode.substring(0, 10);
    const last6 = pixCode.substring(pixCode.length - 6);
    return `${first10}...${last6}`;
  };

  const handleBack = () => {
    // First attempt: use browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback: navigate to menu
      navigate('/menu');
    }
  };

  const copyPixCode = async () => {
    if (!paymentData?.pixCopyPaste) return;

    try {
      await navigator.clipboard.writeText(paymentData.pixCopyPaste);
      toast.success('Copiado!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Erro ao copiar código');
    }
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'approved':
        return <Badge className="bg-green-500" aria-label="Status: Pagamento aprovado"><CheckCircle className="w-4 h-4 mr-1" aria-hidden="true" />Aprovado</Badge>;
      case 'expired':
        return <Badge variant="destructive" aria-label="Status: Pagamento expirado"><AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />Expirado</Badge>;
      case 'error':
        return <Badge variant="destructive" aria-label="Status: Erro no pagamento"><AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />Erro</Badge>;
      default:
        return <Badge className="bg-purple-600 text-white border-2 border-purple-400 shadow-lg animate-pulse-badge" aria-label="Status: Aguardando pagamento"><Clock className="w-4 h-4 mr-1" aria-hidden="true" />Aguardando</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-muted-foreground text-base">Gerando pagamento...</p>
        </div>
      </div>
    );
  }

  if (!order || !paymentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" role="alert" aria-live="assertive">
        <Card className="p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" aria-hidden="true" />
          <p className="text-muted-foreground mb-4 text-base">Erro ao carregar pagamento</p>
          <Button 
            onClick={() => navigate('/')} 
            className="min-h-[44px]"
            aria-label="Voltar ao início"
          >
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-ocean text-white p-4 shadow-medium" role="banner">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
            onClick={handleBack}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {selectedPaymentMethod === 'pix' ? 'Detalhes do pagamento PIX' : 'Pagamento com Cartão'}
            </h1>
            <p className="text-sm text-white/90">
              {selectedPaymentMethod === 'pix' 
                ? 'Use o código PIX abaixo para concluir o pagamento'
                : 'Preencha os dados do cartão para finalizar o pagamento'
              }
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6" role="main">
        {/* Payment Method Selector (Task 7.2) */}
        <Card className="p-4 shadow-soft">
          <h2 className="font-bold text-lg mb-3">Método de Pagamento</h2>
          <PaymentMethodSelector
            selectedMethod={selectedPaymentMethod}
            onMethodChange={handlePaymentMethodChange}
            disabled={loading || paymentStatus === 'approved'}
          />
        </Card>

        {/* Payment Status */}
        <Card className="p-4 shadow-soft" role="region" aria-label="Status do pagamento">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Status do Pagamento</h2>
            {getStatusBadge()}
          </div>
          
          {paymentStatus === 'pending' && selectedPaymentMethod === 'pix' && timeRemaining > 0 && (
            <div className="text-center" role="timer" aria-live="polite" aria-atomic="true">
              <p className="text-muted-foreground mb-2 text-sm">Tempo restante para pagamento:</p>
              <p className="text-2xl font-bold text-primary" aria-label={`${formatTime(timeRemaining)} restantes`}>{formatTime(timeRemaining)}</p>
            </div>
          )}

          {paymentStatus === 'pending' && selectedPaymentMethod === 'credit_card' && (
            <div className="text-center" role="status" aria-live="polite">
              <Clock className="w-16 h-16 mx-auto mb-2 text-yellow-600" aria-hidden="true" />
              <p className="font-semibold text-base">Pagamento em análise</p>
              <p className="text-sm text-muted-foreground">
                Você receberá uma notificação quando for aprovado
              </p>
            </div>
          )}

          {paymentStatus === 'approved' && (
            <div className="text-center text-green-600" role="status" aria-live="polite">
              <CheckCircle className="w-16 h-16 mx-auto mb-2" aria-hidden="true" />
              <p className="font-semibold text-base">Pagamento aprovado!</p>
              <p className="text-sm text-muted-foreground mb-4">Seu pedido foi confirmado!</p>
              <Button 
                onClick={() => navigate(`/order-status/${orderId}`)}
                className="w-full min-h-[44px]"
                aria-label="Ver status do pedido"
              >
                Ver Status do Pedido
              </Button>
            </div>
          )}

          {paymentStatus === 'expired' && selectedPaymentMethod === 'pix' && (
            <div className="text-center" role="alert" aria-live="assertive">
              <AlertCircle className="w-16 h-16 mx-auto mb-2 text-destructive" aria-hidden="true" />
              <p className="font-semibold text-destructive text-base">Pagamento expirado</p>
              <p className="text-sm text-muted-foreground mb-4">
                O tempo limite para pagamento foi excedido
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full min-h-[44px]" 
                  onClick={() => loadOrderAndCreatePayment(true)}
                  disabled={isRecovering}
                  aria-label={isRecovering ? "Gerando novo pagamento" : "Gerar novo pagamento"}
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Gerando...
                    </>
                  ) : (
                    'Gerar Novo Pagamento'
                  )}
                </Button>
                {retryCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tentativa {retryCount + 1} de 3
                  </p>
                )}
              </div>
            </div>
          )}

          {paymentStatus === 'error' && selectedPaymentMethod === 'pix' && (
            <div className="text-center" role="alert" aria-live="assertive">
              <AlertCircle className="w-16 h-16 mx-auto mb-2 text-destructive" aria-hidden="true" />
              <p className="font-semibold text-destructive text-base">Erro no pagamento</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ocorreu um erro ao processar o pagamento
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full min-h-[44px]" 
                  onClick={() => loadOrderAndCreatePayment(true)}
                  disabled={isRecovering}
                  aria-label={isRecovering ? "Tentando novamente" : "Tentar novamente"}
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Tentando...
                    </>
                  ) : (
                    'Tentar Novamente'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px]" 
                  onClick={handleManualRecovery}
                  disabled={isRecovering}
                  aria-label="Recuperar pagamento"
                >
                  Recuperar Pagamento
                </Button>
                {retryCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tentativa {retryCount + 1} de 3
                  </p>
                )}
              </div>
            </div>
          )}

          {paymentStatus === 'error' && selectedPaymentMethod === 'credit_card' && (
            <div className="text-center" role="alert" aria-live="assertive">
              <AlertCircle className="w-16 h-16 mx-auto mb-2 text-destructive" aria-hidden="true" />
              <p className="font-semibold text-destructive text-base">Erro no pagamento</p>
              <p className="text-sm text-muted-foreground mb-4">
                Verifique os dados do cartão e tente novamente
              </p>
            </div>
          )}
        </Card>

        {/* QR Code and Pix - Conditional rendering for PIX method (Task 7.3) */}
        {selectedPaymentMethod === 'pix' && paymentStatus === 'pending' && paymentData && (
          <>
            {/* Primary PIX Code Section */}
            <Card className="p-6 shadow-soft border-2 border-primary/20">
              <h3 className="font-bold text-lg mb-3">Código PIX</h3>
              
              {/* PIX Code Snippet */}
              <div className="bg-gray-50 p-4 rounded-lg mb-2">
                <p className="text-base font-mono text-center text-gray-700 select-all">
                  {formatPixSnippet(paymentData.pixCopyPaste)}
                </p>
              </div>
              
              {/* Helper Text */}
              <p className="text-sm text-muted-foreground text-center mb-4">
                Clique em "Copiar Código PIX" para colar no app do seu banco
              </p>
              
              {/* Primary Copy Button */}
              <Button 
                onClick={copyPixCode} 
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-lg min-h-[48px]"
                size="lg"
                aria-label="Copiar código PIX para área de transferência"
              >
                <Copy className="w-5 h-5 mr-2" aria-hidden="true" />
                Copiar Código PIX
              </Button>
            </Card>

            {/* Secondary QR Code Section */}
            <Card className="p-4 shadow-soft">
              <h3 className="font-semibold text-base mb-2">Pagar com QR Code (opcional)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Se preferir, aponte a câmera do app do seu banco para o QR Code
              </p>
              
              {/* Smaller QR Code */}
              {paymentData.qrCodeBase64 ? (
                <div className="flex justify-center" role="img" aria-label="QR Code para pagamento PIX">
                  <img
                    src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                    alt="QR Code para pagamento PIX - Escaneie com o aplicativo do seu banco"
                    className="w-48 h-48 border rounded-lg"
                    width="192"
                    height="192"
                  />
                </div>
              ) : (
                <div 
                  className="w-48 h-48 bg-gray-100 border rounded-lg mx-auto flex items-center justify-center"
                  role="alert"
                  aria-live="polite"
                >
                  <p className="text-muted-foreground text-sm">QR Code não disponível</p>
                </div>
              )}
            </Card>

          </>
        )}

        {/* Credit Card Payment - Conditional rendering for credit card method (Task 7.4) */}
        {selectedPaymentMethod === 'credit_card' && order && (
          <Card className="p-6 shadow-soft border-2 border-primary/20">
            <h3 className="font-bold text-lg mb-4">Pagamento com Cartão de Crédito</h3>
            <CreditCardPayment
              orderId={order.id}
              amount={order.total_amount}
              customerEmail=""
              customerDocument=""
              customerDocumentType="CPF"
              onPaymentSuccess={handleCardPaymentSuccess}
              onPaymentError={handleCardPaymentError}
              onPaymentPending={handleCardPaymentPending}
            />
          </Card>
        )}

        {/* Order Summary */}
        <Card className="p-4 shadow-soft" role="region" aria-label="Resumo do pedido">
          <h3 className="font-bold text-lg mb-4">Resumo do Pedido</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-semibold">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Telefone:</span>
              <span className="font-semibold">{formatPhoneNumber(order.customer_phone)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">R$ {order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Payment;