import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { OrderChatPanel } from "@/components/OrderChatPanel";

interface OrderItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface OrderEditDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: () => void;
}

export function OrderEditDialog({
  orderId,
  open,
  onOpenChange,
  onOrderUpdated,
}: OrderEditDialogProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerPhone, setCustomerPhone] = useState<string>("");

  useEffect(() => {
    if (open && orderId) {
      loadOrderData();
      loadOrderItems();
      loadMenuItems();
    } else if (!open) {
      // Reset state when dialog closes
      setTimeout(() => {
        setItems([]);
        setMenuItems([]);
        setCustomerPhone("");
        setLoading(false);
      }, 200);
    }
  }, [open, orderId]);

  const loadOrderData = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_phone")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setCustomerPhone(data?.customer_phone || "");
    } catch (error) {
      console.error("Error loading order data:", error);
      toast.error("Erro ao carregar dados do pedido");
    }
  };

  const loadOrderItems = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading order items:", error);
      toast.error("Erro ao carregar itens do pedido");
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price")
        .eq("available", true)
        .order("name");

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error loading menu items:", error);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    // Check if this is the last item before attempting to remove
    if (items.length <= 1) {
      toast.error("Não é possível remover todos os itens. O pedido deve ter pelo menos um item.");
      return;
    }
    
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const addItem = (menuItem: MenuItem) => {
    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      quantity: 1,
      unit_price: menuItem.price,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const saveChanges = async () => {
    if (!orderId) return;

    // Validate that we have items
    if (items.length === 0) {
      toast.error("O pedido deve ter pelo menos um item.");
      return;
    }

    try {
      setSaving(true);

      // Step 1: Get current items from database
      const { data: currentItems, error: fetchError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error("Erro ao carregar itens atuais");
      }

      // Step 2: Determine what changed
      const currentItemIds = new Set(currentItems?.map(item => item.id) || []);
      const newItemIds = new Set(items.filter(item => !item.id.startsWith('temp-')).map(item => item.id));
      
      // Items to delete (in current but not in new)
      const itemsToDelete = currentItems?.filter(item => !newItemIds.has(item.id)) || [];
      
      // Items to update (existing items with changes)
      const itemsToUpdate = items.filter(item => 
        !item.id.startsWith('temp-') && currentItemIds.has(item.id)
      );
      
      // Items to insert (new items with temp IDs)
      const itemsToInsert = items.filter(item => item.id.startsWith('temp-'));

      // Step 3: Delete removed items
      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("order_items")
          .delete()
          .in('id', itemsToDelete.map(item => item.id));

        if (deleteError) {
          console.error("Delete error:", deleteError);
          throw new Error("Erro ao remover itens");
        }
      }

      // Step 4: Update existing items
      for (const item of itemsToUpdate) {
        const { error: updateError } = await supabase
          .from("order_items")
          .update({
            quantity: item.quantity,
            unit_price: item.unit_price,
          })
          .eq('id', item.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw new Error("Erro ao atualizar itens");
        }
      }

      // Step 5: Insert new items
      if (itemsToInsert.length > 0) {
        const newItems = itemsToInsert.map((item) => ({
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: insertError } = await supabase
          .from("order_items")
          .insert(newItems);

        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error("Erro ao adicionar novos itens");
        }
      }

      // Step 6: Update order total
      const newTotal = items.reduce(
        (sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)),
        0
      );

      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({ total_amount: newTotal })
        .eq("id", orderId);

      if (updateOrderError) {
        console.error("Update order error:", updateOrderError);
        throw new Error("Erro ao atualizar total do pedido");
      }

      toast.success("Pedido atualizado com sucesso!");
      
      // Update parent first
      onOrderUpdated();
      
      // Then close dialog
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (error: any) {
      console.error("Error saving order changes:", error);
      toast.error(error.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-purple-600 to-indigo-600">
          <DialogTitle className="text-2xl font-bold text-white">✏️ Editar Pedido</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Carregando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Left Column: Order Items */}
            <div className="space-y-6">
            {/* Current Items */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">📋 Itens do Pedido</h3>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">Nenhum item no pedido</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-100 hover:border-purple-200 transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.item_name}</p>
                        <p className="text-sm text-gray-600">
                          R$ {Number(item.unit_price).toFixed(2)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 hover:bg-purple-100 hover:text-purple-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-bold text-purple-600">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-8 w-8 hover:bg-purple-100 hover:text-purple-700"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        disabled={items.length === 1}
                        title={items.length === 1 ? "Não é possível remover o último item" : "Remover item"}
                        className="h-9 w-9 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="text-right min-w-[90px]">
                        <p className="font-bold text-lg text-purple-600">
                          R$ {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Items */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">➕ Adicionar Itens</h3>
              <div className="grid grid-cols-2 gap-3 max-h-[240px] overflow-y-auto p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                {menuItems.map((menuItem) => (
                  <Button
                    key={menuItem.id}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => addItem(menuItem)}
                    className="justify-start h-auto py-3 px-4 bg-white hover:bg-purple-50 hover:border-purple-300 border-2 transition-all"
                  >
                    <div className="text-left w-full">
                      <p className="font-semibold text-sm text-gray-900">{menuItem.name}</p>
                      <p className="text-xs text-purple-600 font-medium mt-1">
                        R$ {Number(menuItem.price).toFixed(2)}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white">💰 Total:</span>
                <span className="text-3xl font-bold text-white">R$ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
            </div>

            {/* Right Column: Chat Panel */}
            <div className="flex flex-col h-full min-h-[500px]">
              {orderId && customerPhone ? (
                <OrderChatPanel orderId={orderId} customerPhone={customerPhone} />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm">Carregando chat...</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 bg-gray-50 border-t gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 py-6 text-base font-semibold border-2 hover:bg-gray-100"
          >
            Cancelar
          </Button>
          <Button 
            onClick={saveChanges} 
            disabled={saving || items.length === 0}
            className="flex-1 py-6 text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
