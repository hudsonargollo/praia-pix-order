import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notificationTriggers } from "@/integrations/whatsapp";
import { useKitchenOrders } from "@/hooks/useRealtimeOrders";
import { RealtimeNotifications, notificationUtils } from "@/components/RealtimeNotifications";
import { ConnectionMonitor, useConnectionMonitor } from "@/components/ConnectionMonitor";
import { StatusBadge } from "@/components/StatusBadge";
import { UniformHeader } from "@/components/UniformHeader";
import { AutoPrintToggle } from "@/components/AutoPrintToggle";
import { OrderReceipt } from "@/components/printable/OrderReceipt";
import type { PaymentStatus } from "@/components/StatusBadge";
import { fetchAllWaiters, getWaiterName } from "@/lib/waiterUtils";
import { useAutoPrint } from "@/hooks/useAutoPrint";
import { usePrintOrder } from "@/hooks/usePrintOrder";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Clock, ChefHat, Package, Bell, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/integrations/supabase/realtime";

// Order interface is now imported from realtime service

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
}

// Extended Order type with waiter information
interface OrderWithWaiter extends Order {
  waiter?: {
    raw_user_meta_data?: {
      full_name?: string;
    };
  } | null;
}

const Kitchen = () => {
  const [orders, setOrders] = useState<OrderWithWaiter[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Print functionality
  const { printOrder, orderData, printRef } = usePrintOrder();

  // Auto-print functionality
  const { isAutoPrintEnabled, toggleAutoPrint } = useAutoPrint({
    enabled: true,
    onPrint: (orderId) => {
      console.log('Auto-printing order:', orderId);
      printOrder(orderId);
    },
    onError: (error) => {
      console.error('Auto-print error:', error);
      toast.error('Erro na impressão automática');
    }
  });

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
    // Fetch all waiters to populate cache
    fetchAllWaiters();
  }, []);

  const loadOrders = async () => {
    try {
      // Load orders that are in_preparation, ready, or completed
      // Waiter-created orders go directly to in_preparation status (payment_status can be pending)
      // Customer orders need payment confirmation before appearing
      // Include waiter information by joining with auth.users
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          waiter:waiter_id (
            raw_user_meta_data
          )
        `)
        .in("status", ["in_preparation", "ready", "completed"])
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      setOrders((ordersData as unknown as OrderWithWaiter[]) || []);

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
    setProcessingOrders(prev => new Set([...prev, orderId]));
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
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const markAsReady = async (orderId: string) => {
    setProcessingOrders(prev => new Set([...prev, orderId]));
    try {
      // Get current order status
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      const oldStatus = currentOrder?.status;

      // Update order status to ready
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
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const markAsCompleted = async (orderId: string) => {
    setProcessingOrders(prev => new Set([...prev, orderId]));
    try {
      // Update order status to completed
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Pedido finalizado!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao finalizar pedido");
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
    // Don't remove from processing set - keep button disabled
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Pedido cancelado!");
      loadOrders(); // Reload to remove from view
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Erro ao cancelar pedido");
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando pedidos...</p>
      </div>
    );
  }

  // Orders with status 'in_preparation' appear immediately, regardless of payment_status
  // This includes waiter-created orders that go directly to in_preparation
  const newOrders: Order[] = []; // Customer orders start as "paid" but waiter orders start as "in_preparation"
  const inProgressOrders = orders.filter((o) => o.status === "in_preparation");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-background">
      <RealtimeNotifications 
        enabled={true}
        soundEnabled={soundEnabled}
        showToasts={true}
      />
      <ConnectionMonitor />
      {/* Uniform Header */}
      <UniformHeader
        title="Cozinha"
        showConnection={true}
        actions={
          <AutoPrintToggle
            enabled={isAutoPrintEnabled}
            onToggle={toggleAutoPrint}
          />
        }
      />

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {/* New Orders Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg lg:text-xl font-bold">Novos Pedidos</h2>
              <Badge variant="secondary">{newOrders.length}</Badge>
            </div>
            <div className="space-y-4">
              {newOrders.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Bell className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Nenhum pedido novo</p>
                    <p className="text-sm text-gray-500">
                      Novos pedidos pagos aparecerão aqui
                    </p>
                  </div>
                </Card>
              ) : (
                newOrders.map((order) => {
                  const waiterName = order.waiter_id ? getWaiterName(order.waiter_id) : null;
                  return (
                    <Card key={order.id} className="p-4 shadow-medium border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-base lg:text-lg">
                            Pedido #{order.order_number}
                          </h3>
                          <p className="text-xs lg:text-sm text-muted-foreground">
                            {order.customer_name}
                          </p>
                          {waiterName && waiterName !== 'Cliente' && (
                            <p className="text-xs text-blue-600 font-medium">
                              Atendido por: {waiterName}
                            </p>
                          )}
                          {order.payment_status && (
                            <div className="mt-1">
                              <StatusBadge 
                                paymentStatus={order.payment_status as PaymentStatus}
                                compact={true}
                                className="opacity-70"
                              />
                            </div>
                          )}
                        </div>
                        <Badge className="bg-blue-500">
                          {order.status === "paid" ? "Pago" : "Novo"}
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        {orderItems[order.id]?.map((item) => (
                          <div key={item.id} className="text-xs lg:text-sm">
                            <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                          </div>
                        ))}
                      </div>
                      {order.order_notes && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">Observações:</p>
                          <p className="text-xs text-yellow-700">{order.order_notes}</p>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => markAsInPreparation(order.id)}
                        disabled={processingOrders.has(order.id)}
                      >
                        {processingOrders.has(order.id) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Iniciando...
                          </>
                        ) : (
                          <>
                            <ChefHat className="mr-2 h-4 w-4" />
                            Iniciar Preparo
                          </>
                        )}
                      </Button>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg lg:text-xl font-bold">Em Preparo</h2>
              <Badge variant="secondary">{inProgressOrders.length}</Badge>
            </div>
            <div className="space-y-4">
              {inProgressOrders.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Clock className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Nenhum pedido em preparo</p>
                    <p className="text-sm text-gray-500">
                      Pedidos aparecerão aqui quando iniciarem o preparo
                    </p>
                  </div>
                </Card>
              ) : (
                inProgressOrders.map((order) => {
                  const waiterName = order.waiter_id ? getWaiterName(order.waiter_id) : null;
                  return (
                    <Card key={order.id} className="p-4 shadow-medium border-l-4 border-l-primary">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-base lg:text-lg">
                              Pedido #{order.order_number}
                            </h3>
                            {order.waiter_id && waiterName && waiterName !== 'Cliente' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                <User className="h-3 w-3 mr-1" />
                                Garçom
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs lg:text-sm text-muted-foreground">
                            {order.customer_name}
                          </p>
                          {waiterName && waiterName !== 'Cliente' && (
                            <p className="text-xs text-primary font-medium mt-1">
                              Atendido por: {waiterName}
                            </p>
                          )}
                          {order.payment_status && (
                            <div className="mt-1">
                              <StatusBadge 
                                paymentStatus={order.payment_status as PaymentStatus}
                                compact={true}
                                className="opacity-70"
                              />
                            </div>
                          )}
                        </div>
                        <Badge className="bg-primary">Em Preparo</Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        {orderItems[order.id]?.map((item) => (
                          <div key={item.id} className="text-xs lg:text-sm">
                            <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                          </div>
                        ))}
                      </div>
                      {order.order_notes && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">Observações:</p>
                          <p className="text-xs text-yellow-700">{order.order_notes}</p>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => markAsReady(order.id)}
                        disabled={processingOrders.has(order.id)}
                      >
                        {processingOrders.has(order.id) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Marcando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar como Pronto
                          </>
                        )}
                      </Button>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <h2 className="text-lg lg:text-xl font-bold">Pronto</h2>
              <Badge variant="secondary">{readyOrders.length}</Badge>
            </div>
            <div className="space-y-4">
              {readyOrders.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Nenhum pedido pronto</p>
                    <p className="text-sm text-gray-500">
                      Pedidos prontos aparecerão aqui
                    </p>
                  </div>
                </Card>
              ) : (
                readyOrders.map((order) => {
                  const waiterName = order.waiter_id ? getWaiterName(order.waiter_id) : null;
                  return (
                    <Card key={order.id} className="p-4 shadow-medium border-l-4 border-l-success bg-success/5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-base lg:text-lg">
                              Pedido #{order.order_number}
                            </h3>
                            {order.waiter_id && waiterName && waiterName !== 'Cliente' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                <User className="h-3 w-3 mr-1" />
                                Garçom
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs lg:text-sm text-muted-foreground">
                            {order.customer_name}
                          </p>
                          {waiterName && waiterName !== 'Cliente' && (
                            <p className="text-xs text-success font-medium mt-1">
                              Atendido por: {waiterName}
                            </p>
                          )}
                          {order.payment_status && (
                            <div className="mt-1">
                              <StatusBadge 
                                paymentStatus={order.payment_status as PaymentStatus}
                                compact={true}
                                className="opacity-70"
                              />
                            </div>
                          )}
                        </div>
                        <Badge className="bg-success">Pronto</Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        {orderItems[order.id]?.map((item) => (
                          <div key={item.id} className="text-xs lg:text-sm">
                            <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                          </div>
                        ))}
                      </div>
                      {order.order_notes && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">Observações:</p>
                          <p className="text-xs text-yellow-700">{order.order_notes}</p>
                        </div>
                      )}
                      {order.status === 'completed' || processingOrders.has(order.id) ? (
                        <div className="w-full p-3 bg-green-100 border-2 border-green-500 rounded text-center font-bold text-green-700 text-sm">
                          ✓ FINALIZADO
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => markAsCompleted(order.id)}
                          disabled={processingOrders.has(order.id)}
                        >
                          {processingOrders.has(order.id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Finalizando...
                            </>
                          ) : (
                            <>
                              <Package className="mr-2 h-4 w-4" />
                              Finalizar
                            </>
                          )}
                        </Button>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden OrderReceipt component for printing */}
      {orderData && (
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            <OrderReceipt
              order={orderData.order}
              items={orderData.items}
              waiterName={orderData.waiterName}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Kitchen;
