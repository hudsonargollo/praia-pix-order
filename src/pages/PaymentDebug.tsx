import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PaymentDebug = () => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("0.01");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testMercadoPagoAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const accessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
      const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

      console.log("Access Token:", accessToken ? "Present" : "Missing");
      console.log("Public Key:", publicKey ? "Present" : "Missing");

      if (!accessToken) {
        throw new Error("MercadoPago Access Token not found");
      }

      const payload = {
        transaction_amount: parseFloat(amount),
        description: "Test Payment - COCOLOKO",
        payment_method_id: "pix",
        external_reference: `test-${Date.now()}`,
        payer: {
          first_name: "Test",
          last_name: "User",
          email: "test@cocoloko.com.br",
          phone: {
            area_code: "73",
            number: "999999999"
          }
        },
        additional_info: {
          items: [
            {
              id: "test-item",
              title: "Test Payment",
              description: "Test payment for debugging",
              quantity: 1,
              unit_price: parseFloat(amount)
            }
          ]
        },
        expires: true,
        date_of_expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };

      console.log("Payload:", payload);

      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `test-${Date.now()}`
        },
        body: JSON.stringify(payload)
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log("Response text:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || data.error?.message || responseText}`);
      }

      setResult(data);
      toast.success("Payment created successfully!");

    } catch (err) {
      console.error("MercadoPago API Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = () => {
    const accessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

    console.log("Environment variables check:");
    console.log("VITE_MERCADOPAGO_ACCESS_TOKEN:", accessToken ? "✓ Present" : "✗ Missing");
    console.log("VITE_MERCADOPAGO_PUBLIC_KEY:", publicKey ? "✓ Present" : "✗ Missing");

    if (accessToken) {
      console.log("Access Token starts with:", accessToken.substring(0, 20) + "...");
    }
    if (publicKey) {
      console.log("Public Key starts with:", publicKey.substring(0, 20) + "...");
    }

    toast.info("Check console for credential details");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">MercadoPago Payment Debug</h1>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Credentials Test</h2>
            <Button onClick={testCredentials} className="mb-4">
              Check Credentials
            </Button>
            <div className="text-sm space-y-1">
              <p><strong>Access Token:</strong> {import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN ? "✓ Loaded" : "✗ Missing"}</p>
              <p><strong>Public Key:</strong> {import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY ? "✓ Loaded" : "✗ Missing"}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">API Test</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                />
              </div>
              <Button onClick={testMercadoPagoAPI} disabled={loading} className="w-full">
                {loading ? "Testing..." : "Test MercadoPago API"}
              </Button>
            </div>
          </Card>

          {error && (
            <Card className="p-6 border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </Card>
          )}

          {result && (
            <Card className="p-6 border-green-200 bg-green-50">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Success</h3>
              <div className="space-y-2">
                <p><strong>Payment ID:</strong> {result.id}</p>
                <p><strong>Status:</strong> {result.status}</p>
                <p><strong>Amount:</strong> R$ {result.transaction_amount}</p>
                {result.point_of_interaction?.transaction_data?.qr_code && (
                  <div>
                    <p><strong>PIX Code:</strong></p>
                    <textarea 
                      className="w-full h-20 text-xs font-mono bg-white border rounded p-2"
                      value={result.point_of_interaction.transaction_data.qr_code}
                      readOnly
                    />
                  </div>
                )}
                {result.point_of_interaction?.transaction_data?.qr_code_base64 && (
                  <div>
                    <p><strong>QR Code Image:</strong></p>
                    <img 
                      src={`data:image/png;base64,${result.point_of_interaction.transaction_data.qr_code_base64}`}
                      alt="QR Code"
                      className="w-48 h-48 border"
                    />
                  </div>
                )}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Full Response</summary>
                <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDebug;