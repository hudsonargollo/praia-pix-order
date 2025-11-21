import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

interface PaymentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onRetry?: () => void;
  paymentStatus: {
    status: string;
    message: string;
    canConfirmManually: boolean;
  };
}

export function PaymentConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onRetry,
  paymentStatus,
}: PaymentConfirmationDialogProps) {
  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'approved':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'pending':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-orange-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (paymentStatus.status) {
      case 'approved':
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejeitado</Badge>;
      case 'no_payment_id':
        return <Badge className="bg-gray-500">Sem PIX</Badge>;
      case 'error':
        return <Badge className="bg-orange-500">Erro</Badge>;
      default:
        return <Badge className="bg-gray-500">{paymentStatus.status}</Badge>;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4 mb-2">
            {getStatusIcon()}
            <AlertDialogTitle className="text-center text-xl">
              Status do Pagamento
            </AlertDialogTitle>
          </div>
          <div className="flex justify-center mb-4">
            {getStatusBadge()}
          </div>
          <AlertDialogDescription className="text-center text-base">
            {paymentStatus.message}
          </AlertDialogDescription>
          
          {paymentStatus.canConfirmManually && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium text-center">
                O cliente pagou em dinheiro ou outro método?
              </p>
              <p className="text-xs text-blue-600 text-center mt-2">
                Você pode confirmar o pagamento manualmente
              </p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleCancel} className="w-full sm:w-auto">
            Cancelar
          </AlertDialogCancel>
          {onRetry && paymentStatus.status === 'pending' && (
            <Button
              onClick={() => {
                onRetry();
                onOpenChange(false);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar Novamente
            </Button>
          )}
          {paymentStatus.canConfirmManually && (
            <AlertDialogAction 
              onClick={handleConfirm}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              Confirmar Pagamento
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
