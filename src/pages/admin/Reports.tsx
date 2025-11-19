import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, ShoppingCart, TrendingUp, Calendar as CalendarIcon, Download, Users, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UniformHeader } from "@/components/UniformHeader";
import { fetchAllWaiters, type WaiterInfo } from "@/lib/waiterUtils";
import { usePrintReport } from "@/hooks/usePrintReport";
import { ReportPrintView } from "@/components/printable/ReportPrintView";

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
}

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("geral");
  const [waiters, setWaiters] = useState<WaiterInfo[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>("");
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { from: today, to: new Date() };
  });

  // Print report hook
  const { printReport, isPrinting, reportData, printRef } = usePrintReport();

  useEffect(() => {
    loadWaiters();
  }, []);

  useEffect(() => {
    loadStats();
  }, [dateRange, selectedWaiterId, activeTab]);

  const loadWaiters = async () => {
    const waitersList = await fetchAllWaiters();
    setWaiters(waitersList);
  };

  const loadStats = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("orders")
        .select("*")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .is("deleted_at", null);

      // Filter by waiter if individual report
      if (activeTab === "individual" && selectedWaiterId) {
        query = query.eq("waiter_id", selectedWaiterId);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      const completed = orders?.filter((o) => o.status === "completed") || [];
      const paid = orders?.filter((o) => o.payment_confirmed_at) || [];

      const totalRevenue = paid.reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        totalOrders: orders?.length || 0,
        completedOrders: completed.length,
        totalRevenue,
        averageOrderValue: paid.length > 0 ? totalRevenue / paid.length : 0,
      });

      // Calculate daily stats
      const dailyMap = new Map<string, { orders: number; revenue: number }>();
      paid.forEach((order) => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        const existing = dailyMap.get(date) || { orders: 0, revenue: 0 };
        dailyMap.set(date, {
          orders: existing.orders + 1,
          revenue: existing.revenue + Number(order.total_amount),
        });
      });

      const daily = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyStats(daily);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const waiterName = selectedWaiterId 
      ? waiters.find(w => w.id === selectedWaiterId)?.display_name || "garcom"
      : "geral";
    
    const headers = ["Data", "Pedidos", "Receita"];
    const rows = dailyStats.map((d) => [
      format(new Date(d.date), "dd/MM/yyyy"),
      d.orders,
      `R$ ${d.revenue.toFixed(2)}`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${waiterName}-${format(dateRange.from, "dd-MM-yyyy")}-${format(dateRange.to, "dd-MM-yyyy")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const handlePrintReport = () => {
    const waiterName = selectedWaiterId 
      ? waiters.find(w => w.id === selectedWaiterId)?.display_name || waiters.find(w => w.id === selectedWaiterId)?.full_name
      : undefined;

    printReport({
      dateRange,
      stats,
      dailyStats,
      waiterName,
      reportType: activeTab as "geral" | "individual",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <UniformHeader title="Relatórios" />

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-white shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="geral" 
              className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg"
            >
              Geral
            </TabsTrigger>
            <TabsTrigger 
              value="individual" 
              className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg"
            >
              Por Garçom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4 mt-4">
            {/* Date Range & Export */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="text-sm font-medium">
                  {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <CalendarIcon className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Período</span>
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
                  <Button 
                    onClick={handlePrintReport} 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-none"
                    disabled={isPrinting || loading}
                  >
                    <Printer className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="p-4 bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Pedidos</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-white to-green-50 border-0 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Receita</p>
                    <p className="text-xl font-bold text-green-600">R$ {stats.totalRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-white to-purple-50 border-0 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Ticket Médio</p>
                    <p className="text-xl font-bold text-purple-600">R$ {stats.averageOrderValue.toFixed(0)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-white to-indigo-50 border-0 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Concluídos</p>
                    <p className="text-2xl font-bold">{stats.completedOrders}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Daily Table */}
            <Card className="p-4">
              <h3 className="font-bold text-lg mb-3">Vendas Diárias</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Data</th>
                      <th className="text-right py-2 px-2">Pedidos</th>
                      <th className="text-right py-2 px-2">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="text-center py-8">Carregando...</td></tr>
                    ) : dailyStats.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-8 text-gray-500">Sem dados</td></tr>
                    ) : (
                      dailyStats.map((day) => (
                        <tr key={day.date} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{format(new Date(day.date), "dd/MM/yyyy (EEE)", { locale: ptBR })}</td>
                          <td className="text-right py-2 px-2 font-semibold">{day.orders}</td>
                          <td className="text-right py-2 px-2 font-bold text-green-600">R$ {day.revenue.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {dailyStats.length > 0 && (
                    <tfoot>
                      <tr className="font-bold bg-gray-100">
                        <td className="py-2 px-2">Total</td>
                        <td className="text-right py-2 px-2">{dailyStats.reduce((sum, d) => sum + d.orders, 0)}</td>
                        <td className="text-right py-2 px-2 text-green-600">
                          R$ {dailyStats.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4 mt-4">
            {/* Waiter Selection */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex-1 w-full">
                  <Select value={selectedWaiterId} onValueChange={setSelectedWaiterId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um garçom..." />
                    </SelectTrigger>
                    <SelectContent>
                      {waiters.map((waiter) => (
                        <SelectItem key={waiter.id} value={waiter.id}>
                          {waiter.display_name || waiter.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <CalendarIcon className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Período</span>
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
                  <Button 
                    onClick={handlePrintReport} 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-none"
                    disabled={!selectedWaiterId || isPrinting || loading}
                  >
                    <Printer className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={!selectedWaiterId}>
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </div>
              </div>
            </Card>

            {selectedWaiterId ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="p-4 bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Pedidos</p>
                        <p className="text-2xl font-bold">{stats.totalOrders}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-white to-green-50 border-0 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Receita</p>
                        <p className="text-xl font-bold text-green-600">R$ {stats.totalRevenue.toFixed(0)}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-white to-purple-50 border-0 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Ticket Médio</p>
                        <p className="text-xl font-bold text-purple-600">R$ {stats.averageOrderValue.toFixed(0)}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-white to-indigo-50 border-0 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">✓</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Concluídos</p>
                        <p className="text-2xl font-bold">{stats.completedOrders}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Daily Table */}
                <Card className="p-4">
                  <h3 className="font-bold text-lg mb-3">Vendas Diárias</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Data</th>
                          <th className="text-right py-2 px-2">Pedidos</th>
                          <th className="text-right py-2 px-2">Receita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={3} className="text-center py-8">Carregando...</td></tr>
                        ) : dailyStats.length === 0 ? (
                          <tr><td colSpan={3} className="text-center py-8 text-gray-500">Sem dados</td></tr>
                        ) : (
                          dailyStats.map((day) => (
                            <tr key={day.date} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-2">{format(new Date(day.date), "dd/MM/yyyy (EEE)", { locale: ptBR })}</td>
                              <td className="text-right py-2 px-2 font-semibold">{day.orders}</td>
                              <td className="text-right py-2 px-2 font-bold text-green-600">R$ {day.revenue.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {dailyStats.length > 0 && (
                        <tfoot>
                          <tr className="font-bold bg-gray-100">
                            <td className="py-2 px-2">Total</td>
                            <td className="text-right py-2 px-2">{dailyStats.reduce((sum, d) => sum + d.orders, 0)}</td>
                            <td className="text-right py-2 px-2 text-green-600">
                              R$ {dailyStats.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Selecione um garçom para ver o relatório</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden print component */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {reportData && (
            <ReportPrintView
              dateRange={reportData.dateRange}
              stats={reportData.stats}
              dailyStats={reportData.dailyStats}
              waiterName={reportData.waiterName}
              reportType={reportData.reportType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
