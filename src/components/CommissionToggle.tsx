/**
 * CommissionToggle Component
 * 
 * Displays a toggle interface for switching between received (confirmed) 
 * and pending (estimated) commissions with date filtering options.
 */

import { useState } from "react";
import { CheckCircle, Clock, TrendingUp, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  calculateConfirmedCommissions,
  calculateEstimatedCommissions,
  getOrdersByCategory
} from "@/lib/commissionUtils";
import type { Order } from "@/types/commission";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";

interface CommissionToggleProps {
  /** Array of orders to calculate commissions from */
  orders: Order[];
  /** Optional callback when view changes */
  onViewChange?: (view: 'received' | 'pending') => void;
}

type CommissionView = 'received' | 'pending';
type DateFilter = 'today' | 'last7days' | 'thisMonth' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Filter orders by date range
 */
function filterOrdersByDateRange(orders: Order[], dateRange: DateRange): Order[] {
  return orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return isWithinInterval(orderDate, { start: dateRange.from, end: dateRange.to });
  });
}

/**
 * Get date range label for display
 */
function getDateRangeLabel(filter: DateFilter, customRange?: DateRange): string {
  const today = new Date();
  
  switch (filter) {
    case 'today':
      return format(today, "d 'de' MMMM 'de' yyyy", { locale: pt });
    case 'last7days':
      return `${format(subDays(today, 6), "d 'de' MMM", { locale: pt })} - ${format(today, "d 'de' MMM 'de' yyyy", { locale: pt })}`;
    case 'thisMonth':
      return format(today, "MMMM 'de' yyyy", { locale: pt });
    case 'custom':
      if (customRange) {
        return `${format(customRange.from, "d 'de' MMM", { locale: pt })} - ${format(customRange.to, "d 'de' MMM 'de' yyyy", { locale: pt })}`;
      }
      return 'Período personalizado';
    default:
      return '';
  }
}

/**
 * Get date range based on filter type
 */
function getDateRange(filter: DateFilter, customRange?: DateRange): DateRange {
  const today = new Date();
  
  switch (filter) {
    case 'today':
      return {
        from: startOfDay(today),
        to: endOfDay(today)
      };
    case 'last7days':
      return {
        from: startOfDay(subDays(today, 6)),
        to: endOfDay(today)
      };
    case 'thisMonth':
      return {
        from: startOfMonth(today),
        to: endOfMonth(today)
      };
    case 'custom':
      return customRange || { from: startOfMonth(today), to: endOfMonth(today) };
    default:
      return { from: startOfMonth(today), to: endOfMonth(today) };
  }
}

/**
 * CommissionToggle displays a toggle interface for viewing confirmed
 * (received) or estimated (pending) commissions with date filtering.
 */
export function CommissionToggle({ orders, onViewChange }: CommissionToggleProps) {
  const [activeView, setActiveView] = useState<CommissionView>('received');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get current date range
  const currentDateRange = getDateRange(dateFilter, customDateRange);
  
  // Filter orders by date range
  const filteredOrders = filterOrdersByDateRange(orders, currentDateRange);

  const confirmedCommission = calculateConfirmedCommissions(filteredOrders);
  const estimatedCommission = calculateEstimatedCommissions(filteredOrders);
  const paidOrdersCount = getOrdersByCategory(filteredOrders, 'PAID').length;
  const pendingOrdersCount = getOrdersByCategory(filteredOrders, 'PENDING').length;
  const totalCommission = confirmedCommission + estimatedCommission;

  const handleToggle = (view: CommissionView) => {
    setActiveView(view);
    onViewChange?.(view);
  };

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setIsCalendarOpen(false);
    }
  };

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // If no start date, set it
    if (!customDateRange.from || customDateRange.to) {
      setCustomDateRange({ from: startOfDay(date), to: endOfDay(date) });
    } else {
      // Set end date
      const newRange = {
        from: customDateRange.from,
        to: endOfDay(date)
      };
      // Ensure from is before to
      if (newRange.from > newRange.to) {
        setCustomDateRange({ from: newRange.to, to: newRange.from });
      } else {
        setCustomDateRange(newRange);
      }
      setDateFilter('custom');
      setIsCalendarOpen(false);
    }
  };

  const displayAmount = activeView === 'received' ? confirmedCommission : estimatedCommission;
  const displayCount = activeView === 'received' ? paidOrdersCount : pendingOrdersCount;
  const displayLabel = activeView === 'received' 
    ? (paidOrdersCount === 1 ? 'pedido pago' : 'pedidos pagos')
    : (pendingOrdersCount === 1 ? 'pedido pendente' : 'pedidos pendentes');

  const dateRangeLabel = getDateRangeLabel(dateFilter, customDateRange);

  return (
    <Card className="border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Suas Comissões do Período
          </CardTitle>
          
          {/* Date Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-white/80 hover:bg-white">
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{dateRangeLabel}</span>
                <span className="sm:hidden">Filtrar</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleDateFilterChange('today')}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Hoje
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange('last7days')}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Últimos 7 dias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange('thisMonth')}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Este mês
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-gray-100 rounded-sm">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Personalizado
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={handleCustomDateSelect}
                      locale={pt}
                      initialFocus
                    />
                    {customDateRange.from && !customDateRange.to && (
                      <div className="p-3 text-sm text-gray-600 border-t">
                        Selecione a data final
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleToggle('received')}
            className={`
              flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
              transition-all duration-300 ease-in-out
              ${activeView === 'received'
                ? 'bg-green-600 text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            aria-pressed={activeView === 'received'}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Recebidas</span>
            </div>
          </button>
          
          <button
            onClick={() => handleToggle('pending')}
            className={`
              flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
              transition-all duration-300 ease-in-out
              ${activeView === 'pending'
                ? 'bg-yellow-600 text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            aria-pressed={activeView === 'pending'}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>A Receber</span>
            </div>
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selected Commission Detail */}
        <div 
          className="transition-all duration-300 ease-in-out bg-white/60 backdrop-blur-sm rounded-xl p-5 border-2"
          style={{
            borderColor: activeView === 'received' ? 'rgb(22 163 74)' : 'rgb(202 138 4)'
          }}
          key={activeView}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {activeView === 'received' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm font-semibold text-gray-700">
                {activeView === 'received' ? 'Comissões Recebidas' : 'Comissões a Receber'}
              </span>
            </div>
          </div>
          
          <div className={`
            text-4xl font-bold mb-2
            ${activeView === 'received' ? 'text-green-600' : 'text-yellow-600'}
          `}>
            {displayAmount.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            De {displayCount} {displayLabel}
          </p>
          {activeView === 'pending' && (
            <p className="text-xs text-gray-500 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              💡 Aguardando confirmação de pagamento
            </p>
          )}
          {activeView === 'received' && paidOrdersCount > 0 && (
            <p className="text-xs text-gray-500 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              ✅ Comissões confirmadas e disponíveis
            </p>
          )}
        </div>

        {/* Overall Total */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-purple-100">
              Total Geral do Período
            </span>
            <TrendingUp className="w-5 h-5 text-purple-200" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {totalCommission.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })}
          </div>
          <p className="text-xs text-purple-200">
            {confirmedCommission.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })} confirmadas + {estimatedCommission.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })} estimadas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
