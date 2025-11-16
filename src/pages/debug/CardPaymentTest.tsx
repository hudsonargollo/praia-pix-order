/**
 * Card Payment Brick Test Page
 * 
 * This page tests the Card Payment Brick integration with detailed logging
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { paymentBrickServiceFixed } from '@/integrations/mercadopago/payment-brick-fixed';
import { mercadoPagoService } from '@/integrations/mercadopago/client';
import type { CardPaymentRequest } from '@/integrations/mercadopago/types';

export default function CardPaymentTest() {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    initializeBrick();
    
    return () => {
      paymentBrickServiceFixed.unmount().catch(console.error);
    };
  }, []);

  const initializeBrick = async () => {
    try {
      addLog('Initializing Card Payment Brick...');
      setError(null);

      await paymentBrickServiceFixed.createPaymentBrick(
        'card-payment-container',
        {
          amount: 10.00,
          locale: 'pt-BR',
        },
        {
          onReady: () => {
            addLog('✓ Brick is ready');
            setIsReady(true);
          },
          onError: (error) => {
            addLog(`✗ Brick error: ${error.message}`);
            setError(error.message);
          },
          onSubmit: handlePayment,
        }
      );

      addLog('✓ Brick initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`✗ Initialization error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handlePayment = async (formData: any) => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(false);
      addLog('Payment submission started...');

      if (!formData) {
        throw new Error('Form data is empty');
      }

      addLog(`✓ Form data received: ${JSON.stringify({
        hasToken: !!formData.token,
        paymentMethodId: formData.payment_method_id,
        hasEmail: !!formData.payer?.email,
        hasIdentification: !!formData.payer?.identification?.number
      })}`);

      const token = await paymentBrickServiceFixed.getCardToken(formData);
      addLog(`✓ Token extracted: ${token.substring(0, 20)}...`);

      const paymentRequest: CardPaymentRequest = {
        orderId: `test-${Date.now()}`,
        token,
        amount: 10.00,
        paymentMethodId: formData.payment_method_id,
        payer: {
          email: formData.payer.email || 'test@example.com',
          identification: {
            type: formData.payer.identification.type as 'CPF' | 'CNPJ',
            number: formData.payer.identification.number,
          },
        },
      };

      addLog('Sending payment request to backend...');
      const response = await mercadoPagoService.createCardPayment(paymentRequest);
      
      addLog(`Payment response: ${JSON.stringify(response)}`);

      if (response.success && response.status === 'approved') {
        addLog('✓ Payment approved!');
        setSuccess(true);
      } else if (response.status === 'rejected') {
        addLog(`✗ Payment rejected: ${response.error}`);
        setError(response.error || 'Payment rejected');
      } else if (response.status === 'in_process') {
        addLog('⏳ Payment in process');
        setSuccess(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`✗ Payment error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Card Payment Brick Test</h1>
          <p className="text-muted-foreground">
            Test the Card Payment Brick integration with detailed logging
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-900">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>Payment successful!</AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Test Payment - R$ 10,00</h2>
          
          <div 
            id="card-payment-container" 
            className="min-h-[400px] mb-4"
          />

          <div className="text-sm text-muted-foreground text-center">
            Click the "Pagar" button in the form above to process payment
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Test Card Numbers</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="p-2 bg-green-50 rounded">
              <div className="font-bold text-green-900">Approved:</div>
              <div>5031 4332 1540 6351</div>
              <div className="text-xs text-green-700">CVV: 123 | Exp: 11/25</div>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <div className="font-bold text-red-900">Rejected (insufficient funds):</div>
              <div>5031 7557 3453 0604</div>
              <div className="text-xs text-red-700">CVV: 123 | Exp: 11/25</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
