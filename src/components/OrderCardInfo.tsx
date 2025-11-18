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
    <div className="space-y-1">
      {/* Customer Info */}
      <div className="text-sm text-gray-700">
        <span className="font-bold">Cliente:</span> {customerName}
      </div>
      <div className="text-sm text-gray-700">
        <span className="font-bold">Telefone:</span> {formatPhoneNumber(customerPhone)}
      </div>

      {/* Waiter Badge - Compact */}
      {waiterId && (
        <div className="pt-1">
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200 h-5 px-2">
            <User className="mr-1 h-3 w-3" />
            {getWaiterName(waiterId)}
          </Badge>
        </div>
      )}
    </div>
  );
}
