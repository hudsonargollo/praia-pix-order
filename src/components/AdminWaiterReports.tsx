import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, Download, DollarSign, ShoppingCart, TrendingUp, User, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  calculateConfirmedCommissions, 
  calculateEstimatedCommissions, 
  getCommissionStatus,
  getOrdersByCategory,
  ORDER_STATUS_CATEGORIES
} from "@/lib/commissionUtils";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import type { Order } from "@/types/commission";
import type { Order as RealtimeOrder } from "@/integrations/supabase/realtime";

interface Waiter {
  id: string;
  email: string;
  full_name: string;
}

interface WaiterOrder {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  commission_amount?: number;
  status: string;
  created_at: string;
  order_notes?: string;
}

interface WaiterStats {
  totalOrders: number;
  completedOrders: number;
  grossSales: number;
  confirmedCommission: number;
  estimatedCommission: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  averageOrderValue: number;
}

const AdminWaiterReports = () => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>("");
  const [waiterOrders, setWaiterOrders] = useState<WaiterOrder[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [waiterStats, setWaiterStats] = useState<WaiterStats>({
    totalOrders: 0,
    completedOrders: 0,
    grossSales: 0,
    confirmedCommission: 0,
    estimatedCommission: 0,
    paidOrdersCount: 0,
    pendingOrdersCount: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem('admin_waiter_reports_date_range');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          from: new Date(parsed.from),
          to: new Date(parsed.to),
        };
      } catch (e) {
        console.error('Failed to parse saved date range:', e);
      }
    }
    // Default to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      from: today,
      to: new Date(),
    };
  });

  useEffect(() => {
    loadWaiters();
  }, []);

  useEffect(() => {
    if (selectedWaiterId) {
      loadWaiterData();
    }
  }, [selectedWaiterId, dateRange]);

  // Persist date range to localStorage
  useEffect(() => {
    localStorage.setItem('admin_waiter_reports_date_range', JSON.stringify({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    }));
  }, [dateRange]);

  // Set up real-time subscriptions for selected waiter
  useEffect(() => {
    if (!selectedWaiterId) {
      return;
    }

    console.log('🔔 Setting up real-time subscriptions for waiter reports:', selectedWaiterId);
    
    const channelName = `admin-waiter-reports-${selectedWaiterId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `waiter_id=eq.${selectedWaiterId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as RealtimeOrder;
          console.log('📡 Real-time order update in admin reports:', updatedOrder.id, 'Status:', updatedOrder.status);
          
          // Check if order is within date range
          const orderDate = new Date(updatedOrder.created_at);
          if (orderDate >= dateRange.from && orderDate <= dateRange.to) {
            handleOrderUpdate(updatedOrder);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `waiter_id=eq.${selectedWaiterId}`,
        },
        (payload) => {
          const newOrder = payload.new as RealtimeOrder;
          console.log('📡 Real-time new order in admin reports:', newOrder.id);
          
          // Check if order is within date range
          const orderDate = new Date(newOrder.created_at);
          if (orderDate >= dateRange.from && orderDate <= dateRange.to) {
            handleOrderInsert(newOrder);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Admin waiter reports subscription status: ${status}`);
      });

    return () => {
      console.log('🔕 Cleaning up admin reports real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [selectedWaiterId, dateRange]);

  const loadWaiters = async () => {
    try {
      // Use Supabase Edge Function to get waiters
      const { data, error } = await supabase.functions.invoke('list-waiters');
      
      if (error) {
        console.error("Edge Function error:", error);
        toast.error("Erro ao carregar lista de garçons");
        return;
      }
      
      setWaiters(data.waiters || []);
      
    } catch (error) {
      console.error("Error fetching waiters:", error);
      toast.error("Erro ao carregar lista de garçons");
    }
  };

  const calculateStats = useCallback((orders: WaiterOrder[]) => {
    const ordersForCalc = orders as any[];
    const completedOrders = orders.filter(o => o.status === "completed");
    const paidOrders = getOrdersByCategory(ordersForCalc, 'PAID');
    const pendingOrders = getOrdersByCategory(ordersForCalc, 'PENDING');
    
    const grossSales = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const confirmedCommission = calculateConfirmedCommissions(ordersForCalc);
    const estimatedCommission = calculateEstimatedCommissions(ordersForCalc);

    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      grossSales,
      confirmedCommission,
      estimatedCommission,
      paidOrdersCount: paidOrders.length,
      pendingOrdersCount: pendingOrders.length,
      averageOrderValue: paidOrders.length > 0 ? grossSales / paidOrders.length : 0,
    };
  }, []);

  const loadWaiterData = useCallback(async () => {
    if (!selectedWaiterId) return;
    
    setLoading(true);
    try {
      // Use a simpler approach to avoid type issues
      const { data: orders, error } = await (supabase as any)
        .from("orders")
        .select("*")
        .eq("waiter_id", selectedWaiterId)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const waiterOrders: WaiterOrder[] = (orders || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        total_amount: order.total_amount,
        commission_amount: order.commission_amount || (Number(order.total_amount) * 0.1), // Use DB value or calculate
        status: order.status,
        created_at: order.created_at,
        order_notes: order.order_notes || "", // Handle missing field gracefully
      }));
      
      setWaiterOrders(waiterOrders);
      setWaiterStats(calculateStats(waiterOrders));

    } catch (error) {
      console.error("Error loading waiter data:", error);
      toast.error("Erro ao carregar dados do garçom");
    } finally {
      setLoading(false);
    }
  }, [selectedWaiterId, dateRange, calculateStats]);

  // Handle real-time order updates
  const handleOrderUpdate = useCallback((updatedOrder: RealtimeOrder) => {
    setWaiterOrders(prevOrders => {
      const existingIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
      
      if (existingIndex >= 0) {
        const newOrders = [...prevOrders];
        const oldStatus = newOrders[existingIndex].status;
        
        newOrders[existingIndex] = {
          id: updatedOrder.id,
          order_number: updatedOrder.order_number,
          customer_name: updatedOrder.customer_name,
          customer_phone: updatedOrder.customer_phone,
          total_amount: updatedOrder.total_amount,
          commission_amount: updatedOrder.commission_amount || (Number(updatedOrder.total_amount) * 0.1),
          status: updatedOrder.status,
          created_at: updatedOrder.created_at,
          order_notes: updatedOrder.order_notes || "",
        };
        
        // Recalculate stats
        setWaiterStats(calculateStats(newOrders));
        
        // Show notification for commission status changes
        if (oldStatus !== updatedOrder.status) {
          if (ORDER_STATUS_CATEGORIES.PAID.includes(updatedOrder.status.toLowerCase())) {
            toast.success('💰 Comissão confirmada', {
              description: `Pedido #${updatedOrder.order_number} foi pago`
            });
          }
        }
        
        return newOrders;
      }
      
      return prevOrders;
    });
  }, [calculateStats]);

  // Handle new orders
  const handleOrderInsert = useCallback((newOrder: RealtimeOrder) => {
    setWaiterOrders(prevOrders => {
      // Check if order already exists
      if (prevOrders.some(o => o.id === newOrder.id)) {
        return prevOrders;
      }
      
      const waiterOrder: WaiterOrder = {
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        total_amount: newOrder.total_amount,
        commission_amount: newOrder.commission_amount || (Number(newOrder.total_amount) * 0.1),
        status: newOrder.status,
        created_at: newOrder.created_at,
        order_notes: newOrder.order_notes || "",
      };
      
      const newOrders = [waiterOrder, ...prevOrders];
      
      // Recalculate stats
      setWaiterStats(calculateStats(newOrders));
      
      return newOrders;
    });
  }, [calculateStats]);

  const exportToCSV = () => {
    if (!selectedWaiterId || waiterOrders.length === 0) {
      toast.error("Selecione um garçom com pedidos para exportar");
      return;
    }

    const selectedWaiter = waiters.find(w => w.id === selectedWaiterId);
    const headers = [
      "Número do Pedido",
      "Cliente",
      "Telefone",
      "Valor Total",
      "Status da Comissão",
      "Comissão Confirmada",
      "Comissão Estimada",
      "Status",
      "Data",
      "Observações"
    ];
    
    const rows = waiterOrders.map(order => {
      const commissionStatus = getCommissionStatus(order as any);
      const isConfirmed = commissionStatus.status === 'confirmed';
      const isPending = commissionStatus.status === 'pending';
      
      return [
        order.order_number,
        order.customer_name,
        formatPhoneNumber(order.customer_phone),
        `R$ ${Number(order.total_amount).toFixed(2)}`,
        commissionStatus.status === 'confirmed' ? 'Confirmada' : 
        commissionStatus.status === 'pending' ? 'Estimada' : 'Cancelada',
        isConfirmed ? `R$ ${commissionStatus.amount.toFixed(2)}` : 'R$ 0,00',
        isPending ? `R$ ${commissionStatus.amount.toFixed(2)}` : 'R$ 0,00',
        order.status,
        format(new Date(order.created_at), "dd/MM/yyyy HH:mm"),
        order.order_notes || ""
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-garcom-${selectedWaiter?.full_name}-${format(dateRange.from, "dd-MM-yyyy")}-${format(dateRange.to, "dd-MM-yyyy")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      preparing: { label: "Preparando", variant: "default" as const },
      ready: { label: "Pronto", variant: "outline" as const },
      completed: { label: "Concluído", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            Relatórios por Garçom
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            {/* Waiter Selection */}
            <div className="flex-1 w-full lg:min-w-[250px]">
              <Select value={selectedWaiterId} onValueChange={setSelectedWaiterId}>
                <SelectTrigger className="h-11 border-gray-300 hover:border-purple-400 focus:border-purple-500 focus:ring-purple-500 transition-colors">
                  <SelectValue placeholder="Escolha um garçom..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {waiters.map((waiter) => (
                    <SelectItem 
                      key={waiter.id} 
                      value={waiter.id}
                      className="cursor-pointer hover:bg-purple-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{waiter.full_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selector */}
            <div className="w-full lg:w-auto flex justify-center lg:justify-start">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full lg:w-auto h-11 border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors font-medium"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-purple-600" />
                    <span className="text-sm">
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-xl border-gray-200" align="end">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 border-b">
                    <h4 className="font-semibold text-gray-900">Selecione o período</h4>
                    <p className="text-sm text-gray-600 mt-1">Escolha as datas de início e fim</p>
                  </div>
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    locale={ptBR}
                    className="rounded-b-lg"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Status Filter */}
            <div className="w-full lg:w-auto">
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="h-11 border-gray-300 hover:border-purple-400 focus:border-purple-500 focus:ring-purple-500 transition-colors">
                  <SelectValue placeholder="Filtrar por pagamento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pedidos</SelectItem>
                  <SelectItem value="confirmed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Pagamento Confirmado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>Aguardando Pagamento</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Pagamento Falhou</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <Button 
              onClick={exportToCSV} 
              variant="outline"
              disabled={!selectedWaiterId || waiterOrders.length === 0}
              className="w-full lg:w-auto h-11 border-green-300 hover:bg-green-50 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Download className="mr-2 h-4 w-4 text-green-600" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {selectedWaiterId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                  <p className="text-3xl font-bold">{waiterStats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Brutas</p>
                  <p className="text-3xl font-bold text-success">
                    R$ {waiterStats.grossSales.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-3xl font-bold text-blue-500">
                    R$ {waiterStats.averageOrderValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700 font-medium">Comissões Confirmadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {waiterStats.confirmedCommission.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    De {waiterStats.paidOrdersCount} pedidos pagos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Comissões Estimadas</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    R$ {waiterStats.estimatedCommission.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    De {waiterStats.pendingOrdersCount} pedidos pendentes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      {selectedWaiterId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Pedidos do Garçom
              {waiters.find(w => w.id === selectedWaiterId) && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  - {waiters.find(w => w.id === selectedWaiterId)?.full_name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando pedidos...</p>
              </div>
            ) : waiterOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum pedido encontrado para o período selecionado
                </p>
              </div>
            ) : (() => {
              // Filter orders by payment status
              const filteredOrders = waiterOrders.filter(order => {
                if (paymentStatusFilter === "all") return true;
                
                const commissionStatus = getCommissionStatus(order as any);
                if (paymentStatusFilter === "confirmed") {
                  return commissionStatus.status === 'confirmed';
                }
                if (paymentStatusFilter === "pending") {
                  return commissionStatus.status === 'pending';
                }
                if (paymentStatusFilter === "failed") {
                  return commissionStatus.status === 'excluded';
                }
                return true;
              });

              return filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum pedido encontrado com o filtro selecionado
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                      const commissionStatus = getCommissionStatus(order as any);
                      const CommissionIcon = commissionStatus.icon === 'CheckCircle' ? CheckCircle :
                                            commissionStatus.icon === 'Clock' ? Clock : XCircle;
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.order_number}</TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell>{formatPhoneNumber(order.customer_phone)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {Number(order.total_amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-end gap-2">
                                    <CommissionIcon className="w-4 h-4" />
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
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {order.order_notes || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminWaiterReports;