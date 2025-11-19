import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface ReportPrintViewProps {
  dateRange: { from: Date; to: Date };
  stats: OrderStats;
  dailyStats: DailyStats[];
  waiterName?: string;
  reportType?: "geral" | "individual";
}

export const ReportPrintView = ({
  dateRange,
  stats,
  dailyStats,
  waiterName,
  reportType = "geral",
}: ReportPrintViewProps) => {
  const generatedAt = new Date();
  const totalDailyOrders = dailyStats.reduce((sum, d) => sum + d.orders, 0);
  const totalDailyRevenue = dailyStats.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="report-print-view">
      {/* Header */}
      <div className="report-header">
        <h1 className="report-title">Coco Loko Açaiteria</h1>
        <h2 className="report-subtitle">
          Relatório {reportType === "individual" ? "Individual" : "Geral"} de Vendas
        </h2>
        {waiterName && (
          <p className="report-waiter">Garçom: {waiterName}</p>
        )}
        <p className="report-period">
          Período: {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} até{" "}
          {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
        </p>
        <p className="report-generated">
          Gerado em: {format(generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="report-summary">
        <h3 className="summary-title">Resumo do Período</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total de Pedidos</div>
            <div className="summary-value">{stats.totalOrders}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Pedidos Concluídos</div>
            <div className="summary-value">{stats.completedOrders}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Receita Total</div>
            <div className="summary-value summary-revenue">
              R$ {stats.totalRevenue.toFixed(2)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Ticket Médio</div>
            <div className="summary-value">
              R$ {stats.averageOrderValue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="report-daily">
        <h3 className="daily-title">Vendas Diárias</h3>
        <table className="daily-table">
          <thead>
            <tr>
              <th className="table-header">Data</th>
              <th className="table-header table-header-right">Pedidos</th>
              <th className="table-header table-header-right">Receita</th>
            </tr>
          </thead>
          <tbody>
            {dailyStats.length === 0 ? (
              <tr>
                <td colSpan={3} className="table-cell table-empty">
                  Nenhum dado disponível para o período selecionado
                </td>
              </tr>
            ) : (
              dailyStats.map((day) => (
                <tr key={day.date}>
                  <td className="table-cell">
                    {format(new Date(day.date), "dd/MM/yyyy (EEE)", { locale: ptBR })}
                  </td>
                  <td className="table-cell table-cell-right">{day.orders}</td>
                  <td className="table-cell table-cell-right table-cell-revenue">
                    R$ {day.revenue.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {dailyStats.length > 0 && (
            <tfoot>
              <tr className="table-footer">
                <td className="table-cell table-cell-bold">Total</td>
                <td className="table-cell table-cell-right table-cell-bold">
                  {totalDailyOrders}
                </td>
                <td className="table-cell table-cell-right table-cell-bold table-cell-revenue">
                  R$ {totalDailyRevenue.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer */}
      <div className="report-footer">
        <p className="footer-text">
          Este relatório foi gerado automaticamente pelo sistema Coco Loko Açaiteria
        </p>
      </div>
    </div>
  );
};
