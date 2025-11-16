import { useState, useEffect } from "react";
import { mercadoPagoService } from "@/integrations/mercadopago/client";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, Clock, AlertCircle, RefreshCw, QrCode } from "lucide-react";
import { toast } from "sonner";
import type { MercadoPagoPaymentResponse } from "@/integrations/mercadopago/types";

interface CustomerInfo {
  name: string;
  phone: string;
}

interface PIXQRGeneratorProps {
  orderId: string;
  amount: number;
  customerInfo: CustomerInfo;
  onPaymentComplete?: (paymentId: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
  mode?: 'auto' | 'manual'; // auto = customer flow, manual = waiter flow
}

const PIXQRGenerator = ({ 
  orderId, 
  amount, 
  customerInfo, 
  onPaymentComplete,
  onClose,
  isOpen = false,
  mode = 'auto'
}: PIXQRGeneratorProps) => {
  const [paymentData, setPaymentData] = useState<MercadoPagoPaymentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'approved' | 'expired' | 'error'>('idle');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Payment status polling
  const { stopPolling } = usePaymentPolling({
    paymentId: paymentData?.id || null,
    orderId: orderId,
    isActive: paymentStatus === 'pending',
    onSuccess: () => {
      setPaymentStatus('approved');
      toast.success('Pagamento aprovado!');
      onPaymentComplete?.(paymentData?.id || '');
    },
    onError: (error) => {
      console.error('Payment polling error:', error);
      setPaymentStatus('error');
      toast.error('Erro ao verificar pagamento');
    },
    onTimeout: () => {
      setPaymentStatus('expired');
      toast.warning('Pagamento expirado');
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

  const generatePIXPayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('pending');

      let paymentResponse: MercadoPagoPaymentResponse;

      if (mode === 'manual') {
        // Manual mode: call the new generate-pix endpoint for waiter orders
        const response = await fetch('/api/orders/generate-pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ orderId })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate PIX');
        }

        const data = await response.json();
        
        paymentResponse = {
          id: data.paymentId,
          status: 'pending',
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          pixCopyPaste: data.qrCode,
          expirationDate: data.expiresAt,
          transactionAmount: data.amount
        };
      } else {
        // Auto mode: use existing customer flow
        paymentResponse = await mercadoPagoService.createPayment({
          orderId: orderId,
          amount: amount,
          description: `Pedido - ${customerInfo.name}`,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          tableNumber: 'Customer'
        });
      }

      setPaymentData(paymentResponse);
      
      // Set initial time remaining
      const expirationTime = new Date(paymentResponse.expirationDate).getTime();
      const now = Date.now();
      setTimeRemaining(Math.max(0, expirationTime - now));

      toast.success('PIX gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PIX payment:', error);
      setPaymentStatus('error');
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (!paymentData?.pixCopyPaste) return;

    try {
      await navigator.clipboard.writeText(paymentData.pixCopyPaste);
      toast.success('Código PIX copiado!');
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
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Aguardando</Badge>;
      default:
        return null;
    }
  };

  const handleClose = () => {
    stopPolling();
    setPaymentData(null);
    setPaymentStatus('idle');
    setTimeRemaining(0);
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            Gerar PIX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Order Summary */}
          <Card className="p-3">
            <h3 className="font-semibold mb-2 text-sm">Resumo do Pedido</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{customerInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{customerInfo.phone}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                <span>Total:</span>
                <span className="text-primary">R$ {amount.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Payment Status */}
          {paymentStatus !== 'idle' && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Status do Pagamento</h3>
                {getStatusBadge()}
              </div>
              
              {paymentStatus === 'pending' && timeRemaining > 0 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tempo restante:</p>
                  <p className="text-xl font-bold text-primary">{formatTime(timeRemaining)}</p>
                </div>
              )}

              {paymentStatus === 'approved' && (
                <div className="text-center text-green-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-semibold">Pagamento aprovado!</p>
                </div>
              )}

              {paymentStatus === 'expired' && (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-destructive" />
                  <p className="font-semibold text-destructive">Pagamento expirado</p>
                  <Button 
                    className="w-full mt-2" 
                    onClick={generatePIXPayment}
                    disabled={loading}
                  >
                    Gerar Novo PIX
                  </Button>
                </div>
              )}

              {paymentStatus === 'error' && (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-destructive" />
                  <p className="font-semibold text-destructive">Erro no pagamento</p>
                  <Button 
                    className="w-full mt-2" 
                    onClick={generatePIXPayment}
                    disabled={loading}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* QR Code Display */}
          {paymentStatus === 'pending' && paymentData && (
            <>
              <Card className="p-3 text-center">
                <h3 className="font-semibold mb-2 text-sm">Escaneie o QR Code</h3>
                {paymentData.qrCodeBase64 ? (
                  <div className="flex justify-center mb-2">
                    <img
                      src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                      alt="QR Code para pagamento"
                      className="w-40 h-40 border rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-gray-100 border rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">QR Code não disponível</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Abra o app do seu banco e escaneie o código
                </p>
              </Card>

              <Card className="p-3">
                <h3 className="font-semibold mb-2 text-sm">Ou copie o código PIX</h3>
                <div className="bg-gray-50 p-2 rounded-lg mb-2 max-h-20 overflow-y-auto">
                  <p className="text-xs font-mono break-all text-gray-700">
                    {paymentData.pixCopyPaste}
                  </p>
                </div>
                <Button onClick={copyPixCode} className="w-full" variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código PIX
                </Button>
              </Card>
            </>
          )}

          {/* Generate PIX Button */}
          {paymentStatus === 'idle' && (
            <Button 
              onClick={generatePIXPayment} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar PIX
                </>
              )}
            </Button>
          )}

          {/* Close Button */}
          <Button variant="outline" onClick={handleClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PIXQRGenerator;