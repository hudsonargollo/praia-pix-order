/**
 * Credit Card Payment Debug Page
 * 
 * This page helps diagnose issues with credit card payment integration.
 * It checks environment variables, SDK loading, and Payment Brick initialization.
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { paymentBrickService } from '@/integrations/mercadopago/payment-brick';

export default function CreditCardDebug() {
  const [checks, setChecks] = useState({
    publicKey: false,
    sdkLoaded: false,
    sdkInitialized: false,
    brickCreated: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setLogs([]);

    try {
      // Check 1: Public Key
      addLog('Checking public key...');
      const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
      if (publicKey) {
        addLog(`✓ Public key found: ${publicKey.substring(0, 20)}...`);
        setChecks(prev => ({ ...prev, publicKey: true }));
      } else {
        addLog('✗ Public key not found in environment');
        throw new Error('VITE_MERCADOPAGO_PUBLIC_KEY not configured');
      }

      // Check 2: SDK Loading
      addLog('Loading MercadoPago SDK...');
      await paymentBrickService.initialize();
      addLog('✓ SDK loaded successfully');
      setChecks(prev => ({ ...prev, sdkLoaded: true }));

      // Check 3: SDK Initialized
      addLog('Checking SDK initialization...');
      if (paymentBrickService.isSDKInitialized()) {
        addLog('✓ SDK initialized');
        setChecks(prev => ({ ...prev, sdkInitialized: true }));
      } else {
        addLog('✗ SDK not initialized');
        throw new Error('SDK failed to initialize');
      }

      // Check 4: Create Test Brick
      addLog('Creating test Payment Brick...');
      await paymentBrickService.createPaymentBrick(
        'test-brick-container',
        {
          amount: 10.00,
          locale: 'pt-BR',
          customization: {
            visual: { hidePaymentButton: true },
            paymentMethods: { maxInstallments: 1 }
          }
        },
        {
          onReady: () => {
            addLog('✓ Payment Brick ready');
            setChecks(prev => ({ ...prev, brickCreated: true }));
          },
          onError: (error) => {
            addLog(`✗ Payment Brick error: ${error.message}`);
            setError(error.message);
          },
          onSubmit: async () => {
            addLog('Payment Brick submitted (test)');
          }
        }
      );

      addLog('✓ All checks passed!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`✗ Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean }) => {
    if (loading) return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Credit Card Payment Debug</h1>
          <p className="text-muted-foreground">
            Diagnostic tool for troubleshooting credit card payment issues
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Diagnostic Checks</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusIcon status={checks.publicKey} />
              <span>Public Key Configured</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusIcon status={checks.sdkLoaded} />
              <span>MercadoPago SDK Loaded</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusIcon status={checks.sdkInitialized} />
              <span>SDK Initialized</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusIcon status={checks.brickCreated} />
              <span>Payment Brick Created</span>
            </div>
          </div>

          <Button 
            onClick={runDiagnostics} 
            className="mt-6 w-full"
            disabled={loading}
          >
            {loading ? 'Running Diagnostics...' : 'Run Diagnostics Again'}
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Test Payment Brick</h2>
          <div 
            id="test-brick-container" 
            className="min-h-[400px] border rounded-lg"
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Diagnostic Logs</h2>
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

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-muted-foreground">VITE_MERCADOPAGO_PUBLIC_KEY:</span>{' '}
              <span className={import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY ? 'text-green-600' : 'text-red-600'}>
                {import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY ? '✓ Set' : '✗ Not Set'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
