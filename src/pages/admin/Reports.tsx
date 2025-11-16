import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, ShoppingCart, TrendingUp, Calendar as CalendarIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UniformHeader } from "@/components/UniformHeader";

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem('reports_date_range');
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
    loadStats();
  }, [dateRange]);

  // Persist date range to localStorage
  useEffect(() => {
    localStorage.setItem('reports_date_range', JSON.stringify({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    }));
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setLoading(true);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .is("deleted_at", null);

      if (error) throw error;

      const completed = orders?.filter((o) => o.status === "completed") || [];
      const cancelled = orders?.filter((o) => o.status === "cancelled") || [];
      const paid = orders?.filter((o) => o.payment_confirmed_at) || [];

      const totalRevenue = paid.reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        totalOrders: orders?.length || 0,
        completedOrders: completed.length,
        cancelledOrders: cancelled.length,
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
    a.download = `relatorio-${format(dateRange.from, "dd-MM-yyyy")}-${format(dateRange.to, "dd-MM-yyyy")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Uniform Header */}
      <UniformHeader
        title="Relatórios"
        onBack={() => navigate("/admin")}
      />

      <div className="max-w-7xl mx-auto p-4">
        {/* Date Range Selector */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 w-full sm:w-auto">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Selecionar Período</span>
                    <span className="sm:hidden">Período</span>
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
              <Button onClick={exportToCSV} variant="outline" className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold text-success">
                  R$ {stats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-3xl font-bold text-blue-500">
                  R$ {stats.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">✓</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-3xl font-bold">{stats.completedOrders}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Daily Stats Table */}
        <Card className="p-6">
          <h3 className="font-bold text-xl mb-4">Vendas Diárias</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-right py-3 px-4">Pedidos</th>
                  <th className="text-right py-3 px-4">Receita</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-muted-foreground">
                      Nenhum dado disponível para o período selecionado
                    </td>
                  </tr>
                ) : (
                  dailyStats.map((day) => (
                    <tr key={day.date} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {format(new Date(day.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">{day.orders}</td>
                      <td className="text-right py-3 px-4 font-bold text-success">
                        R$ {day.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {dailyStats.length > 0 && (
                <tfoot>
                  <tr className="font-bold bg-muted/30">
                    <td className="py-3 px-4">Total</td>
                    <td className="text-right py-3 px-4">
                      {dailyStats.reduce((sum, d) => sum + d.orders, 0)}
                    </td>
                    <td className="text-right py-3 px-4 text-success">
                      R$ {dailyStats.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
