/**
 * CommissionToggle Component
 * 
 * Displays a toggle interface for switching between received (confirmed) 
 * and pending (estimated) commissions. Provides a more compact and 
 * mobile-friendly view compared to separate cards.
 */

import { useState } from "react";
import { CheckCircle, Clock } from "lucide-react";
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
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
      <CardHeader>
        <CardTitle className="text-purple-900">Comissões</CardTitle>
        
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

      <CardContent>
        {/* Selected Commission Amount */}
        <div 
          className="transition-all duration-300 ease-in-out"
          key={activeView}
        >
          <div className={`
            text-4xl font-bold mb-2
            ${activeView === 'received' ? 'text-green-600' : 'text-yellow-600'}
          `}>
            {displayAmount.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            De {displayCount} {displayLabel}
          </p>
          {activeView === 'pending' && (
            <p className="text-xs text-gray-500">
              Aguardando confirmação de pagamento
            </p>
          )}
        </div>

        {/* Overall Total */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Total Geral
            </span>
            <span className="text-lg font-bold text-purple-900">
              {totalCommission.toLocaleString("pt-BR", { 
                style: "currency", 
                currency: "BRL" 
              })}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Recebidas + A Receber
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
