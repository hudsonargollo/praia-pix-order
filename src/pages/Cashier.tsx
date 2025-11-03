import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Clock, CheckCircle, Bell } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  notified_at: string | null;
}

const Cashier = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();

    // Subscribe to order changes
    const channel = supabase
      .channel('cashier-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "payment_confirmed",
          payment_confirmed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Pagamento confirmado!");
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("Erro ao confirmar pagamento");
    }
  };

  const notifyCustomer = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          notified_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Cliente notificado! (simulado)");
    } catch (error) {
      console.error("Error notifying customer:", error);
      toast.error("Erro ao notificar cliente");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === "pending_payment");
  const inProgressOrders = orders.filter((o) => o.status === "payment_confirmed");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-sunset text-white p-6 shadow-medium">
        <h1 className="text-3xl font-bold">Caixa</h1>
        <p className="text-white/90 mt-1">Painel de Controle</p>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending">
              Aguardando <Badge className="ml-2">{pendingOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="progress">
              Em Preparo <Badge className="ml-2">{inProgressOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="ready">
              Pronto <Badge className="ml-2">{readyOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido aguardando pagamento
              </Card>
            ) : (
              pendingOrders.map((order) => (
                <Card key={order.id} className="p-4 shadow-soft">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Mesa {order.table_number} • {order.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        <CreditCard className="mr-1 h-3 w-3" /> Aguardando Pagamento
                      </Badge>
                      <p className="font-bold text-primary">
                        R$ {Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => confirmPayment(order.id)}
                  >
                    Confirmar Pagamento PIX
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {inProgressOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido em preparo
              </Card>
            ) : (
              inProgressOrders.map((order) => (
                <Card key={order.id} className="p-4 shadow-soft">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Mesa {order.table_number} • {order.customer_name}
                      </p>
                    </div>
                    <Badge className="bg-primary">
                      <Clock className="mr-1 h-3 w-3" /> Em Preparo
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            {readyOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido pronto
              </Card>
            ) : (
              readyOrders.map((order) => (
                <Card key={order.id} className="p-4 shadow-soft border-l-4 border-l-success">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Mesa {order.table_number} • {order.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                    </div>
                    <Badge className="bg-success">
                      <CheckCircle className="mr-1 h-3 w-3" /> Pronto
                    </Badge>
                  </div>
                  <Button
                    className="w-full"
                    variant={order.notified_at ? "outline" : "default"}
                    onClick={() => notifyCustomer(order.id)}
                    disabled={!!order.notified_at}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {order.notified_at ? "Cliente Notificado" : "Notificar Cliente (WhatsApp)"}
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Cashier;
