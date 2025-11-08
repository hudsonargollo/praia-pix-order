import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notificationTriggers } from "@/integrations/whatsapp";
import { useKitchenOrders } from "@/hooks/useRealtimeOrders";
import { RealtimeNotifications, notificationUtils } from "@/components/RealtimeNotifications";
import { ConnectionMonitor, useConnectionMonitor } from "@/components/ConnectionMonitor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ChefHat, Package, Bell, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/integrations/supabase/realtime";

// Order interface is now imported from realtime service

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
}

const Kitchen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Real-time order updates
  const handleNewPaidOrder = useCallback((order: Order) => {
    console.log('New paid order received:', order);
    setNewOrderIds(prev => new Set([...prev, order.id]));
    
    // Show notification
    notificationUtils.paymentConfirmed(order.order_number, order.customer_phone);
    
    // Reload orders to get the latest data with items
    loadOrders();
  }, []);

  const handleOrderStatusChange = useCallback((order: Order) => {
    console.log('Order status changed:', order);
    
    // Update the order in the current list
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === order.id ? order : o)
    );
    
    // Show appropriate notification based on status
    switch (order.status) {
      case 'in_preparation':
        notificationUtils.orderInPreparation(order.order_number, order.customer_phone);
        break;
      case 'ready':
        notificationUtils.orderReady(order.order_number, order.customer_phone);
        break;
      case 'completed':
        notificationUtils.orderCompleted(order.order_number, order.customer_phone);
        break;
    }
    
    // Remove from new orders set if status changed from paid
    if (order.status !== 'paid') {
      setNewOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  }, []);

  const { connectionStatus, reconnect } = useConnectionMonitor();
  
  useKitchenOrders({
    onNewPaidOrder: handleNewPaidOrder,
    onOrderStatusChange: handleOrderStatusChange,
    enabled: true
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      // Load orders that are paid or in progress (paid, in_preparation, ready)
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["paid", "in_preparation", "ready"])
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

  const markAsInPreparation = async (orderId: string) => {
    try {
      // Get current order status
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      const oldStatus = currentOrder?.status;

      const { error } = await supabase
        .from("orders")
        .update({
          status: "in_preparation",
        })
        .eq("id", orderId);

      if (error) throw error;

      // Trigger WhatsApp preparing notification
      await notificationTriggers.onOrderStatusChange(orderId, "in_preparation", oldStatus);

      toast.success("Pedido marcado como em preparo!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar pedido");
    }
  };

  const markAsReady = async (orderId: string) => {
    try {
      // Get current order status
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      const oldStatus = currentOrder?.status;

      const { error } = await supabase
        .from("orders")
        .update({
          status: "ready",
          ready_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Trigger WhatsApp ready notification
      await notificationTriggers.onOrderStatusChange(orderId, "ready", oldStatus);

      toast.success("Pedido marcado como pronto!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar pedido");
    }
  };

  const markAsCompleted = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Pedido finalizado!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao finalizar pedido");
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando pedidos...</p>
      </div>
    );
  }

  const inProgressOrders = orders.filter((o) => o.status === "paid" || o.status === "in_preparation");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-background">
      <RealtimeNotifications 
        enabled={true}
        soundEnabled={soundEnabled}
        showToasts={true}
      />
      <ConnectionMonitor />
      {/* Header */}
      <div className="bg-gradient-acai text-white p-6 shadow-medium">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Cozinha</h1>
            <p className="text-white/90 mt-1">Sistema de Gerenciamento de Pedidos</p>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <div className="flex items-center gap-1 text-green-200">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Online</span>
              </div>
            ) : connectionStatus === 'connecting' ? (
              <div className="flex items-center gap-1 text-yellow-200">
                <Wifi className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Conectando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-200">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">Offline</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="ml-2 text-white border-white/20 hover:bg-white/10"
                >
                  Reconectar
                </Button>
              </div>
            )}
          </div>
        </div>
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
                          {order.customer_phone} • {order.customer_name}
                        </p>
                      </div>
                      <Badge className={order.status === "paid" ? "bg-blue-500" : "bg-primary"}>
                        {order.status === "paid" ? "Pago" : "Em Preparo"}
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      {orderItems[order.id]?.map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {order.status === "paid" && (
                        <Button
                          className="w-full"
                          onClick={() => markAsInPreparation(order.id)}
                        >
                          <ChefHat className="mr-2 h-4 w-4" />
                          Iniciar Preparo
                        </Button>
                      )}
                      {order.status === "in_preparation" && (
                        <Button
                          className="w-full"
                          onClick={() => markAsReady(order.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Pronto
                        </Button>
                      )}
                    </div>
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
                          {order.customer_phone} • {order.customer_name}
                        </p>
                      </div>
                      <Badge className="bg-success">Pronto</Badge>
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
                      variant="outline"
                      onClick={() => markAsCompleted(order.id)}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Finalizar Pedido
                    </Button>
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
