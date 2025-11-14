/**
 * MobileOrderCard Component
 * 
 * Card-based layout for displaying orders on mobile devices.
 * Provides a touch-friendly interface with collapsible details.
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, QrCode, Edit, Lock } from "lucide-react";
import { getCommissionStatus } from "@/lib/commissionUtils";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { formatOrderNumber, canEditOrder } from "@/lib/orderUtils";
import type { Order } from "@/types/commission";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MobileOrderCardProps {
  order: Order;
  onGeneratePIX?: (order: Order) => void;
  canGeneratePIX?: boolean;
  onClick?: (order: Order) => void;
}

export function MobileOrderCard({ order, onGeneratePIX, canGeneratePIX = false, onClick }: MobileOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const commissionStatus = getCommissionStatus(order);
  
  // Get icon component based on commission status
  const IconComponent = commissionStatus.icon === 'CheckCircle' ? CheckCircle : 
                       commissionStatus.icon === 'Clock' ? Clock : XCircle;

  // Get status variant and label
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary";
      case "pending_payment":
        return "destructive";
      case "paid":
        return "default";
      case "in_preparation":
        return "secondary";
      case "ready":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pendente";
      case "pending_payment":
        return "Aguardando Pagamento";
      case "paid":
        return "Pago";
      case "in_preparation":
        return "Em Preparo";
      case "ready":
        return "Pronto";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(order);
    }
  };

  return (
    <Card 
      className="bg-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <CardContent className="p-4">
        {/* Header: Order number and customer name */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-bold text-gray-900">
                {formatOrderNumber(order, false)}
              </span>
              <Badge variant={getStatusVariant(order.status)} className="text-xs">
                {getStatusLabel(order.status)}
              </Badge>
              {canEditOrder(order) ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Edit className="w-3 h-3" />
                        <span className="text-xs font-medium">Editável</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toque para editar este pedido</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs font-medium">Bloqueado</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Este pedido não pode ser editado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {order.customer_name || 'Cliente não informado'}
            </h3>
            {order.customer_phone && (
              <p className="text-sm text-gray-500">{formatPhoneNumber(order.customer_phone)}</p>
            )}
          </div>
          
          {/* Expand/Collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
            aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Body: Amount and commission */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total do Pedido</span>
            <span className="text-lg font-bold text-gray-900">
              {order.total_amount.toLocaleString("pt-BR", { 
                style: "currency", 
                currency: "BRL" 
              })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sua Comissão</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <span className={`text-base font-semibold ${commissionStatus.className}`}>
                      {commissionStatus.displayAmount}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{commissionStatus.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Collapsible details section */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 block">Data do Pedido</span>
                <span className="text-gray-900 font-medium">
                  {new Date(order.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Horário</span>
                <span className="text-gray-900 font-medium">
                  {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>

            {/* PIX Generation button */}
            {canGeneratePIX && onGeneratePIX && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onGeneratePIX(order);
                }}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                variant="outline"
              >
                <QrCode className="w-4 h-4" />
                Gerar PIX
              </Button>
            )}
          </div>
        )}

        {/* Footer: Date and status (visible when collapsed) */}
        {!isExpanded && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>
              {new Date(order.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
