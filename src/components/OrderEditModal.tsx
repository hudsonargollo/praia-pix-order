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

    // Orders cannot be edited if they are paid, completed, or cancelled
    const nonEditableStatuses = ['paid', 'completed', 'cancelled'];
    const canEdit = !nonEditableStatuses.includes(order.status.toLowerCase());
    setIsEditable(canEdit);
  }, [order]);

  // Get appropriate message for non-editable orders
  const getNonEditableMessage = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus === 'cancelled') {
      return 'Este pedido foi cancelado e não pode ser editado.';
    }
    
    if (lowerStatus === 'paid') {
      return 'Este pedido já foi pago e não pode ser editado.';
    }
    
    if (lowerStatus === 'completed') {
      return 'Este pedido já foi concluído e não pode ser editado.';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold pr-2">
              {isEditable ? 'Editar Pedido' : 'Detalhes do Pedido'} #{order.id.substring(0, 8)}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Non-editable warning */}
        {!isEditable && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getNonEditableMessage(order.status)}
            </AlertDescription>
          </Alert>
        )}

        {/* Order Information */}
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">Cliente</label>
              <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                {order.customer_name || 'Não informado'}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(order.status)} className="text-xs">
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </div>
          </div>

          {order.customer_phone && (
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">Telefone</label>
              <p className="text-sm sm:text-base text-gray-900">{order.customer_phone}</p>
            </div>
          )}

          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-600">Data do Pedido</label>
            <p className="text-sm sm:text-base text-gray-900">
              {new Date(order.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>

          {/* Order Items Section */}
          <div className="border-t pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h3 className="text-base sm:text-lg font-semibold">Itens do Pedido</h3>
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Adicionar item será implementado em breve')}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Adicionar Item</span>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm">Carregando itens...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhum item encontrado</p>
              </div>
            ) : (
              <div className="space-y-1">
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
          <div className={`border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3 transition-all duration-300 ${
            hasValueChanged ? 'bg-purple-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4 rounded-lg border-purple-200' : ''
          }`}>
            {/* Total Amount */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm sm:text-base font-medium text-gray-700">Total do Pedido</span>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${
                  hasValueChanged ? 'text-purple-600 animate-pulse' : 'text-gray-900'
                }`}>
                  {orderTotal.toLocaleString("pt-BR", { 
                    style: "currency", 
                    currency: "BRL" 
                  })}
                </span>
                {hasValueChanged && (
                  <span className="text-xs text-gray-500 line-through">
                    {originalTotal.toLocaleString("pt-BR", { 
                      style: "currency", 
                      currency: "BRL" 
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Commission Amount */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600">Comissão (10%)</span>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
                  hasValueChanged ? 'text-purple-600 animate-pulse' : 'text-green-600'
                }`}>
                  {commission.toLocaleString("pt-BR", { 
                    style: "currency", 
                    currency: "BRL" 
                  })}
                </span>
                {hasValueChanged && (
                  <span className="text-xs text-gray-500 line-through">
                    {originalCommission.toLocaleString("pt-BR", { 
                      style: "currency", 
                      currency: "BRL" 
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Change Indicator */}
            {hasValueChanged && (
              <div className="pt-2 border-t border-purple-200">
                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <span className="text-purple-700 font-medium">Diferença:</span>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm sm:text-base font-semibold ${
                      orderTotal > originalTotal ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {orderTotal > originalTotal ? '+' : ''}
                      {(orderTotal - originalTotal).toLocaleString("pt-BR", { 
                        style: "currency", 
                        currency: "BRL" 
                      })}
                    </span>
                    <span className="text-xs text-gray-600">
                      Comissão: {orderTotal > originalTotal ? '+' : ''}
                      {(commission - originalCommission).toLocaleString("pt-BR", { 
                        style: "currency", 
                        currency: "BRL" 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Save Reminder */}
            {isModified && (
              <Alert className="bg-purple-100 border-purple-300 mt-3">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800 text-sm">
                  Valores atualizados. Clique em "Salvar Alterações" para confirmar.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 sm:mt-6 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {isEditable ? 'Cancelar' : 'Fechar'}
          </Button>
          {isEditable && (
            <Button
              onClick={handleSave}
              disabled={isSaving || !isModified || items.length === 0}
              className="w-full sm:w-auto order-1 sm:order-2 min-h-[44px]"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
