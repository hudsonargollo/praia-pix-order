import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, QrCode } from "lucide-react";
import PIXQRGenerator from "./PIXQRGenerator";
import CreditCardPayment from "./CreditCardPayment";

interface GeneratePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: number;
  amount: number;
  customerName: string;
  customerPhone: string;
  onPaymentComplete?: () => void;
}

export function GeneratePaymentDialog({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  customerName,
  customerPhone,
  onPaymentComplete
}: GeneratePaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit_card'>('pix');

  const handlePaymentSuccess = () => {
    onPaymentComplete?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Gerar Pagamento - Pedido #{orderNumber}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p>{customerName}</p>
            <p className="font-bold text-lg text-primary mt-1">
              Total: R$ {amount.toFixed(2)}
            </p>
          </div>
        </DialogHeader>

        <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as 'pix' | 'credit_card')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pix" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              PIX
            </TabsTrigger>
            <TabsTrigger value="credit_card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Cartão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pix" className="mt-4">
            <PIXQRGenerator
              orderId={orderId}
              amount={amount}
              customerInfo={{
                name: customerName,
                phone: customerPhone
              }}
              onPaymentComplete={handlePaymentSuccess}
              onClose={onClose}
              isOpen={isOpen}
              mode="manual"
            />
          </TabsContent>

          <TabsContent value="credit_card" className="mt-4">
            <CreditCardPayment
              orderId={orderId}
              amount={amount}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={(error) => console.error('Card payment error:', error)}
              onPaymentPending={() => console.log('Card payment pending')}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
