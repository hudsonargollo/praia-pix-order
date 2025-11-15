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
  const paidOrdersCount = filteredOrders.filter(order => {
    const paymentStatus = order.payment_status?.toLowerCase();
    return paymentStatus === 'confirmed' || (!paymentStatus && ['paid', 'completed'].includes(order.status.toLowerCase()));
  }).length;
  const pendingOrdersCount = filteredOrders.filter(order => {
    const paymentStatus = order.payment_status?.toLowerCase();
    return paymentStatus === 'pending' || (!paymentStatus && ['pending', 'pending_payment', 'in_preparation', 'ready'].includes(order.status.toLowerCase()));
  }).length;
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
            <span>Suas Comissões do Período</span>
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
                      mode="range"
                      selected={{ from: customDateRange.from, to: customDateRange.to }}
                      onSelect={(range) => {
                        if (range?.from) {
                          setCustomDateRange({
                            from: startOfDay(range.from),
                            to: range.to ? endOfDay(range.to) : endOfDay(range.from)
                          });
                          if (range.to) {
                            setDateFilter('custom');
                            setIsCalendarOpen(false);
                          }
                        }
                      }}
                      locale={pt}
                      initialFocus
                      numberOfMonths={1}
                    />
                    <div className="p-3 text-xs text-gray-600 border-t bg-gray-50">
                      {!customDateRange.to ? 'Selecione o período desejado' : 'Período selecionado'}
                    </div>
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

      <CardContent className="space-y-4">
        {/* Side-by-side Commission Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Confirmed Commissions */}
          <div 
            className={`
              transition-all duration-300 ease-in-out bg-white/60 backdrop-blur-sm rounded-xl p-5 border-2
              ${activeView === 'received' ? 'border-green-600 shadow-lg scale-105' : 'border-green-200'}
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Confirmadas
                </span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <p className="text-sm text-gray-600">
                    Comissões de pedidos com pagamento confirmado. Estes valores já foram recebidos e estão disponíveis.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="text-3xl font-bold text-green-600 mb-2">
              {confirmedCommission.toLocaleString("pt-BR", { 
                style: "currency", 
                currency: "BRL" 
              })}
            </div>
            <p className="text-sm text-gray-600">
              De {paidOrdersCount} {paidOrdersCount === 1 ? 'pedido pago' : 'pedidos pagos'}
            </p>
            {paidOrdersCount > 0 && (
              <p className="text-xs text-gray-500 bg-green-50 px-3 py-2 rounded-lg border border-green-200 mt-2">
                ✅ Disponíveis
              </p>
            )}
          </div>

          {/* Pending Commissions */}
          <div 
            className={`
              transition-all duration-300 ease-in-out bg-white/60 backdrop-blur-sm rounded-xl p-5 border-2
              ${activeView === 'pending' ? 'border-yellow-600 shadow-lg scale-105' : 'border-yellow-200'}
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-semibold text-gray-700">
                  A Receber
                </span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <p className="text-sm text-gray-600">
                    Comissões estimadas de pedidos aguardando confirmação de pagamento. Estes valores serão confirmados quando o pagamento for recebido.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {estimatedCommission.toLocaleString("pt-BR", { 
                style: "currency", 
                currency: "BRL" 
              })}
            </div>
            <p className="text-sm text-gray-600">
              De {pendingOrdersCount} {pendingOrdersCount === 1 ? 'pedido pendente' : 'pedidos pendentes'}
            </p>
            {pendingOrdersCount > 0 && (
              <p className="text-xs text-gray-500 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200 mt-2">
                💡 Aguardando pagamento
              </p>
            )}
          </div>
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
