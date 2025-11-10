import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, DollarSign, ShoppingCart, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  totalCommission: number;
  averageOrderValue: number;
}

const AdminWaiterReports = () => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>("");
  const [waiterOrders, setWaiterOrders] = useState<WaiterOrder[]>([]);
  const [waiterStats, setWaiterStats] = useState<WaiterStats>({
    totalOrders: 0,
    completedOrders: 0,
    grossSales: 0,
    totalCommission: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  useEffect(() => {
    loadWaiters();
  }, []);

  useEffect(() => {
    if (selectedWaiterId) {
      loadWaiterData();
    }
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

  const loadWaiterData = async () => {
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
        commission_amount: Number(order.total_amount) * 0.1, // Calculate 10% commission
        status: order.status,
        created_at: order.created_at,
        order_notes: order.order_notes || "", // Handle missing field gracefully
      }));
      
      setWaiterOrders(waiterOrders);

      // Calculate statistics
      const completedOrders = waiterOrders.filter(o => o.status === "completed");
      const grossSales = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalCommission = completedOrders.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);

      setWaiterStats({
        totalOrders: waiterOrders.length,
        completedOrders: completedOrders.length,
        grossSales,
        totalCommission,
        averageOrderValue: completedOrders.length > 0 ? grossSales / completedOrders.length : 0,
      });

    } catch (error) {
      console.error("Error loading waiter data:", error);
      toast.error("Erro ao carregar dados do garçom");
    } finally {
      setLoading(false);
    }
  };

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
      "Comissão",
      "Status",
      "Data",
      "Observações"
    ];
    
    const rows = waiterOrders.map(order => [
      order.order_number,
      order.customer_name,
      order.customer_phone,
      `R$ ${Number(order.total_amount).toFixed(2)}`,
      `R$ ${Number(order.commission_amount || 0).toFixed(2)}`,
      order.status,
      format(new Date(order.created_at), "dd/MM/yyyy HH:mm"),
      order.order_notes || ""
    ]);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Relatórios por Garçom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Waiter Selection */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Selecionar Garçom</label>
              <Select value={selectedWaiterId} onValueChange={setSelectedWaiterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um garçom..." />
                </SelectTrigger>
                <SelectContent>
                  {waiters.map((waiter) => (
                    <SelectItem key={waiter.id} value={waiter.id}>
                      {waiter.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Export Button */}
            <Button 
              onClick={exportToCSV} 
              variant="outline"
              disabled={!selectedWaiterId || waiterOrders.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {selectedWaiterId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">%</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão Total</p>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {waiterStats.totalCommission.toFixed(2)}
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
                    {waiterOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.customer_phone}</TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          R$ {Number(order.commission_amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {order.order_notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminWaiterReports;