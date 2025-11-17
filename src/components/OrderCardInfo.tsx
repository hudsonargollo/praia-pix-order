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
    <div className="space-y-1 sm:space-y-2">
      {/* Customer Info */}
      <div className="space-y-0.5">
        <p className="text-sm sm:text-lg font-medium text-gray-700 leading-tight">
          {customerName}
        </p>
        <p className="text-xs sm:text-base text-gray-600 flex items-center gap-1 leading-tight">
          <span className="text-xs sm:text-sm">📱</span>
          <span className="break-all">{formatPhoneNumber(customerPhone)}</span>
        </p>
      </div>

      {/* Waiter Badge - Compact on mobile */}
      {waiterId && (
        <div className="pt-0.5 sm:pt-1">
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200 py-0">
            <User className="mr-1 h-3 w-3" />
            <span className="text-xs">{getWaiterName(waiterId)}</span>
          </Badge>
        </div>
      )}
    </div>
  );
}
