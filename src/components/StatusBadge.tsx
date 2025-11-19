import * as React from "react";
import { cn } from "@/lib/utils";

// Order status types
export type OrderStatus = 
  | "pending" 
  | "pending_payment" 
  | "paid" 
  | "in_preparation" 
  | "ready" 
  | "completed" 
  | "cancelled" 
  | "expired";

// Payment status types
export type PaymentStatus = 
  | "pending" 
  | "confirmed" 
  | "failed" 
  | "refunded";

interface StatusBadgeProps {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  showBoth?: boolean;
  compact?: boolean;
  className?: string;
}

// Order status configuration
const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  pending_payment: {
    label: "Pedido Criado",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  paid: {
    label: "Pago",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  in_preparation: {
    label: "Em Preparo",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  ready: {
    label: "Pronto",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  completed: {
    label: "Concluído",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  expired: {
    label: "Expirado",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

// Payment status configuration
const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: {
    label: "A PAGAR",
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
  confirmed: {
    label: "PAGO",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  failed: {
    label: "Pagamento Falhou",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  refunded: {
    label: "Reembolsado",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  orderStatus,
  paymentStatus,
  showBoth = false,
  compact = false,
  className,
}) => {
  const baseClasses = cn(
    "inline-flex items-center rounded-full border font-semibold transition-colors",
    compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs",
    className
  );

  // If showing both statuses
  if (showBoth && orderStatus && paymentStatus) {
    const orderConfig = orderStatusConfig[orderStatus];
    const paymentConfig = paymentStatusConfig[paymentStatus];

    return (
      <div className={cn("flex gap-1.5", compact ? "flex-col" : "flex-row flex-wrap")}>
        {/* Order Status Badge */}
        <div className={cn(baseClasses, orderConfig.className)}>
          {compact ? orderConfig.label.substring(0, 10) : orderConfig.label}
        </div>
        {/* Payment Status Badge */}
        <div className={cn(baseClasses, paymentConfig.className)}>
          {compact ? paymentConfig.label.substring(0, 10) : paymentConfig.label}
        </div>
      </div>
    );
  }

  // If showing only payment status
  if (paymentStatus) {
    const config = paymentStatusConfig[paymentStatus];
    return (
      <div className={cn(baseClasses, config.className)}>
        {compact ? config.label.substring(0, 10) : config.label}
      </div>
    );
  }

  // If showing only order status
  if (orderStatus) {
    const config = orderStatusConfig[orderStatus];
    return (
      <div className={cn(baseClasses, config.className)}>
        {compact ? config.label.substring(0, 10) : config.label}
      </div>
    );
  }

  // No status provided
  return null;
};

// Helper function to get order status label
export const getOrderStatusLabel = (status: OrderStatus): string => {
  return orderStatusConfig[status]?.label || status;
};

// Helper function to get payment status label
export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  return paymentStatusConfig[status]?.label || status;
};
