import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, CreditCard } from "lucide-react";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const OrderStatus = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    
    // Subscribe to order changes
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending_payment":
        return {
          label: "Aguardando Pagamento",
          icon: <CreditCard className="h-6 w-6" />,
          color: "bg-yellow-500",
        };
      case "payment_confirmed":
        return {
          label: "Em Preparo",
          icon: <Clock className="h-6 w-6" />,
          color: "bg-primary",
        };
      case "ready":
        return {
          label: "Pronto para Retirada",
          icon: <CheckCircle className="h-6 w-6" />,
          color: "bg-success",
        };
      default:
        return {
          label: status,
          icon: <Clock className="h-6 w-6" />,
          color: "bg-muted",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Pedido não encontrado</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-ocean text-white p-6 shadow-medium">
        <h1 className="text-2xl font-bold">Status do Pedido</h1>
        <p className="text-white/90 mt-1">Pedido #{order.order_number}</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Status Card */}
        <Card className="p-6 text-center shadow-medium">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${statusInfo.color} text-white mb-4`}>
            {statusInfo.icon}
          </div>
          <h2 className="text-2xl font-bold mb-2">{statusInfo.label}</h2>
          <p className="text-muted-foreground">
            {order.status === "pending_payment" && "Aguardando confirmação do pagamento PIX"}
            {order.status === "payment_confirmed" && "Seu pedido está sendo preparado"}
            {order.status === "ready" && "Pode retirar no balcão!"}
          </p>
        </Card>

        {/* Order Details */}
        <Card className="p-6 shadow-soft">
          <h3 className="font-bold mb-4">Detalhes</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-semibold">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mesa</span>
              <span className="font-semibold">{order.table_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-primary">R$ {Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Payment Mock (V1 - sem integração real) */}
        {order.status === "pending_payment" && (
          <Card className="p-6 shadow-soft border-2 border-dashed">
            <h3 className="font-bold mb-3">Pagamento PIX (Simulado)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Em produção, aqui seria exibido o QR Code e código PIX Copia e Cola.
            </p>
            <div className="bg-muted p-4 rounded text-center font-mono text-xs">
              PIX_MOCK_CODE_123456789
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;
