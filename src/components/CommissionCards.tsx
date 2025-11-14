/**
 * CommissionCards Component
 * 
 * Displays dual card layout showing confirmed and estimated commissions.
 * Provides clear visual distinction between paid orders (confirmed) and
 * pending orders (estimated) with appropriate color themes and icons.
 */

import { CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateConfirmedCommissions,
  calculateEstimatedCommissions,
  getOrdersByCategory
} from "@/lib/commissionUtils";
import type { Order } from "@/types/commission";

interface CommissionCardsProps {
  /** Array of orders to calculate commissions from */
  orders: Order[];
}

/**
 * CommissionCards displays confirmed and estimated commission totals
 * in a dual-card layout with visual indicators and order counts.
 */
export function CommissionCards({ orders }: CommissionCardsProps) {
  const confirmedCommission = calculateConfirmedCommissions(orders);
  const estimatedCommission = calculateEstimatedCommissions(orders);
  const paidOrdersCount = getOrdersByCategory(orders, 'PAID').length;
  const pendingOrdersCount = getOrdersByCategory(orders, 'PENDING').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Confirmed Commissions Card */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Comissões Confirmadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {confirmedCommission.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })}
          </div>
          <p className="text-sm text-gray-600">
            De {paidOrdersCount} {paidOrdersCount === 1 ? 'pedido pago' : 'pedidos pagos'}
          </p>
        </CardContent>
      </Card>

      {/* Estimated Commissions Card */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <Clock className="w-5 h-5" />
            Comissões Estimadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {estimatedCommission.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })}
          </div>
          <p className="text-sm text-gray-600">
            De {pendingOrdersCount} {pendingOrdersCount === 1 ? 'pedido pendente' : 'pedidos pendentes'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Aguardando confirmação de pagamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
