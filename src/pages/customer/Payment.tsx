import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mercadoPagoService } from "@/integrations/mercadopago/client";
import { paymentRecoveryService } from "@/integrations/mercadopago/recovery";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, Clock, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { MercadoPagoPaymentResponse } from "@/integrations/mercadopago/types";

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

  const copyPixCode = async () => {
    if (!paymentData?.pixCopyPaste) return;

    try {
      await navigator.clipboard.writeText(paymentData.pixCopyPaste);
      toast.success('Código Pix copiado!');
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
        return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" />Aprovado</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="w-4 h-4 mr-1" />Expirado</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-4 h-4 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Aguardando</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Gerando pagamento...</p>
        </div>
      </div>
    );
  }

  if (!order || !paymentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Erro ao carregar pagamento</p>
          <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-ocean text-white p-6 shadow-medium">
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 text-white hover:bg-white/20"
          onClick={() => navigate(`/checkout/${order.table_number}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Pagamento</h1>
        <p className="text-white/90 mt-1">Pedido #{order.order_number} - {order.customer_phone}</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Payment Status */}
        <Card className="p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Status do Pagamento</h2>
            {getStatusBadge()}
          </div>
          
          {paymentStatus === 'pending' && timeRemaining > 0 && (
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Tempo restante para pagamento:</p>
              <p className="text-2xl font-bold text-primary">{formatTime(timeRemaining)}</p>
            </div>
          )}

          {paymentStatus === 'approved' && (
            <div className="text-center text-green-600">
              <CheckCircle className="w-16 h-16 mx-auto mb-2" />
              <p className="font-semibold">Pagamento aprovado!</p>
              <p className="text-sm text-muted-foreground mb-4">Seu pedido foi confirmado!</p>
              <Button 
                onClick={() => navigate(`/order-status/${orderId}`)}
                className="w-full"
              >
                Ver Status do Pedido
              </Button>
            </div>
          )}

          {paymentStatus === 'expired' && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-2 text-destructive" />
              <p className="font-semibold text-destructive">Pagamento expirado</p>
              <p className="text-sm text-muted-foreground mb-4">
                O tempo limite para pagamento foi excedido
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => loadOrderAndCreatePayment(true)}
                  disabled={isRecovering}
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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

          {paymentStatus === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-2 text-destructive" />
              <p className="font-semibold text-destructive">Erro no pagamento</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ocorreu um erro ao processar o pagamento
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => loadOrderAndCreatePayment(true)}
                  disabled={isRecovering}
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Tentando...
                    </>
                  ) : (
                    'Tentar Novamente'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleManualRecovery}
                  disabled={isRecovering}
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
        </Card>

        {/* QR Code and Pix */}
        {paymentStatus === 'pending' && paymentData && (
          <>
            {/* QR Code */}
            <Card className="p-6 shadow-soft text-center">
              <h3 className="font-bold text-lg mb-4">Escaneie o QR Code</h3>
              {paymentData.qrCodeBase64 ? (
                <div className="flex justify-center mb-4">
                  <img
                    src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                    alt="QR Code para pagamento"
                    className="w-64 h-64 border rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 bg-gray-100 border rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <p className="text-muted-foreground">QR Code não disponível</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Abra o app do seu banco e escaneie o código
              </p>
            </Card>

            {/* Pix Copy/Paste */}
            <Card className="p-6 shadow-soft">
              <h3 className="font-bold text-lg mb-4">Ou copie o código Pix</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-mono break-all text-gray-700">
                  {paymentData.pixCopyPaste}
                </p>
              </div>
              <Button onClick={copyPixCode} className="w-full" variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Código Pix
              </Button>
            </Card>
          </>
        )}

        {/* Order Summary */}
        <Card className="p-4 shadow-soft">
          <h3 className="font-bold text-lg mb-4">Resumo do Pedido</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-semibold">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Telefone:</span>
              <span className="font-semibold">{order.customer_phone}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">R$ {order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Payment;