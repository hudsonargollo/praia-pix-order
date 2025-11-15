import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, TrendingUp, QrCode, CheckCircle, Clock, XCircle, Edit, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PIXQRGenerator, UniformHeader } from "@/components";
import { CommissionToggle } from "@/components/CommissionToggle";
import { MobileOrderCard } from "@/components/MobileOrderCard";
import { OrderEditModal } from "@/components/OrderEditModal";
import { AddItemsModal } from "@/components/AddItemsModal";
import { StatusBadge } from "@/components/StatusBadge";
import type { OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCommissionStatus, ORDER_STATUS_CATEGORIES } from "@/lib/commissionUtils";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { formatOrderNumber, canEditOrder } from "@/lib/orderUtils";
import type { Order } from "@/types/commission";
import type { Order as RealtimeOrder } from "@/integrations/supabase/realtime";

type PaymentStatusFilter = 'all' | 'pending' | 'confirmed';

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [waiterName, setWaiterName] = useState("Garçom");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPIXGenerator, setShowPIXGenerator] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>(() => {
    // Load from localStorage or default to 'all'
    const saved = localStorage.getItem('waiter-payment-status-filter');
    return (saved as PaymentStatusFilter) || 'all';
  });

  const fetchWaiterData = useCallback(async () => {
    setLoading(true);
    console.log('📊 Fetching waiter data...');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ No user found, redirecting to auth');
      toast.error("Você precisa fazer login.");
      navigate("/auth");
      return;
    }

    console.log('✅ User found:', user.email, 'Role:', user.user_metadata?.role);
    
    // Check if waiter has set display name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, has_set_display_name, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else if (profile && !profile.has_set_display_name) {
      // Redirect to setup if display name not set
      console.log('🔄 Redirecting to setup - display name not set');
      navigate('/waiter/setup', { replace: true });
      return;
    }

    // Use display_name if available, otherwise fall back to full_name or email
    const displayName = profile?.display_name || profile?.full_name || user.email || "Garçom";
    setWaiterName(displayName);
    setCurrentUserId(user.id);

    // Fetch orders placed by the current waiter
    const { data, error } = await (supabase as any)
      .from("orders")
      .select("*")
      .eq("waiter_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos: " + error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [navigate]);

  // Handle real-time order updates
  const handleOrderUpdate = useCallback((updatedOrder: RealtimeOrder) => {
    console.log('📡 Real-time order update received:', updatedOrder.id, 'Status:', updatedOrder.status);
    
    setOrders(prevOrders => {
      const existingIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
      
      if (existingIndex >= 0) {
        const oldOrder = prevOrders[existingIndex];
        const newOrders = [...prevOrders];
        newOrders[existingIndex] = updatedOrder as Order;
        
        // Show toast notification for status changes that affect commissions
        const oldStatus = oldOrder.status;
        const oldTotal = oldOrder.total_amount;
        const newTotal = updatedOrder.total_amount;
        
        if (oldStatus !== updatedOrder.status) {
          if (ORDER_STATUS_CATEGORIES.PAID.includes(updatedOrder.status.toLowerCase())) {
            const commission = newTotal * 0.1;
            toast.success('💰 Comissão confirmada! Pedido pago.', {
              description: `${formatOrderNumber(updatedOrder)} - Comissão: ${commission.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
            });
          } else if (ORDER_STATUS_CATEGORIES.EXCLUDED.includes(updatedOrder.status.toLowerCase())) {
            toast.info('Pedido cancelado', {
              description: formatOrderNumber(updatedOrder)
            });
          }
        } else if (Math.abs(oldTotal - newTotal) > 0.01) {
          // Order total changed (from edit)
          const oldCommission = oldTotal * 0.1;
          const newCommission = newTotal * 0.1;
          const commissionDiff = newCommission - oldCommission;
          
          toast.info('Pedido atualizado', {
            description: `Comissão ${commissionDiff > 0 ? 'aumentou' : 'diminuiu'}: ${Math.abs(commissionDiff).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
          });
        }
        
        console.log('✅ Order updated in local state, commission cards will auto-refresh');
        return newOrders;
      }
      
      return prevOrders;
    });
  }, []);

  // Handle new orders (in case waiter creates order from another device)
  const handleOrderInsert = useCallback((newOrder: RealtimeOrder) => {
    console.log('📡 Real-time new order received:', newOrder.id);
    
    setOrders(prevOrders => {
      // Check if order already exists
      if (prevOrders.some(o => o.id === newOrder.id)) {
        return prevOrders;
      }
      
      // Add new order at the beginning
      return [newOrder as Order, ...prevOrders];
    });
  }, []);

  useEffect(() => {
    console.log('🚀 WaiterDashboard mounted');
    fetchWaiterData();
  }, [fetchWaiterData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    console.log('🔔 Setting up real-time subscriptions for waiter:', currentUserId);
    
    // Subscribe to new orders and updates
    const channelName = 'waiter-orders';
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `waiter_id=eq.${currentUserId}`,
        },
        (payload) => {
          handleOrderInsert(payload.new as RealtimeOrder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `waiter_id=eq.${currentUserId}`,
        },
        (payload) => {
          handleOrderUpdate(payload.new as RealtimeOrder);
        }
      )
      .subscribe((status) => {
        console.log(`Waiter orders subscription status: ${status}`);
      });

    return () => {
      console.log('🔕 Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [currentUserId, handleOrderUpdate, handleOrderInsert]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleGeneratePIX = (order: Order) => {
    setSelectedOrder(order);
    setShowPIXGenerator(true);
  };

  const handlePIXPaymentComplete = async (paymentId: string) => {
    if (!selectedOrder) return;

    try {
      // Update order status to paid
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          mercadopago_payment_id: paymentId
        })
        .eq('id', selectedOrder.id);

      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Erro ao atualizar status do pedido');
      } else {
        toast.success('Pedido marcado como pago!');
        // Refresh orders to show updated status
        fetchWaiterData();
      }
    } catch (error) {
      console.error('Error handling payment completion:', error);
      toast.error('Erro ao processar pagamento');
    }

    setShowPIXGenerator(false);
    setSelectedOrder(null);
  };

  const handleClosePIXGenerator = () => {
    setShowPIXGenerator(false);
    setSelectedOrder(null);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
  };

  const handleSaveOrder = async (updatedOrder: Order) => {
    console.log('💾 Order saved, refreshing dashboard data...');
    
    // Immediately update the local state with the updated order
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      );
      return updatedOrders;
    });
    
    // Fetch fresh data from the database to ensure consistency
    await fetchWaiterData();
    
    // Show success notification with commission update
    const commissionStatus = getCommissionStatus(updatedOrder);
    toast.success('Pedido atualizado!', {
      description: `Nova comissão: ${commissionStatus.displayAmount}`
    });
    
    console.log('✅ Dashboard refreshed with updated order data');
  };

  const canGeneratePIX = (order: Order): boolean => {
    // Only show button if:
    // 1. Payment status is pending
    // 2. No PIX QR code exists OR PIX has expired
    // 3. Customer info is available
    
    if (order.payment_status !== 'pending') {
      return false;
    }

    if (!order.customer_name || !order.customer_phone) {
      return false;
    }

    // If PIX exists, check if it's expired
    if (order.pix_qr_code && order.pix_expires_at) {
      const expiresAt = new Date(order.pix_expires_at);
      if (expiresAt > new Date()) {
        // PIX exists and not expired, don't show button
        return false;
      }
    }

    return true;
  };

  const canAddItems = (order: Order): boolean => {
    // Only show button if:
    // 1. Order status is in_preparation
    // 2. Waiter owns the order (checked by currentUserId)
    
    if (order.status !== 'in_preparation') {
      return false;
    }

    if (order.waiter_id !== currentUserId) {
      return false;
    }

    return true;
  };

  const handleAddItems = (order: Order) => {
    setSelectedOrder(order);
    setShowAddItemsModal(true);
  };

  const handleAddItemsSuccess = async (newTotal: number) => {
    console.log('💾 Items added successfully, refreshing dashboard data...');
    
    // Fetch fresh data from the database to ensure consistency
    await fetchWaiterData();
    
    toast.success('Itens adicionados com sucesso!', {
      description: `Novo total: ${newTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
    });
    
    console.log('✅ Dashboard refreshed with updated order data');
  };

  const handleCloseAddItemsModal = () => {
    setShowAddItemsModal(false);
    setSelectedOrder(null);
  };

  const canMarkAsReady = (order: Order): boolean => {
    // Only show button if:
    // 1. Order status is in_preparation
    // 2. Waiter owns the order
    // 3. Payment status is pending (waiter hasn't confirmed payment yet)
    
    if (order.status !== 'in_preparation') {
      return false;
    }

    if (order.waiter_id !== currentUserId) {
      return false;
    }

    if (order.payment_status !== 'pending') {
      return false;
    }

    return true;
  };

  const handleMarkAsReady = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'ready',
          payment_status: 'confirmed',
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Pedido pronto para retirada!', {
        description: `${formatOrderNumber(order)} - Cliente será notificado`
      });

      // Refresh data
      await fetchWaiterData();
    } catch (error) {
      console.error('Error marking order as ready:', error);
      toast.error('Erro ao marcar pedido como pronto');
    }
  };

  // Handle payment status filter change
  const handlePaymentStatusFilterChange = (value: PaymentStatusFilter) => {
    setPaymentStatusFilter(value);
    localStorage.setItem('waiter-payment-status-filter', value);
  };

  // Filter orders by payment status
  const filteredOrders = orders.filter(order => {
    if (paymentStatusFilter === 'all') return true;
    
    const paymentStatus = order.payment_status?.toLowerCase();
    
    if (paymentStatusFilter === 'pending') {
      return paymentStatus === 'pending' || !paymentStatus;
    }
    
    if (paymentStatusFilter === 'confirmed') {
      return paymentStatus === 'confirmed';
    }
    
    return true;
  });

  // Calculate counts for each payment status
  const pendingCount = orders.filter(order => {
    const paymentStatus = order.payment_status?.toLowerCase();
    return paymentStatus === 'pending' || !paymentStatus;
  }).length;

  const confirmedCount = orders.filter(order => {
    const paymentStatus = order.payment_status?.toLowerCase();
    return paymentStatus === 'confirmed';
  }).length;

  // Only count paid orders for total sales
  const validOrders = orders.filter(order => 
    ORDER_STATUS_CATEGORIES.PAID.includes(order.status.toLowerCase())
  );
  const totalSales = validOrders.reduce((sum, order) => sum + order.total_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-acai flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-acai">
      {/* Uniform Header */}
      <UniformHeader
        title="Dashboard do Garçom"
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Side-by-side layout for Place Order and Total Sales on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Place Order Card */}
          <div data-testid="new-order-section">
            <Card className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white shadow-2xl border-0 overflow-hidden relative h-full hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),transparent_50%)]"></div>
              <CardContent className="p-6 sm:p-8 relative flex flex-col h-full">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg flex-shrink-0">
                      <ShoppingCart className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-bold mb-1 leading-tight">Criar Novo Pedido</h3>
                      <p className="text-green-50 text-sm sm:text-base">Comece a atender um novo cliente</p>
                    </div>
                  </div>
                  <p className="text-white/95 text-sm sm:text-base leading-relaxed">
                    Abra o cardápio digital para fazer um pedido personalizado
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    console.log('🛒 Novo Pedido button clicked, navigating to /menu');
                    navigate("/menu");
                  }}
                  size="lg"
                  className="bg-white text-green-600 hover:bg-green-50 font-bold px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] w-full rounded-xl mt-4"
                  data-testid="new-order-button"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Novo Pedido
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Total Sales Card */}
          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-0 bg-white shadow-xl overflow-hidden relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-bl-full opacity-50"></div>
            <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-500 group-hover:text-white/90 transition-colors uppercase tracking-wide mb-2">
                    Total de Vendas
                  </p>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 group-hover:text-white transition-colors">
                    {totalSales.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-white/20 group-hover:shadow-xl transition-all duration-300 flex-shrink-0">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 group-hover:text-white/90 transition-colors mt-auto">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">{validOrders.length} pedidos pagos</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Toggle */}
        <div className="mb-8">
          <CommissionToggle orders={orders} />
        </div>

        {/* Orders History */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-purple-600" />
                Histórico de Pedidos
              </CardTitle>
              
              {/* Payment Status Tabs */}
              <Tabs 
                value={paymentStatusFilter} 
                onValueChange={(value) => handlePaymentStatusFilterChange(value as PaymentStatusFilter)}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    Todos ({orders.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">
                    <Clock className="w-3 h-3 mr-1" />
                    Pendente ({pendingCount})
                  </TabsTrigger>
                  <TabsTrigger value="confirmed" className="text-xs sm:text-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Confirmado ({confirmedCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Card Layout */}
            {isMobile ? (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <MobileOrderCard
                    key={order.id}
                    order={order}
                    onGeneratePIX={handleGeneratePIX}
                    canGeneratePIX={canGeneratePIX(order)}
                    onAddItems={handleAddItems}
                    canAddItems={canAddItems(order)}
                    onMarkAsReady={handleMarkAsReady}
                    canMarkAsReady={canMarkAsReady(order)}
                    onClick={handleOrderClick}
                  />
                ))}
                {filteredOrders.length === 0 && (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center">
                      <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">Nenhum pedido encontrado</p>
                      <p className="text-sm text-gray-500">
                        {paymentStatusFilter === 'all' 
                          ? 'Clique em "Novo Pedido" para começar a atender clientes'
                          : `Nenhum pedido com status de pagamento "${paymentStatusFilter === 'pending' ? 'Pendente' : 'Confirmado'}"`
                        }
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              /* Desktop Table Layout */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">ID do Pedido</TableHead>
                      <TableHead className="text-gray-600">Cliente</TableHead>
                      <TableHead className="text-gray-600">Data</TableHead>
                      <TableHead className="text-right text-gray-600">Total</TableHead>
                      <TableHead className="text-right text-gray-600">Sua Comissão</TableHead>
                      <TableHead className="text-gray-600">Status</TableHead>
                      <TableHead className="text-gray-600">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow 
                        key={order.id} 
                        className="border-gray-100 hover:bg-purple-50/50 cursor-pointer transition-colors duration-150"
                        onClick={() => handleOrderClick(order)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOrderClick(order);
                          }
                        }}
                      >
                        <TableCell className="font-medium text-gray-900">
                          {formatOrderNumber(order, false)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <div>
                            <div className="font-medium">{order.customer_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{formatPhoneNumber(order.customer_phone)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(order.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-900">
                          {order.total_amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const commissionStatus = getCommissionStatus(order);
                            const IconComponent = commissionStatus.icon === 'CheckCircle' ? CheckCircle : 
                                                 commissionStatus.icon === 'Clock' ? Clock : XCircle;
                            
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-end gap-2">
                                      <IconComponent className="w-4 h-4" />
                                      <span className={commissionStatus.className}>
                                        {commissionStatus.displayAmount}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{commissionStatus.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            orderStatus={order.status as OrderStatus}
                            paymentStatus={order.payment_status as PaymentStatus}
                            showBoth={!!order.payment_status}
                            compact={false}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            {canMarkAsReady(order) && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsReady(order);
                                }}
                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Pronto p/ Retirada
                              </Button>
                            )}
                            {canAddItems(order) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddItems(order);
                                }}
                                className="flex items-center gap-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <Plus className="w-3 h-3" />
                                Adicionar Item
                              </Button>
                            )}
                            {canGeneratePIX(order) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGeneratePIX(order);
                                }}
                                className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <QrCode className="w-3 h-3" />
                                Gerar PIX
                              </Button>
                            )}
                            {canEditOrder(order) ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <Edit className="w-4 h-4" />
                                      <span className="text-xs font-medium">Editável</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Clique no pedido para editar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-gray-400">
                                      <Lock className="w-4 h-4" />
                                      <span className="text-xs font-medium">Bloqueado</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Este pedido não pode ser editado</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">Nenhum pedido encontrado</p>
                            <p className="text-sm text-gray-500">
                              {paymentStatusFilter === 'all' 
                                ? 'Clique em "Novo Pedido" para começar a atender clientes'
                                : `Nenhum pedido com status de pagamento "${paymentStatusFilter === 'pending' ? 'Pendente' : 'Confirmado'}"`
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PIX QR Generator Modal */}
      {selectedOrder && (
        <PIXQRGenerator
          isOpen={showPIXGenerator}
          orderId={selectedOrder.id}
          amount={selectedOrder.total_amount}
          customerInfo={{
            name: selectedOrder.customer_name,
            phone: selectedOrder.customer_phone
          }}
          onPaymentComplete={handlePIXPaymentComplete}
          onClose={handleClosePIXGenerator}
          mode="manual"
        />
      )}

      {/* Order Edit Modal */}
      <OrderEditModal
        order={selectedOrder}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveOrder}
      />

      {/* Add Items Modal */}
      {selectedOrder && (
        <AddItemsModal
          isOpen={showAddItemsModal}
          orderId={selectedOrder.id}
          currentTotal={selectedOrder.total_amount}
          hasPIX={!!selectedOrder.pix_qr_code && !!selectedOrder.pix_expires_at && new Date(selectedOrder.pix_expires_at) > new Date()}
          onClose={handleCloseAddItemsModal}
          onSuccess={handleAddItemsSuccess}
        />
      )}
    </div>
  );
};

export default WaiterDashboard;
