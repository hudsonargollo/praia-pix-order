import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentTest = () => {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  const approvePayment = async () => {
    if (!orderId.trim()) {
      toast.error("Digite o ID do pedido");
      return;
    }

    setLoading(true);
    try {
      // Update order status to paid
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId.trim());

      if (error) {
        console.error('Error approving payment:', error);
        toast.error("Erro ao aprovar pagamento");
        return;
      }

      toast.success("Pagamento aprovado com sucesso!");
      setOrderId("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const checkOrderStatus = async () => {
    if (!orderId.trim()) {
      toast.error("Digite o ID do pedido");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId.trim())
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        toast.error("Pedido não encontrado");
        return;
      }

      toast.info(`Status: ${data.status} | Total: R$ ${data.total_amount}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erro ao consultar pedido");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">🧪 Teste de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                ID do Pedido
              </label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Cole o ID do pedido aqui"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={approvePayment}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? "Aprovando..." : "✅ Aprovar Pagamento"}
              </Button>

              <Button
                onClick={checkOrderStatus}
                variant="outline"
                className="w-full"
              >
                📋 Consultar Status
              </Button>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Como usar:</strong></p>
              <p>1. Faça um pedido no sistema</p>
              <p>2. Copie o ID do pedido</p>
              <p>3. Cole aqui e clique em "Aprovar Pagamento"</p>
              <p>4. O pedido será enviado para a cozinha</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentTest;
