import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notificationTriggers } from "@/integrations/whatsapp";
import { useCashierOrders } from "@/hooks/useRealtimeOrders";
import { useNotificationHistory } from "@/hooks/useNotificationHistory";
import { RealtimeNotifications, notificationUtils } from "@/components/RealtimeNotifications";
import { ConnectionMonitor, useConnectionMonitor } from "@/components/ConnectionMonitor";
import { NotificationControls } from "@/components/NotificationControls";
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
import { CreditCard, Clock, CheckCircle, Bell, AlertCircle, Timer, DollarSign, ChefHat, Package, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/integrations/supabase/realtime";

// Order interface is now imported from realtime service

const Cashier = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
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
          status: "paid",
          payment_confirmed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Trigger WhatsApp payment confirmation notification
      await notificationTriggers.onPaymentConfirmed(orderId);

      toast.success("Pagamento confirmado!");
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

  return (
    <div className="min-h-screen bg-background">
      <RealtimeNotifications 
        enabled={true}
        soundEnabled={true}
        showToasts={true}
      />
      <ConnectionMonitor />
      {/* Header */}
      <div className="bg-gradient-sunset text-white p-6 shadow-medium">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Caixa</h1>
            <p className="text-white/90 mt-1">Painel de Controle</p>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aguardando</p>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Em Preparo</p>
                <p className="text-2xl font-bold">{inProgressOrders.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Prontos</p>
                <p className="text-2xl font-bold">{readyOrders.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hoje</p>
                <p className="text-2xl font-bold">
                  R$ {orders.filter(o => o.payment_confirmed_at).reduce((sum, o) => sum + Number(o.total_amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all">
              Todos <Badge className="ml-2">{orders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Aguardando <Badge className="ml-2">{pendingOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="progress">
              Em Preparo <Badge className="ml-2">{inProgressOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="ready">
              Pronto <Badge className="ml-2">{readyOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluído <Badge className="ml-2">{completedOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {orders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum pedido encontrado
              </Card>
            ) : (
              orders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                const orderNotificationHistory = notificationHistory.get(order.id);
                
                return (
                  <Card key={order.id} className="p-4 shadow-soft">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.customer_phone}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Criado: {formatTimestamp(order.created_at)}
                          </p>
                          {order.payment_confirmed_at && (
                            <p className="text-xs text-muted-foreground">
                              Pago: {formatTimestamp(order.payment_confirmed_at)}
                            </p>
                          )}
                          {order.ready_at && (
                            <p className="text-xs text-muted-foreground">
                              Pronto: {formatTimestamp(order.ready_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={paymentStatus.variant} className="mb-2">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <Badge className="mb-2 block" variant={
                          order.status === 'completed' ? 'default' : 
                          order.status === 'ready' ? 'default' : 
                          order.status === 'in_preparation' || order.status === 'paid' ? 'secondary' : 
                          'outline'
                        }>
                          {order.status === 'pending_payment' && 'Aguardando Pagamento'}
                          {order.status === 'paid' && 'Pago'}
                          {order.status === 'in_preparation' && 'Em Preparo'}
                          {order.status === 'ready' && 'Pronto'}
                          {order.status === 'completed' && 'Concluído'}
                        </Badge>
                        <p className="font-bold text-primary">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Show notification controls for paid and ready orders */}
                    {(order.status === 'paid' || order.status === 'in_preparation' || order.status === 'ready') && (
                      <div className="border-t pt-3 mt-3">
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
                    )}
                  </Card>
                );
              })
            )}
          </TabsContent>

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
                  <Card key={order.id} className="p-4 shadow-soft">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_phone} • {order.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Criado: {formatTimestamp(order.created_at)}
                        </p>
                        {order.mercadopago_payment_id && (
                          <p className="text-xs text-muted-foreground">
                            ID Pagamento: {order.mercadopago_payment_id}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={paymentStatus.variant} className="mb-2">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <p className="font-bold text-primary">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                        {paymentStatus.timestamp && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {paymentStatus.status === 'pending' ? 'Expira:' : 'Confirmado:'} {formatTimestamp(paymentStatus.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => confirmPayment(order.id)}
                        disabled={paymentStatus.status === 'confirmed'}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        {paymentStatus.status === 'confirmed' ? 'Pagamento Confirmado' : 'Confirmar Pagamento PIX'}
                      </Button>
                      {paymentStatus.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'in_preparation')}
                        >
                          <ChefHat className="mr-2 h-4 w-4" />
                          Enviar p/ Cozinha
                        </Button>
                      )}
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
                  <Card key={order.id} className="p-4 shadow-soft">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.customer_phone}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Criado: {formatTimestamp(order.created_at)}
                          </p>
                          {order.payment_confirmed_at && (
                            <p className="text-xs text-muted-foreground">
                              Pago: {formatTimestamp(order.payment_confirmed_at)}
                            </p>
                          )}
                          {order.kitchen_notified_at && (
                            <p className="text-xs text-muted-foreground">
                              Cozinha notificada: {formatTimestamp(order.kitchen_notified_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={paymentStatus.variant} className="mb-2">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <Badge className="bg-primary mb-2 block">
                          <Clock className="mr-1 h-3 w-3" /> {order.status === 'paid' ? 'Pago' : 'Em Preparo'}
                        </Badge>
                        <p className="font-bold text-primary">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Notification Controls */}
                    <div className="border-t pt-3 mb-3">
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
                    
                    <div className="flex gap-2">
                      {order.status === 'paid' && (
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'in_preparation')}
                        >
                          <ChefHat className="mr-2 h-4 w-4" />
                          Iniciar Preparo
                        </Button>
                      )}
                      {order.status === 'in_preparation' && (
                        <Button
                          className="flex-1"
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Marcar como Pronto
                        </Button>
                      )}
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
                  <Card key={order.id} className="p-4 shadow-soft border-l-4 border-l-success">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.customer_phone}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Criado: {formatTimestamp(order.created_at)}
                          </p>
                          {order.payment_confirmed_at && (
                            <p className="text-xs text-muted-foreground">
                              Pago: {formatTimestamp(order.payment_confirmed_at)}
                            </p>
                          )}
                          {order.ready_at && (
                            <p className="text-xs text-muted-foreground">
                              Pronto: {formatTimestamp(order.ready_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={paymentStatus.variant} className="mb-2">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <Badge className="bg-success mb-2 block">
                          <CheckCircle className="mr-1 h-3 w-3" /> Pronto
                        </Badge>
                        <p className="font-bold text-primary">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Notification Controls */}
                    <div className="border-t pt-3 mb-3">
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
                    
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
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
                            <AlertDialogAction onClick={() => completeOrder(order.id)}>
                              Sim, Concluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                  <Card key={order.id} className="p-4 shadow-soft border-l-4 border-l-muted">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_phone} • {order.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Criado: {formatTimestamp(order.created_at)}
                          </p>
                          {order.payment_confirmed_at && (
                            <p className="text-xs text-muted-foreground">
                              Pago: {formatTimestamp(order.payment_confirmed_at)}
                            </p>
                          )}
                          {order.ready_at && (
                            <p className="text-xs text-muted-foreground">
                              Pronto: {formatTimestamp(order.ready_at)}
                            </p>
                          )}
                          {order.notified_at && (
                            <p className="text-xs text-muted-foreground">
                              Cliente notificado: {formatTimestamp(order.notified_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={paymentStatus.variant} className="mb-2">
                          <PaymentIcon className="mr-1 h-3 w-3" /> {paymentStatus.label}
                        </Badge>
                        <Badge className="mb-2 block">
                          <CheckCircle className="mr-1 h-3 w-3" /> Concluído
                        </Badge>
                        <p className="font-bold text-primary">
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
    </div>
  );
};

export default Cashier;
