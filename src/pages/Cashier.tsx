import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notificationTriggers } from "@/integrations/whatsapp";
import { useCashierOrders } from "@/hooks/useRealtimeOrders";
import { useNotificationHistory } from "@/hooks/useNotificationHistory";
import { RealtimeNotifications, notificationUtils } from "@/components/RealtimeNotifications";
import { ConnectionMonitor, useConnectionMonitor } from "@/components/ConnectionMonitor";
import { NotificationControls } from "@/components/NotificationControls";
import { OrderDetailsDialog } from "@/components/OrderDetailsDialog";
import { OrderEditDialog } from "@/components/OrderEditDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Clock, CheckCircle, Bell, AlertCircle, Timer, DollarSign, ChefHat, Package, Wifi, WifiOff, Eye, Edit, BarChart3, X } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/integrations/supabase/realtime";

// Order interface is now imported from realtime service

const Cashier = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  // Load notification history for all orders
  const orderIds = orders.map(o => o.id);
  const { history: notificationHistory, refresh: refreshNotifications } = useNotificationHistory(orderIds);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Real-time order updates
  const handleOrderCreated = useCallback((order: Order) => {
    console.log('New order created:', order);
    setOrders(prevOrders => [order, ...prevOrders]);
    notificationUtils.newOrder(order.order_number, order.customer_phone);
  }, []);

  const handleOrderUpdate = useCallback((order: Order) => {
    console.log('Order updated:', order);
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === order.id ? order : o)
    );
    
    // Show appropriate notification based on status change
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
  }, []);

  const handlePaymentConfirmed = useCallback((order: Order) => {
    console.log('Payment confirmed for order:', order);
    notificationUtils.paymentConfirmed(order.order_number, order.customer_phone);
  }, []);

  const { connectionStatus, reconnect } = useConnectionMonitor();
  
  useCashierOrders({
    onOrderCreated: handleOrderCreated,
    onOrderUpdate: handleOrderUpdate,
    onPaymentConfirmed: handlePaymentConfirmed,
    enabled: true
  });

  const getPaymentStatus = (order: Order) => {
    if (order.payment_confirmed_at) {
      return {
        status: 'confirmed',
        label: 'Pagamento Confirmado',
        icon: CheckCircle,
        variant: 'default' as const,
        timestamp: order.payment_confirmed_at,
      };
    }
    
    if (order.payment_expires_at && new Date(order.payment_expires_at) < new Date()) {
      return {
        status: 'expired',
        label: 'Pagamento Expirado',
        icon: AlertCircle,
        variant: 'destructive' as const,
        timestamp: order.payment_expires_at,
      };
    }
    
    if (order.mercadopago_payment_id) {
      return {
        status: 'pending',
        label: 'Aguardando Pagamento PIX',
        icon: Timer,
        variant: 'outline' as const,
        timestamp: order.payment_expires_at,
      };
    }
    
    return {
      status: 'no_payment',
      label: 'Sem Pagamento Gerado',
      icon: CreditCard,
      variant: 'secondary' as const,
      timestamp: null,
    };
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .is("deleted_at", null) // Only load non-deleted orders
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (orderId: string) => {
    try {
      // Update order status to paid and send to kitchen
      const { error } = await supabase
        .from("orders")
        .update({
          status: "in_preparation",
          payment_confirmed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Trigger WhatsApp payment confirmation notification
      await notificationTriggers.onPaymentConfirmed(orderId);

      toast.success("Pagamento confirmado! Pedido enviado para a cozinha.");
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("Erro ao confirmar pagamento");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Get current order status for comparison
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      const oldStatus = currentOrder?.status;

      const updateData: { status: string; ready_at?: string } = {
        status: newStatus,
      };

      // Add timestamp for specific status changes
      if (newStatus === 'ready') {
        updateData.ready_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      // Trigger WhatsApp notification based on status change
      await notificationTriggers.onOrderStatusChange(orderId, newStatus, oldStatus);

      const statusLabels: { [key: string]: string } = {
        'in_preparation': 'Em Preparo',
        'ready': 'Pronto',
        'completed': 'Concluído',
      };

      toast.success(`Status do pedido atualizado para: ${statusLabels[newStatus] || newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Erro ao atualizar status do pedido");
    }
  };

  const completeOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Pedido marcado como concluído!");
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Erro ao concluir pedido");
    }
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
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Erro ao cancelar pedido");
    }
  };

  const softDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
        })
        .eq("id", orderId);

      if (error) throw error;

      // Remove from local state
      setOrders(orders.filter(o => o.id !== orderId));
      toast.success("Pedido removido!");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Erro ao remover pedido");
    }
  };

  const notifyCustomer = async (orderId: string) => {
    try {
      // Trigger WhatsApp ready notification
      await notificationTriggers.onOrderReady(orderId);

      const { error } = await supabase
        .from("orders")
        .update({
          notified_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Cliente notificado via WhatsApp!");
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
  const inProgressOrders = orders.filter((o) => o.status === "paid" || o.status === "in_preparation");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter((o) => o.status === "completed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled" || o.status === "expired");

  return (
    <div className="min-h-screen bg-background">
      <RealtimeNotifications 
        enabled={true}
        soundEnabled={true}
        showToasts={true}
      />
      <ConnectionMonitor />
      {/* Header */}
      <div className="bg-gradient-sunset text-white p-4 sm:p-6 shadow-medium">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">Gerente</h1>
              <p className="text-white/90 mt-1 text-sm sm:text-base">Painel de Gerenciamento</p>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <div className="flex items-center gap-1 text-green-200">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Online</span>
                </div>
              ) : connectionStatus === 'connecting' ? (
                <div className="flex items-center gap-1 text-yellow-200">
                  <Wifi className="h-4 w-4 animate-pulse" />
                  <span className="text-xs sm:text-sm hidden sm:inline">Conectando...</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 text-red-200">
                  <div className="flex items-center gap-1">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Offline</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reconnect}
                    className="text-xs text-white border-white/20 hover:bg-white/10 min-h-[32px]"
                  >
                    Reconectar
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => window.location.href = '/reports'}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              size="sm"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/products'}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              size="sm"
            >
              <Package className="mr-2 h-4 w-4" />
              Gerenciar Produtos
            </Button>
            <Button
              onClick={() => window.location.href = '/whatsapp-admin'}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              size="sm"
            >
              <Bell className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => (document.querySelector('[value="pending"]') as HTMLElement)?.click()}>
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Aguardando</p>
                <p className="text-xl sm:text-2xl font-bold">{pendingOrders.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => (document.querySelector('[value="progress"]') as HTMLElement)?.click()}>
            <div className="flex items-center space-x-2">
              <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Em Preparo</p>
                <p className="text-xl sm:text-2xl font-bold">{inProgressOrders.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => (document.querySelector('[value="ready"]') as HTMLElement)?.click()}>
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Prontos</p>
                <p className="text-xl sm:text-2xl font-bold">{readyOrders.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Hoje</p>
                <p className="text-base sm:text-xl font-bold truncate">
                  R$ {orders.filter(o => o.payment_confirmed_at && new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + Number(o.total_amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-6 h-auto">
            <TabsTrigger value="pending" className="text-xs sm:text-sm py-3 flex-col sm:flex-row gap-1">
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                <span className="hidden sm:inline">Aguardando Pagamento</span>
                <span className="sm:hidden">Aguard.</span>
              </div>
              <Badge variant={pendingOrders.length > 0 ? "destructive" : "secondary"} className="text-xs">
                {pendingOrders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm py-3 flex-col sm:flex-row gap-1">
              <div className="flex items-center gap-1">
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline">Em Preparo</span>
                <span className="sm:hidden">Preparo</span>
              </div>
              <Badge variant={inProgressOrders.length > 0 ? "default" : "secondary"} className="text-xs">
                {inProgressOrders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-xs sm:text-sm py-3 flex-col sm:flex-row gap-1">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Pronto para Retirada</span>
                <span className="sm:hidden">Pronto</span>
              </div>
              <Badge variant={readyOrders.length > 0 ? "default" : "secondary"} className="text-xs">
                {readyOrders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm py-3 flex-col sm:flex-row gap-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Concluído</span>
                <span className="sm:hidden">Concl.</span>
              </div>
              <Badge variant="secondary" className="text-xs">{completedOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm py-3 flex-col sm:flex-row gap-1">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Cancelados</span>
                <span className="sm:hidden">Canc.</span>
              </div>
              <Badge variant="secondary" className="text-xs">{cancelledOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido aguardando pagamento
              </Card>
            ) : (
              pendingOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                
                return (
                  <Card key={order.id} className="p-4 sm:p-6 shadow-soft">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg sm:text-xl mb-1">Pedido #{order.order_number}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-2">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          📱 {order.customer_phone}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Criado: {formatTimestamp(order.created_at)}
                        </p>
                        {order.mercadopago_payment_id && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            ID: {order.mercadopago_payment_id.substring(0, 20)}...
                          </p>
                        )}
                      </div>
                      <div className="flex sm:flex-col gap-2 sm:text-right">
                        <Badge variant={paymentStatus.variant} className="whitespace-nowrap">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <p className="font-bold text-lg sm:text-xl text-primary whitespace-nowrap">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                        {paymentStatus.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            {paymentStatus.status === 'pending' ? 'Expira:' : 'Confirmado:'} {formatTimestamp(paymentStatus.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="border-t pt-3 space-y-2">
                      {/* Edit and Cancel Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOrderId(order.id);
                            setIsEditDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 text-destructive hover:bg-destructive hover:text-white">
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja cancelar o pedido #{order.order_number}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Não</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelOrder(order.id)} className="bg-destructive">
                                Sim, Cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Payment Confirmation Button */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          className="flex-1 min-h-[44px] text-base"
                          onClick={() => confirmPayment(order.id)}
                          disabled={paymentStatus.status === 'confirmed'}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          {paymentStatus.status === 'confirmed' ? 'Pagamento Confirmado' : 'Confirmar Pagamento PIX'}
                        </Button>
                        {paymentStatus.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            className="min-h-[44px] text-base"
                            onClick={() => updateOrderStatus(order.id, 'in_preparation')}
                          >
                            <ChefHat className="mr-2 h-4 w-4" />
                            Enviar p/ Cozinha
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {inProgressOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido em preparo
              </Card>
            ) : (
              inProgressOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                const orderNotificationHistory = notificationHistory.get(order.id);
                
                return (
                  <Card key={order.id} className="p-4 sm:p-6 shadow-soft">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg sm:text-xl mb-1">Pedido #{order.order_number}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-2">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          📱 {order.customer_phone}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Criado: {formatTimestamp(order.created_at)}
                          </p>
                          {order.payment_confirmed_at && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Pago: {formatTimestamp(order.payment_confirmed_at)}
                            </p>
                          )}
                          {order.kitchen_notified_at && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Cozinha notificada: {formatTimestamp(order.kitchen_notified_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 sm:text-right">
                        <Badge variant={paymentStatus.variant} className="whitespace-nowrap">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <Badge className="bg-primary whitespace-nowrap">
                          <Clock className="mr-1 h-3 w-3" /> {order.status === 'paid' ? 'Pago' : 'Em Preparo'}
                        </Badge>
                        <p className="font-bold text-lg sm:text-xl text-primary whitespace-nowrap">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="border-t pt-3 space-y-2">
                      {/* Edit and Cancel Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOrderId(order.id);
                            setIsEditDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 text-destructive hover:bg-destructive hover:text-white">
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja cancelar o pedido #{order.order_number}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Não</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelOrder(order.id)} className="bg-destructive">
                                Sim, Cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Notification Controls */}
                      <div className="border-t pt-2">
                        <NotificationControls
                          orderId={order.id}
                          orderNumber={order.order_number}
                          customerPhone={order.customer_phone}
                          customerName={order.customer_name}
                          orderStatus={order.status}
                          notificationHistory={orderNotificationHistory}
                          onNotificationSent={refreshNotifications}
                        />
                      </div>

                      {/* Status Update Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {order.status === 'paid' && (
                          <Button
                            className="flex-1 min-h-[44px] text-base"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'in_preparation')}
                          >
                            <ChefHat className="mr-2 h-4 w-4" />
                            Iniciar Preparo
                          </Button>
                        )}
                        {order.status === 'in_preparation' && (
                          <Button
                            className="flex-1 min-h-[44px] text-base"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Marcar como Pronto
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            {readyOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido pronto
              </Card>
            ) : (
              readyOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                const orderNotificationHistory = notificationHistory.get(order.id);
                
                return (
                  <Card key={order.id} className="p-4 sm:p-6 shadow-soft border-l-4 border-l-success">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg sm:text-xl mb-1">Pedido #{order.order_number}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-2">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          📱 {order.customer_phone}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Criado: {formatTimestamp(order.created_at)}
                          </p>
                          {order.payment_confirmed_at && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Pago: {formatTimestamp(order.payment_confirmed_at)}
                            </p>
                          )}
                          {order.ready_at && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Pronto: {formatTimestamp(order.ready_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 sm:text-right">
                        <Badge variant={paymentStatus.variant} className="whitespace-nowrap">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <Badge className="bg-success whitespace-nowrap">
                          <CheckCircle className="mr-1 h-3 w-3" /> Pronto
                        </Badge>
                        <p className="font-bold text-lg sm:text-xl text-primary whitespace-nowrap">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="border-t pt-3 space-y-2">
                      {/* Edit and Cancel Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOrderId(order.id);
                            setIsEditDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 text-destructive hover:bg-destructive hover:text-white">
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja cancelar o pedido #{order.order_number}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Não</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelOrder(order.id)} className="bg-destructive">
                                Sim, Cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Message and Complete Buttons */}
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="flex-1 min-h-[44px] text-base bg-blue-600 hover:bg-blue-700">
                              <Bell className="mr-2 h-4 w-4" />
                              Mensagem
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Notificações - Pedido #{order.order_number}</DialogTitle>
                            </DialogHeader>
                            <NotificationControls
                              orderId={order.id}
                              orderNumber={order.order_number}
                              customerPhone={order.customer_phone}
                              customerName={order.customer_name}
                              orderStatus={order.status}
                              notificationHistory={orderNotificationHistory}
                              onNotificationSent={refreshNotifications}
                            />
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="flex-1 min-h-[44px] text-base bg-green-600 hover:bg-green-700">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Concluir Pedido
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Concluir Pedido</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja marcar o pedido #{order.order_number} como concluído? 
                                Esta ação indica que o cliente retirou o pedido.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => completeOrder(order.id)} className="bg-green-600">
                                Sim, Concluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido concluído
              </Card>
            ) : (
              completedOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                
                return (
                  <Card key={order.id} className="p-4 sm:p-6 shadow-soft border-l-4 border-l-muted">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg sm:text-xl mb-1">Pedido #{order.order_number}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-2">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          📱 {order.customer_phone}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Criado: {formatTimestamp(order.created_at)}
                          </p>
                          {order.payment_confirmed_at && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Pago: {formatTimestamp(order.payment_confirmed_at)}
                            </p>
                          )}
                          {order.ready_at && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Pronto: {formatTimestamp(order.ready_at)}
                            </p>
                          )}
                          {order.notified_at && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Cliente notificado: {formatTimestamp(order.notified_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 sm:text-right">
                        <Badge variant={paymentStatus.variant} className="whitespace-nowrap">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <Badge className="whitespace-nowrap">
                          <CheckCircle className="mr-1 h-3 w-3" /> Concluído
                        </Badge>
                        <p className="font-bold text-lg sm:text-xl text-primary whitespace-nowrap">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido cancelado
              </Card>
            ) : (
              cancelledOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                
                return (
                  <Card key={order.id} className="p-4 shadow-soft border-l-4 border-l-destructive opacity-60">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.customer_phone}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Criado: {formatTimestamp(order.created_at)}
                          </p>
                          {order.cancelled_at && (
                            <p className="text-xs text-muted-foreground">
                              Cancelado: {formatTimestamp(order.cancelled_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="mb-2">
                          <AlertCircle className="mr-1 h-3 w-3" /> {order.status === 'expired' ? 'Expirado' : 'Cancelado'}
                        </Badge>
                        <p className="font-bold text-muted-foreground">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onOrderUpdated={loadOrders}
      />

      {/* Order Edit Dialog */}
      <OrderEditDialog
        orderId={editingOrderId}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingOrderId(null);
          }
        }}
        onOrderUpdated={loadOrders}
      />
    </div>
  );
};

export default Cashier;
