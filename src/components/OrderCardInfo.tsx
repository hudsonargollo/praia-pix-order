import { getWaiterName } from "@/lib/waiterUtils";
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
    <div className="flex-1">
      <h3 className="font-bold text-lg sm:text-xl mb-1">Pedido #{orderNumber}</h3>
      <p className="text-sm sm:text-base text-muted-foreground mb-2">
        {customerName}
      </p>
      {waiterId && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            <User className="mr-1 h-3 w-3" />
            {getWaiterName(waiterId)}
          </Badge>
        </div>
      )}
      <p className="text-sm text-muted-foreground mb-2">
        📱 {customerPhone}
      </p>
      <div className="mt-2 space-y-1">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Criado: {formatTimestamp(createdAt)}
        </p>
        {paymentConfirmedAt && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pago: {formatTimestamp(paymentConfirmedAt)}
          </p>
        )}
        {kitchenNotifiedAt && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Cozinha notificada: {formatTimestamp(kitchenNotifiedAt)}
          </p>
        )}
        {readyAt && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pronto: {formatTimestamp(readyAt)}
          </p>
        )}
      </div>
    </div>
  );
}
