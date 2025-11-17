import { getWaiterName } from "@/lib/waiterUtils";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface OrderCardInfoProps {
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  waiterId: string | null;
  createdAt: string;
  paymentConfirmedAt?: string | null;
  readyAt?: string | null;
  kitchenNotifiedAt?: string | null;
}

export function OrderCardInfo({
  orderNumber,
  customerName,
  customerPhone,
  waiterId,
  createdAt,
  paymentConfirmedAt,
  readyAt,
  kitchenNotifiedAt,
}: OrderCardInfoProps) {
  const formatTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 space-y-2 sm:space-y-3">
      {/* Order Number */}
      <h3 className="font-bold text-lg sm:text-2xl text-gray-900 leading-tight">Pedido #{orderNumber}</h3>
      
      {/* Customer Info */}
      <div className="space-y-1">
        <p className="text-sm sm:text-lg font-medium text-gray-700 leading-snug">
          {customerName}
        </p>
        <p className="text-xs sm:text-base text-gray-600 flex items-center gap-1">
          <span className="text-sm">📱</span>
          <span className="break-all">{formatPhoneNumber(customerPhone)}</span>
        </p>
      </div>

      {/* Timestamps - Compact on mobile */}
      <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
        <p className="text-gray-500 leading-tight">
          <span className="font-medium">Criado:</span> {formatTimestamp(createdAt)}
        </p>
        {paymentConfirmedAt && (
          <p className="text-green-600 leading-tight">
            <span className="font-medium">Confirmado:</span> {formatTimestamp(paymentConfirmedAt)}
          </p>
        )}
      </div>

      {/* ID - Compact display */}
      <p className="text-xs text-gray-400 font-mono truncate">
        ID: {createdAt.split('T')[0].replace(/-/g, '')}...
      </p>

      {/* Waiter Badge - Bottom on mobile */}
      {waiterId && (
        <div className="pt-1">
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
            <User className="mr-1 h-3 w-3" />
            {getWaiterName(waiterId)}
          </Badge>
        </div>
      )}
    </div>
  );
}
