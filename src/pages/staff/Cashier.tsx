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
import { OrderCardInfo } from "@/components/OrderCardInfo";
import { fetchAllWaiters, getWaiterName, type WaiterInfo } from "@/lib/waiterUtils";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CreditCard, Clock, CheckCircle, Bell, AlertCircle, Timer, DollarSign, ChefHat, Package, Wifi, WifiOff, Eye, Edit, BarChart3, X, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Order } from "@/integrations/supabase/realtime";
import logo from "@/assets/coco-loko-logo.png";

// Order interface is now imported from realtime service

const Cashier = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(() => {
    // Restore filter from localStorage on mount
    const saved = localStorage.getItem('cashier_waiter_filter');
    return saved || null;
  });
  const [waiters, setWaiters] = useState<WaiterInfo[]>([]);
  
  // Load notification history for all orders
  const orderIds = orders.map(o => o.id);
  const { history: notificationHistory, refresh: refreshNotifications } = useNotificationHistory(orderIds);

  // Persist waiter filter selection to localStorage
  useEffect(() => {
    if (selectedWaiterId) {
      localStorage.setItem('cashier_waiter_filter', selectedWaiterId);
    } else {
      localStorage.removeItem('cashier_waiter_filter');
    }
  }, [selectedWaiterId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

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
    
    // Apply waiter filter to real-time updates
    if (selectedWaiterId && order.waiter_id !== selectedWaiterId) {
      console.log('Order filtered out by waiter filter:', order.id);
      return;
    }
    
    setOrders(prevOrders => [order, ...prevOrders]);
    notificationUtils.newOrder(order.order_number, order.customer_phone);
  }, [selectedWaiterId]);

  const handleOrderUpdate = useCallback((order: Order) => {
    console.log('Order updated:', order);
    
    // Apply waiter filter to real-time updates
    if (selectedWaiterId && order.waiter_id !== selectedWaiterId) {
      // If order was previously in the list but now doesn't match filter, remove it
      setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
      return;
    }
    
    setOrders(prevOrders => {
      const existingIndex = prevOrders.findIndex(o => o.id === order.id);
      if (existingIndex >= 0) {
        // Update existing order
        return prevOrders.map(o => o.id === order.id ? order : o);
      } else {
        // Add new order if it matches the filter
        return [order, ...prevOrders];
      }
    });
    
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
  }, [selectedWaiterId]);

  const handlePaymentConfirmed = useCallback((order: Order) => {
    console.log('Payment confirmed for order:', order);
    
    // Apply waiter filter to real-time updates
    if (selectedWaiterId && order.waiter_id !== selectedWaiterId) {
      return;
    }
    
    notificationUtils.paymentConfirmed(order.order_number, order.customer_phone);
  }, [selectedWaiterId]);

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
    // Fetch all waiters to populate cache and dropdown
    loadWaiters();
  }, [selectedWaiterId]); // Re-load orders when waiter filter changes

  const loadWaiters = async () => {
    const waitersList = await fetchAllWaiters();
    setWaiters(waitersList);
  };

  const loadOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select("*")
        .is("deleted_at", null) // Only load non-deleted orders
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply waiter filter if selected
      if (selectedWaiterId) {
        query = query.eq("waiter_id", selectedWaiterId);
      }

      const { data, error } = await query;

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

  // Calculate order counts based on orders (already filtered by waiter if selected)
  // Include both "pending_payment" (customer orders) and "pending" (waiter orders)
  const pendingOrders = orders.filter((o) => o.status === "pending_payment" || o.status === "pending");
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
      {/* Header - Desktop: Solid color with logo, Mobile: Gradient */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 lg:bg-orange-500 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            {/* Desktop Layout */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              {/* Left: Logo */}
              <div className="flex items-center">
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="Coco Loko" 
                    className="h-20 w-auto"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Center: Action Buttons and Waiter Filter */}
              <div className="flex gap-2 items-center">
                {/* Waiter Filter */}
                <Select
                  value={selectedWaiterId || "all"}
                  onValueChange={(value) => setSelectedWaiterId(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[200px] bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300">
                    <SelectValue placeholder="Todos os Garçons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Garçons</SelectItem>
                    {waiters.map((waiter) => (
                      <SelectItem key={waiter.id} value={waiter.id}>
                        {waiter.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => window.location.href = '/reports'}
                  className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  size="sm"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Relatórios
                </Button>
                <Button
                  onClick={() => window.location.href = '/admin/products'}
                  className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  size="sm"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Produtos
                </Button>
                <Button
                  onClick={() => window.location.href = '/whatsapp-admin'}
                  className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  size="sm"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>

              {/* Right: Connection Status & Logout */}
              <div className="flex items-center gap-3">
                {connectionStatus === 'connected' ? (
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full">
                    <Wifi className="h-4 w-4 text-green-200" />
                    <span className="text-sm text-green-200 font-medium">Online</span>
                  </div>
                ) : connectionStatus === 'connecting' ? (
                  <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full">
                    <Wifi className="h-4 w-4 animate-pulse text-yellow-200" />
                    <span className="text-sm text-yellow-200 font-medium">Conectando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full">
                      <WifiOff className="h-4 w-4 text-red-200" />
                      <span className="text-sm text-red-200 font-medium">Offline</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reconnect}
                      className="text-xs text-white border-white/30 hover:bg-white/10"
                    >
                      Reconectar
                    </Button>
                  </div>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 transition-all duration-300 hover:scale-105"
                  size="sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>

            {/* Mobile/Tablet Layout */}
            <div className="lg:hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                  <div className="relative">
                    <img 
                      src={logo} 
                      alt="Coco Loko" 
                      className="h-12 sm:h-16 w-auto drop-shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Connection Status */}
                <div className="flex items-center gap-3">
                  {connectionStatus === 'connected' ? (
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Wifi className="h-4 w-4 text-green-200" />
                      <span className="text-xs sm:text-sm text-green-200 font-medium">Online</span>
                    </div>
                  ) : connectionStatus === 'connecting' ? (
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Wifi className="h-4 w-4 animate-pulse text-yellow-200" />
                      <span className="text-xs sm:text-sm text-yellow-200 font-medium hidden sm:inline">Conectando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        <WifiOff className="h-4 w-4 text-red-200" />
                        <span className="text-xs sm:text-sm text-red-200 font-medium">Offline</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reconnect}
                        className="text-xs text-white border-white/30 hover:bg-white/10 backdrop-blur-sm"
                      >
                        Reconectar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Waiter Filter - Full Width on Mobile */}
              <div className="mb-3">
                <Select
                  value={selectedWaiterId || "all"}
                  onValueChange={(value) => setSelectedWaiterId(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-full bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300">
                    <SelectValue placeholder="Todos os Garçons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Garçons</SelectItem>
                    {waiters.map((waiter) => (
                      <SelectItem key={waiter.id} value={waiter.id}>
                        {waiter.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => window.location.href = '/reports'}
                    className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    size="sm"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Relatórios</span>
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/admin/products'}
                    className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    size="sm"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Produtos</span>
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/whatsapp-admin'}
                    className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    size="sm"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  size="sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4">
        {/* Enhanced Summary Cards - Now Tab Selectors */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 backdrop-blur-sm overflow-hidden relative ${
              activeTab === 'pending' 
                ? 'border-orange-500 shadow-xl -translate-y-1 bg-gradient-to-br from-orange-500 to-orange-600' 
                : 'border-transparent bg-gradient-to-br from-white to-orange-50/50 hover:border-orange-300'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 transition-opacity duration-300 ${
              activeTab === 'pending' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>
            <div className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  activeTab === 'pending' ? 'bg-white/20' : 'group-hover:bg-white/20'
                }`}>
                  <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'pending' ? 'text-white/90' : 'text-gray-600 group-hover:text-white/90'
                  }`}>Aguardando</p>
                  <p className={`text-2xl sm:text-3xl font-bold transition-colors ${
                    activeTab === 'pending' ? 'text-white' : 'text-gray-900 group-hover:text-white'
                  }`}>{pendingOrders.length}</p>
                </div>
              </div>
              <div className={`w-full rounded-full h-2 transition-colors ${
                activeTab === 'pending' ? 'bg-white/20' : 'bg-gray-200 group-hover:bg-white/20'
              }`}>
                <div className={`h-2 rounded-full transition-colors ${
                  activeTab === 'pending' ? 'bg-white' : 'bg-orange-500 group-hover:bg-white'
                }`} style={{width: `${Math.min((pendingOrders.length / Math.max(orders.length, 1)) * 100, 100)}%`}}></div>
              </div>
            </div>
          </Card>

          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 backdrop-blur-sm overflow-hidden relative ${
              activeTab === 'progress' 
                ? 'border-blue-500 shadow-xl -translate-y-1 bg-gradient-to-br from-blue-500 to-blue-600' 
                : 'border-transparent bg-gradient-to-br from-white to-blue-50/50 hover:border-blue-300'
            }`}
            onClick={() => setActiveTab('progress')}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 transition-opacity duration-300 ${
              activeTab === 'progress' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>
            <div className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  activeTab === 'progress' ? 'bg-white/20' : 'group-hover:bg-white/20'
                }`}>
                  <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'progress' ? 'text-white/90' : 'text-gray-600 group-hover:text-white/90'
                  }`}>Em Preparo</p>
                  <p className={`text-2xl sm:text-3xl font-bold transition-colors ${
                    activeTab === 'progress' ? 'text-white' : 'text-gray-900 group-hover:text-white'
                  }`}>{inProgressOrders.length}</p>
                </div>
              </div>
              <div className={`w-full rounded-full h-2 transition-colors ${
                activeTab === 'progress' ? 'bg-white/20' : 'bg-gray-200 group-hover:bg-white/20'
              }`}>
                <div className={`h-2 rounded-full transition-colors ${
                  activeTab === 'progress' ? 'bg-white' : 'bg-blue-500 group-hover:bg-white'
                }`} style={{width: `${Math.min((inProgressOrders.length / Math.max(orders.length, 1)) * 100, 100)}%`}}></div>
              </div>
            </div>
          </Card>

          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 backdrop-blur-sm overflow-hidden relative ${
              activeTab === 'ready' 
                ? 'border-green-500 shadow-xl -translate-y-1 bg-gradient-to-br from-green-500 to-green-600' 
                : 'border-transparent bg-gradient-to-br from-white to-green-50/50 hover:border-green-300'
            }`}
            onClick={() => setActiveTab('ready')}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 transition-opacity duration-300 ${
              activeTab === 'ready' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>
            <div className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  activeTab === 'ready' ? 'bg-white/20' : 'group-hover:bg-white/20'
                }`}>
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'ready' ? 'text-white/90' : 'text-gray-600 group-hover:text-white/90'
                  }`}>Prontos</p>
                  <p className={`text-2xl sm:text-3xl font-bold transition-colors ${
                    activeTab === 'ready' ? 'text-white' : 'text-gray-900 group-hover:text-white'
                  }`}>{readyOrders.length}</p>
                </div>
              </div>
              <div className={`w-full rounded-full h-2 transition-colors ${
                activeTab === 'ready' ? 'bg-white/20' : 'bg-gray-200 group-hover:bg-white/20'
              }`}>
                <div className={`h-2 rounded-full transition-colors ${
                  activeTab === 'ready' ? 'bg-white' : 'bg-green-500 group-hover:bg-white'
                }`} style={{width: `${Math.min((readyOrders.length / Math.max(orders.length, 1)) * 100, 100)}%`}}></div>
              </div>
            </div>
          </Card>

          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 backdrop-blur-sm overflow-hidden relative ${
              activeTab === 'completed' 
                ? 'border-purple-500 shadow-xl -translate-y-1 bg-gradient-to-br from-purple-500 to-purple-600' 
                : 'border-transparent bg-gradient-to-br from-white to-purple-50/50 hover:border-purple-300'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 transition-opacity duration-300 ${
              activeTab === 'completed' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>
            <div className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  activeTab === 'completed' ? 'bg-white/20' : 'group-hover:bg-white/20'
                }`}>
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'completed' ? 'text-white/90' : 'text-gray-600 group-hover:text-white/90'
                  }`}>Concluídos</p>
                  <p className={`text-2xl sm:text-3xl font-bold transition-colors ${
                    activeTab === 'completed' ? 'text-white' : 'text-gray-900 group-hover:text-white'
                  }`}>{completedOrders.length}</p>
                </div>
              </div>
              <div className={`w-full rounded-full h-2 transition-colors ${
                activeTab === 'completed' ? 'bg-white/20' : 'bg-gray-200 group-hover:bg-white/20'
              }`}>
                <div className={`h-2 rounded-full transition-colors ${
                  activeTab === 'completed' ? 'bg-white' : 'bg-purple-500 group-hover:bg-white'
                }`} style={{width: `${Math.min((completedOrders.length / Math.max(orders.length, 1)) * 100, 100)}%`}}></div>
              </div>
            </div>
          </Card>

          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 backdrop-blur-sm overflow-hidden relative ${
              activeTab === 'cancelled' 
                ? 'border-red-500 shadow-xl -translate-y-1 bg-gradient-to-br from-red-500 to-red-600' 
                : 'border-transparent bg-gradient-to-br from-white to-red-50/50 hover:border-red-300'
            }`}
            onClick={() => setActiveTab('cancelled')}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 transition-opacity duration-300 ${
              activeTab === 'cancelled' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>
            <div className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  activeTab === 'cancelled' ? 'bg-white/20' : 'group-hover:bg-white/20'
                }`}>
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'cancelled' ? 'text-white/90' : 'text-gray-600 group-hover:text-white/90'
                  }`}>Cancelados</p>
                  <p className={`text-2xl sm:text-3xl font-bold transition-colors ${
                    activeTab === 'cancelled' ? 'text-white' : 'text-gray-900 group-hover:text-white'
                  }`}>{cancelledOrders.length}</p>
                </div>
              </div>
              <div className={`w-full rounded-full h-2 transition-colors ${
                activeTab === 'cancelled' ? 'bg-white/20' : 'bg-gray-200 group-hover:bg-white/20'
              }`}>
                <div className={`h-2 rounded-full transition-colors ${
                  activeTab === 'cancelled' ? 'bg-white' : 'bg-red-500 group-hover:bg-white'
                }`} style={{width: `${Math.min((cancelledOrders.length / Math.max(orders.length, 1)) * 100, 100)}%`}}></div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                {selectedWaiterId 
                  ? `Nenhum pedido aguardando pagamento para o garçom selecionado`
                  : `Nenhum pedido aguardando pagamento`
                }
              </Card>
            ) : (
              pendingOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                
                return (
                  <Card key={order.id} className="p-4 sm:p-6 shadow-soft">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1">
                        <OrderCardInfo
                          orderNumber={order.order_number}
                          customerName={order.customer_name}
                          customerPhone={order.customer_phone}
                          waiterId={order.waiter_id}
                          createdAt={order.created_at}
                        />
                        {order.mercadopago_payment_id && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
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
                {selectedWaiterId 
                  ? `Nenhum pedido em preparo para o garçom selecionado`
                  : `Nenhum pedido em preparo`
                }
              </Card>
            ) : (
              inProgressOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                const orderNotificationHistory = notificationHistory.get(order.id);
                
                return (
                  <Card key={order.id} className="p-4 sm:p-6 shadow-soft">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <OrderCardInfo
                        orderNumber={order.order_number}
                        customerName={order.customer_name}
                        customerPhone={order.customer_phone}
                        waiterId={order.waiter_id}
                        createdAt={order.created_at}
                        paymentConfirmedAt={order.payment_confirmed_at}
                        kitchenNotifiedAt={order.kitchen_notified_at}
                      />
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
                {selectedWaiterId 
                  ? `Nenhum pedido pronto para o garçom selecionado`
                  : `Nenhum pedido pronto`
                }
              </Card>
            ) : (
              readyOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                const orderNotificationHistory = notificationHistory.get(order.id);
                
                return (
                  <Card key={order.id} className="p-4 sm:p-6 shadow-soft border-l-4 border-l-success">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <OrderCardInfo
                        orderNumber={order.order_number}
                        customerName={order.customer_name}
                        customerPhone={order.customer_phone}
                        waiterId={order.waiter_id}
                        createdAt={order.created_at}
                        paymentConfirmedAt={order.payment_confirmed_at}
                        readyAt={order.ready_at}
                      />
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
                {selectedWaiterId 
                  ? `Nenhum pedido concluído para o garçom selecionado`
                  : `Nenhum pedido concluído`
                }
              </Card>
            ) : (
              completedOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order);
                const PaymentIcon = paymentStatus.icon;
                
                return (
                  <Card key={order.id} className="p-4 sm:p-6 shadow-soft border-l-4 border-l-muted">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <OrderCardInfo
                          orderNumber={order.order_number}
                          customerName={order.customer_name}
                          customerPhone={order.customer_phone}
                          waiterId={order.waiter_id}
                          createdAt={order.created_at}
                          paymentConfirmedAt={order.payment_confirmed_at}
                          readyAt={order.ready_at}
                        />
                        {order.notified_at && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                            Cliente notificado: {formatTimestamp(order.notified_at)}
                          </p>
                        )}
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
                {selectedWaiterId 
                  ? `Nenhum pedido cancelado para o garçom selecionado`
                  : `Nenhum pedido cancelado`
                }
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
                          {order.customer_name} • {formatPhoneNumber(order.customer_phone)}
                        </p>
                        {order.waiter_id && (
                          <p className="text-sm text-muted-foreground">
                            👤 Garçom: <span className="font-medium">{getWaiterName(order.waiter_id)}</span>
                          </p>
                        )}
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
