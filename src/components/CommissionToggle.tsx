/**
 * CommissionToggle Component
 * 
 * Displays a toggle interface for switching between received (confirmed) 
 * and pending (estimated) commissions. Provides a more compact and 
 * mobile-friendly view compared to separate cards.
 */

import { useState } from "react";
import { CheckCircle, Clock, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateConfirmedCommissions,
  calculateEstimatedCommissions,
  getOrdersByCategory
} from "@/lib/commissionUtils";
import type { Order } from "@/types/commission";

interface CommissionToggleProps {
  /** Array of orders to calculate commissions from */
  orders: Order[];
  /** Optional callback when view changes */
  onViewChange?: (view: 'received' | 'pending') => void;
}

type CommissionView = 'received' | 'pending';

/**
 * Get date range for commission period
 * Returns formatted string showing the period covered by orders
 */
function getCommissionPeriod(orders: Order[]): string {
  if (orders.length === 0) {
    return new Date().toLocaleDateString("pt-BR", { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  const dates = orders.map(order => new Date(order.created_at));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // If all orders are from the same day
  if (minDate.toDateString() === maxDate.toDateString()) {
    return minDate.toLocaleDateString("pt-BR", { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    });
  }

  // If orders span multiple days
  return `${minDate.toLocaleDateString("pt-BR", { 
    day: 'numeric',
    month: 'short'
  })} - ${maxDate.toLocaleDateString("pt-BR", { 
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })}`;
}

/**
 * CommissionToggle displays a toggle interface for viewing confirmed
 * (received) or estimated (pending) commissions with smooth transitions.
 */
export function CommissionToggle({ orders, onViewChange }: CommissionToggleProps) {
  const [activeView, setActiveView] = useState<CommissionView>('received');

  const confirmedCommission = calculateConfirmedCommissions(orders);
  const estimatedCommission = calculateEstimatedCommissions(orders);
  const paidOrdersCount = getOrdersByCategory(orders, 'PAID').length;
  const pendingOrdersCount = getOrdersByCategory(orders, 'PENDING').length;
  const totalCommission = confirmedCommission + estimatedCommission;
  const commissionPeriod = getCommissionPeriod(orders);

  const handleToggle = (view: CommissionView) => {
    setActiveView(view);
    onViewChange?.(view);
  };

  const displayAmount = activeView === 'received' ? confirmedCommission : estimatedCommission;
  const displayCount = activeView === 'received' ? paidOrdersCount : pendingOrdersCount;
  const displayLabel = activeView === 'received' 
    ? (paidOrdersCount === 1 ? 'pedido pago' : 'pedidos pagos')
    : (pendingOrdersCount === 1 ? 'pedido pendente' : 'pedidos pendentes');

  return (
    <Card className="border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-lg">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Suas Comissões do Período
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">{commissionPeriod}</span>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex gap-2 mt-3">
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
        {/* Commission Breakdown - Always Visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Confirmed Commissions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-green-200/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">Confirmadas</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {confirmedCommission.toLocaleString("pt-BR", { 
                style: "currency", 
                currency: "BRL" 
              })}
            </div>
            <p className="text-xs text-gray-600">
              {paidOrdersCount} {paidOrdersCount === 1 ? 'pedido pago' : 'pedidos pagos'}
            </p>
          </div>

          {/* Estimated Commissions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-yellow-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">Estimadas</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {estimatedCommission.toLocaleString("pt-BR", { 
                style: "currency", 
                currency: "BRL" 
              })}
            </div>
            <p className="text-xs text-gray-600">
              {pendingOrdersCount} {pendingOrdersCount === 1 ? 'pedido pendente' : 'pedidos pendentes'}
            </p>
          </div>
        </div>

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
