/**
 * OrderEditModal Component
 * 
 * Modal for viewing and editing order details.
 * Allows waiters to modify order items, quantities, and see updated totals.
 * Prevents editing for paid, completed, or cancelled orders.
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OrderItemRow, type OrderItem } from "./OrderItemRow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { formatOrderNumber, canEditOrder } from "@/lib/orderUtils";
import type { Order } from "@/types/commission";

interface OrderEditModalProps {
  /** The order to display/edit */
  order: Order | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when order is saved */
  onSave?: (updatedOrder: Order) => Promise<void>;
}

/**
 * OrderEditModal displays order details and allows editing
 * for orders that haven't been paid or cancelled.
 */
export function OrderEditModal({ 
  order, 
  isOpen, 
  onClose,
  onSave 
}: OrderEditModalProps) {
  const [isEditable, setIsEditable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isModified, setIsModified] = useState(false);

  // Load order items from database
  useEffect(() => {
    if (!order || !isOpen) {
      setItems([]);
      setIsModified(false);
      return;
    }

    const loadOrderItems = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setItems(data || []);
      } catch (error) {
        console.error('Error loading order items:', error);
        toast.error('Erro ao carregar itens do pedido');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderItems();
  }, [order, isOpen]);

  // Determine if order can be edited based on status
  useEffect(() => {
    if (!order) {
      setIsEditable(false);
      return;
    }

    // Use centralized utility function to determine editability
    setIsEditable(canEditOrder(order));
  }, [order]);

  // Get appropriate message for non-editable orders
  const getNonEditableMessage = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus === 'cancelled') {
      return 'Este pedido foi cancelado e não pode ser editado.';
    }
    
    if (lowerStatus === 'paid' || lowerStatus === 'completed') {
      return 'Este pedido já foi pago e não pode ser editado.';
    }
    
    if (lowerStatus === 'pending_payment') {
      return 'Este pedido está aguardando pagamento e não pode ser editado.';
    }
    
    if (lowerStatus === 'ready') {
      return 'Este pedido já está pronto e não pode ser editado.';
    }
    
    return 'Este pedido não pode ser editado no momento.';
  };

  // Calculate order total and commission in real-time
  const orderTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const commission = orderTotal * 0.1;
  
  // Track original values for comparison
  const originalTotal = order?.total_amount || 0;
  const originalCommission = originalTotal * 0.1;
  const hasValueChanged = Math.abs(orderTotal - originalTotal) > 0.01;

  // Handle quantity change
  const handleQuantityChange = (itemId: string, delta: number) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, Math.min(99, item.quantity + delta));
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
    setIsModified(true);
  };

  // Handle item removal
  const handleRemoveItem = (itemId: string) => {
    if (items.length <= 1) {
      toast.error('O pedido deve ter pelo menos um item');
      return;
    }
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    setIsModified(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!order) {
      toast.error('Pedido não encontrado');
      return;
    }

    if (items.length === 0) {
      toast.error('O pedido deve ter pelo menos um item');
      return;
    }

    setIsSaving(true);
    try {
      // Delete existing order items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Insert updated items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // Update order total and commission
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          total_amount: orderTotal,
          commission_amount: commission,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast.success('Pedido atualizado com sucesso!');
      
      if (onSave) {
        // The commission_amount will be automatically calculated by the database trigger
        await onSave({ ...order, total_amount: orderTotal });
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error saving order:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Erro ao atualizar pedido. Tente novamente.';
      
      if (error?.message?.includes('permission') || error?.code === '42501') {
        errorMessage = 'Você não tem permissão para editar este pedido.';
      } else if (error?.message?.includes('foreign key') || error?.code === '23503') {
        errorMessage = 'Erro: Item do menu não encontrado.';
      } else if (error?.message?.includes('not null') || error?.code === '23502') {
        errorMessage = 'Erro: Dados obrigatórios estão faltando.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!order) {
    return null;
  }

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

  // Capitalize first letter of customer name
  const capitalizedCustomerName = order.customer_name 
    ? order.customer_name.charAt(0).toUpperCase() + order.customer_name.slice(1).toLowerCase()
    : 'Não informado';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] sm:w-full max-h-[96vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl m-2 sm:m-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              {formatOrderNumber(order)}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 flex-shrink-0 touch-manipulation hover:bg-gray-100 rounded-full"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Non-editable warning */}
        {!isEditable && (
          <div className="px-4 sm:px-6 pt-3 sm:pt-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm leading-relaxed">
                {getNonEditableMessage(order.status)}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {/* Order Information */}
          <div className="space-y-4 sm:space-y-5">
          {/* Customer Name and Status on same line */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Cliente</label>
              <p className="text-base sm:text-lg font-bold text-gray-900 break-words leading-tight">
                {capitalizedCustomerName}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Badge variant={getStatusVariant(order.status)} className="text-xs font-semibold px-3 py-1">
                {getStatusLabel(order.status)}
              </Badge>
            </div>
          </div>

          {/* Phone and Date in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {order.customer_phone && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Telefone</label>
                <p className="text-sm font-medium text-gray-900">{formatPhoneNumber(order.customer_phone)}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Data do Pedido</label>
              <p className="text-sm font-medium text-gray-900">
                {new Date(order.created_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>

          {/* Order Items Section */}
          <div className="border-t pt-3 sm:pt-5 -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Itens do Pedido</h3>
              {/* Add items button removed - use AddItemsModal from WaiterDashboard instead */}
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-8 sm:w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                <p className="text-sm font-medium">Carregando itens...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhum item encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <OrderItemRow
                    key={item.id}
                    item={item}
                    isEditable={isEditable}
                    onQuantityChange={(delta) => handleQuantityChange(item.id, delta)}
                    onRemove={() => handleRemoveItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Order Totals */}
          <div className={`border-t pt-4 space-y-3 transition-all duration-300 -mx-4 sm:mx-0 px-4 sm:px-0 mb-4 ${
            hasValueChanged ? 'bg-gradient-to-br from-purple-50 to-indigo-50 py-4 rounded-xl border-2 border-purple-200 shadow-sm' : ''
          }`}>
            {/* Total Amount */}
            <div className="flex justify-between items-start gap-3">
              <div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600 block mb-1">Total do Pedido</span>
                {hasValueChanged && (
                  <span className="text-xs text-gray-500 line-through">
                    {originalTotal.toLocaleString("pt-BR", { 
                      style: "currency", 
                      currency: "BRL" 
                    })}
                  </span>
                )}
              </div>
              <span className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${
                hasValueChanged ? 'text-purple-600' : 'text-gray-900'
              }`}>
                {orderTotal.toLocaleString("pt-BR", { 
                  style: "currency", 
                  currency: "BRL" 
                })}
              </span>
            </div>

            {/* Commission Amount */}
            <div className="flex justify-between items-start gap-3 pb-3 border-b border-gray-200">
              <div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600 block mb-1">Comissão (10%)</span>
                {hasValueChanged && (
                  <span className="text-xs text-gray-500 line-through">
                    {originalCommission.toLocaleString("pt-BR", { 
                      style: "currency", 
                      currency: "BRL" 
                    })}
                  </span>
                )}
              </div>
              <span className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${
                hasValueChanged ? 'text-purple-600' : 'text-green-600'
              }`}>
                {commission.toLocaleString("pt-BR", { 
                  style: "currency", 
                  currency: "BRL" 
                })}
              </span>
            </div>

            {/* Change Indicator */}
            {hasValueChanged && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-purple-700">Diferença:</span>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      orderTotal > originalTotal ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {orderTotal > originalTotal ? '+' : ''}
                      {(orderTotal - originalTotal).toLocaleString("pt-BR", { 
                        style: "currency", 
                        currency: "BRL" 
                      })}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Comissão: {orderTotal > originalTotal ? '+' : ''}
                      {(commission - originalCommission).toLocaleString("pt-BR", { 
                        style: "currency", 
                        currency: "BRL" 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Reminder */}
            {isModified && (
              <Alert className="bg-purple-100 border-purple-300">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800 text-xs sm:text-sm font-medium">
                  💡 Valores atualizados. Clique em "Salvar Alterações" para confirmar.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        </div>

        {/* Sticky Footer */}
        <DialogFooter className="px-5 sm:px-6 py-4 sm:py-5 border-t bg-white flex-shrink-0 flex-col-reverse sm:flex-row gap-3 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto min-h-[52px] sm:min-h-[44px] touch-manipulation text-base font-semibold hover:bg-gray-50 border-2 border-gray-300 rounded-xl"
            aria-label={isEditable ? 'Cancelar edição' : 'Fechar detalhes'}
          >
            {isEditable ? 'Cancelar' : 'Fechar'}
          </Button>
          {isEditable && (
            <Button
              onClick={handleSave}
              disabled={isSaving || !isModified || items.length === 0}
              className="w-full sm:w-auto min-h-[52px] sm:min-h-[44px] touch-manipulation text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 shadow-md rounded-xl"
              aria-label="Salvar alterações do pedido"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
