import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, ShoppingCart, LogOut, TrendingUp, QrCode, CheckCircle, Clock, XCircle, Edit, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PIXQRGenerator } from "@/components";
import { CommissionToggle } from "@/components/CommissionToggle";
import { MobileOrderCard } from "@/components/MobileOrderCard";
import { OrderEditModal } from "@/components/OrderEditModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculateConfirmedCommissions, calculateEstimatedCommissions, getCommissionStatus, ORDER_STATUS_CATEGORIES } from "@/lib/commissionUtils";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { formatOrderNumber, canEditOrder } from "@/lib/orderUtils";
import type { Order } from "@/types/commission";
import type { Order as RealtimeOrder } from "@/integrations/supabase/realtime";
import logo from "@/assets/coco-loko-logo.png";

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [waiterName, setWaiterName] = useState("Garçom");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPIXGenerator, setShowPIXGenerator] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    setWaiterName(user.user_metadata?.full_name || user.email || "Garçom");
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
    // Allow PIX generation for orders that haven't been paid yet
    const unpaidStatuses = ['pending', 'in_preparation', 'ready'];
    return unpaidStatuses.includes(order.status.toLowerCase()) && 
           !!order.customer_name && 
           !!order.customer_phone;
  };

  // Only count paid orders for total sales
  const validOrders = orders.filter(order => 
    ORDER_STATUS_CATEGORIES.PAID.includes(order.status.toLowerCase())
  );
  const totalSales = validOrders.reduce((sum, order) => sum + order.total_amount, 0);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary"; // Yellow for pending orders
      case "pending_payment":
        return "destructive"; // Red for awaiting payment
      case "paid":
        return "default"; // Blue for paid orders
      case "in_preparation":
        return "secondary"; // Yellow for in preparation
      case "ready":
        return "default"; // Blue for ready orders
      case "completed":
        return "default"; // Green for completed
      case "cancelled":
        return "destructive"; // Red for cancelled
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pendente";
      case "pending_payment":
        return "Aguardando Pagamento";
      case "paid":
        return "Pago";
      case "in_preparation":
        return "Em Preparo";
      case "ready":
        return "Pronto";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

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
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Coco Loko" 
                  className="h-10 sm:h-14 w-auto drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold flex items-center">
                  <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Dashboard do Garçom
                </h1>
                <p className="text-purple-100 text-xs sm:text-sm font-medium">
                  {waiterName} • {new Date().toLocaleDateString("pt-BR", { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/waiter-diagnostic")} 
                className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                size="sm"
                title="System Diagnostics"
              >
                🔧
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout} 
                className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Side-by-side layout for Place Order and Total Sales on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Place Order Card */}
          <div data-testid="new-order-section">
            <Card className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white shadow-2xl border-0 overflow-hidden relative h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              <CardContent className="p-6 sm:p-8 relative flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold">Criar Novo Pedido</h3>
                      <p className="text-green-100 text-sm">Comece a atender um novo cliente</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm sm:text-base mb-4">
                    Abra o cardápio digital para fazer um pedido personalizado para o cliente
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    console.log('🛒 Novo Pedido button clicked, navigating to /menu');
                    navigate("/menu");
                  }}
                  size="lg"
                  className="bg-white text-green-600 hover:bg-gray-100 font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full"
                  data-testid="new-order-button"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Novo Pedido
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Total Sales Card */}
          <Card className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-white transition-colors">
                Total de Vendas
              </CardTitle>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-white/20 group-hover:shadow-xl transition-all duration-300">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-white transition-colors mb-2">
                {totalSales.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-sm text-gray-500 group-hover:text-white/90 transition-colors flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {validOrders.length} pedidos pagos
              </p>
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
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-purple-600" />
              Histórico de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile Card Layout */}
            {isMobile ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <MobileOrderCard
                    key={order.id}
                    order={order}
                    onGeneratePIX={handleGeneratePIX}
                    canGeneratePIX={canGeneratePIX(order)}
                    onClick={handleOrderClick}
                  />
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mb-2" />
                      <p>Nenhum pedido encontrado</p>
                      <p className="text-sm">Clique em "Novo Pedido" para começar a atender clientes</p>
                    </div>
                  </div>
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
                    {orders.map((order) => (
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
                          <Badge variant={getStatusVariant(order.status)} className="font-medium">
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
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
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center">
                            <ShoppingCart className="w-12 h-12 text-gray-300 mb-2" />
                            <p>Nenhum pedido encontrado</p>
                            <p className="text-sm">Clique em "Novo Pedido" para começar a atender clientes</p>
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
        />
      )}

      {/* Order Edit Modal */}
      <OrderEditModal
        order={selectedOrder}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveOrder}
      />
    </div>
  );
};

export default WaiterDashboard;
