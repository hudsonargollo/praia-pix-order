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
    <div className="flex-1 space-y-3">
      {/* Order Number */}
      <h3 className="font-bold text-xl sm:text-2xl text-gray-900">Pedido #{orderNumber}</h3>
      
      {/* Customer Info */}
      <div className="space-y-1.5">
        <p className="text-base sm:text-lg font-medium text-gray-700">
          {customerName}
        </p>
        <p className="text-sm sm:text-base text-gray-600 flex items-center gap-1.5">
          <span className="text-base">📱</span>
          {formatPhoneNumber(customerPhone)}
        </p>
      </div>

      {/* Waiter Badge */}
      {waiterId && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs sm:text-sm bg-purple-100 text-purple-700 border-purple-200">
            <User className="mr-1.5 h-3.5 w-3.5" />
            {getWaiterName(waiterId)}
          </Badge>
        </div>
      )}

      {/* Timestamps */}
      <div className="pt-2 border-t border-gray-200 space-y-1">
        <p className="text-xs sm:text-sm text-gray-500">
          <span className="font-medium">Criado:</span> {formatTimestamp(createdAt)}
        </p>
        {paymentConfirmedAt && (
          <p className="text-xs sm:text-sm text-green-600">
            <span className="font-medium">Confirmado:</span> {formatTimestamp(paymentConfirmedAt)}
          </p>
        )}
        {kitchenNotifiedAt && (
          <p className="text-xs sm:text-sm text-gray-500">
            <span className="font-medium">Cozinha notificada:</span> {formatTimestamp(kitchenNotifiedAt)}
          </p>
        )}
        {readyAt && (
          <p className="text-xs sm:text-sm text-gray-500">
            <span className="font-medium">Pronto:</span> {formatTimestamp(readyAt)}
          </p>
        )}
      </div>
    </div>
  );
}
