import { getWaiterName } from "@/lib/waiterUtils";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Printer } from "lucide-react";
import { usePrintOrder } from "@/hooks/usePrintOrder";
import { OrderReceipt } from "@/components/printable/OrderReceipt";

interface OrderCardInfoProps {
  orderId: string;
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
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  waiterId,
  createdAt,
  paymentConfirmedAt,
  readyAt,
  kitchenNotifiedAt,
}: OrderCardInfoProps) {
  const { printOrder, printOrderPopup, isPrinting, currentOrderData, printRef, generatePlainTextReceipt } = usePrintOrder();

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

  const handlePrint = () => {
    printOrder(orderId);
  };

  const handlePrintPopup = () => {
    printOrderPopup(orderId);
  };

  return (
    <>
      <div className="space-y-1">
        {/* Customer Info */}
        <div className="text-sm text-gray-700">
          <span className="font-bold">Cliente:</span> {customerName}
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-bold">Telefone:</span> {formatPhoneNumber(customerPhone)}
        </div>

        {/* Waiter Badge and Print Button */}
        <div className="pt-1 flex items-center gap-2">
          {waiterId && (
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200 h-5 px-2">
              <User className="mr-1 h-3 w-3" />
              {getWaiterName(waiterId)}
            </Badge>
          )}
          
          {/* Print Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isPrinting}
            className="h-5 px-2 text-xs"
          >
            <Printer className="h-3 w-3 mr-1" />
            {isPrinting ? 'Imprimindo...' : 'Imprimir'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPopup}
            disabled={isPrinting}
            className="h-5 px-2 text-xs"
            title="Método alternativo de impressão"
          >
            <Printer className="h-3 w-3 mr-1" />
            Alt
          </Button>
        </div>
      </div>

      {/* Hidden OrderReceipt for printing */}
      {currentOrderData && (
        <div style={{ display: 'none' }}>
          <OrderReceipt
            ref={printRef}
            plainText={generatePlainTextReceipt(currentOrderData)}
          />
        </div>
      )}
    </>
  );
}
