import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
}

const Kitchen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();

    // Subscribe to order changes
    const channel = supabase
      .channel('kitchen-orders')
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
      // Load orders that are paid
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["payment_confirmed", "ready"])
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);

      // Load items for each order
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map((o) => o.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (itemsError) throw itemsError;

        const itemsByOrder: Record<string, OrderItem[]> = {};
        itemsData?.forEach((item) => {
          if (!itemsByOrder[item.order_id]) {
            itemsByOrder[item.order_id] = [];
          }
          itemsByOrder[item.order_id].push(item);
        });

        setOrderItems(itemsByOrder);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const markAsReady = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "ready",
          ready_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Pedido marcado como pronto!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar pedido");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando pedidos...</p>
      </div>
    );
  }

  const inProgressOrders = orders.filter((o) => o.status === "payment_confirmed");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-acai text-white p-6 shadow-medium">
        <h1 className="text-3xl font-bold">Cozinha</h1>
        <p className="text-white/90 mt-1">Sistema de Gerenciamento de Pedidos</p>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* In Progress Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Em Preparo</h2>
              <Badge variant="secondary">{inProgressOrders.length}</Badge>
            </div>
            <div className="space-y-4">
              {inProgressOrders.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  Nenhum pedido em preparo
                </Card>
              ) : (
                inProgressOrders.map((order) => (
                  <Card key={order.id} className="p-4 shadow-medium border-l-4 border-l-primary">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          Pedido #{order.order_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Mesa {order.table_number} • {order.customer_name}
                        </p>
                      </div>
                      <Badge className="bg-primary">Em Preparo</Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      {orderItems[order.id]?.map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => markAsReady(order.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como Pronto
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <h2 className="text-xl font-bold">Pronto para Retirada</h2>
              <Badge variant="secondary">{readyOrders.length}</Badge>
            </div>
            <div className="space-y-4">
              {readyOrders.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  Nenhum pedido pronto
                </Card>
              ) : (
                readyOrders.map((order) => (
                  <Card key={order.id} className="p-4 shadow-medium border-l-4 border-l-success bg-success/5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          Pedido #{order.order_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Mesa {order.table_number} • {order.customer_name}
                        </p>
                      </div>
                      <Badge className="bg-success">Pronto</Badge>
                    </div>
                    <div className="space-y-2">
                      {orderItems[order.id]?.map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kitchen;
