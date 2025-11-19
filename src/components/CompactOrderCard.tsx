import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderCardInfo } from "@/components/OrderCardInfo";
import type { OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { ChevronDown, ChevronUp, Eye, MessageSquare } from "lucide-react";
import type { Order } from "@/integrations/supabase/realtime";

interface CompactOrderCardProps {
  order: Order;
  onViewDetails?: () => void;
  onNotify?: () => void;
  formatTimeWithAMPM: (timestamp: string) => string;
}

export const CompactOrderCard = ({ 
  order, 
  onViewDetails, 
  onNotify,
  formatTimeWithAMPM 
}: CompactOrderCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
      {/* Compact Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-gray-900">
              #{order.order_number}
            </h3>
            <StatusBadge 
              orderStatus={order.status as OrderStatus}
              paymentStatus={order.payment_status as PaymentStatus}
              showBoth={false}
              compact={true}
            />
          </div>
          <p className="text-sm font-medium text-gray-700 truncate">
            {order.customer_name}
          </p>
          <p className="text-xs text-gray-500">
            {formatTimeWithAMPM(order.created_at)}
          </p>
        </div>
        
        <div className="text-right shrink-0">
          <p className="font-bold text-xl text-purple-600">
            R$ {Number(order.total_amount).toFixed(2)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 h-7 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Mais
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t pt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <OrderCardInfo
            orderNumber={order.order_number}
            customerName={order.customer_name}
            customerPhone={order.customer_phone}
            waiterId={order.waiter_id}
            createdAt={order.created_at}
          />
          
          {/* Items List */}
          {order.items && order.items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Itens do Pedido:</p>
              <div className="space-y-1">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium text-gray-900">
                      R$ {Number(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                Detalhes
              </Button>
            )}
            {onNotify && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNotify}
                className="flex-1"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Notificar
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
