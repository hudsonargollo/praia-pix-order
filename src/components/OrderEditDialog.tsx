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

  useEffect(() => {
    if (open && orderId) {
      loadOrderItems();
      loadMenuItems();
    } else if (!open) {
      // Reset state when dialog closes
      setItems([]);
      setMenuItems([]);
      setLoading(false);
      setSaving(false);
    }
  }, [open, orderId]);

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
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== itemId);
      console.log('Removing item:', itemId, 'Remaining items:', filtered.length);
      
      // Prevent removing the last item
      if (filtered.length === 0) {
        toast.error("Não é possível remover todos os itens. O pedido deve ter pelo menos um item.");
        return prev;
      }
      
      return filtered;
    });
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
        (sum, item) => sum + item.quantity * item.unit_price,
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
      onOrderUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving order changes:", error);
      toast.error(error.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Items */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Itens do Pedido
              </Label>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum item no pedido
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {item.unit_price.toFixed(2)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          disabled={items.length === 1}
                          title={items.length === 1 ? "Não é possível remover o último item" : "Remover item"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="font-bold">
                          R$ {(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Items */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Adicionar Itens
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
                {menuItems.map((menuItem) => (
                  <Button
                    key={menuItem.id}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => addItem(menuItem)}
                    className="justify-start h-auto py-2"
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{menuItem.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {menuItem.price.toFixed(2)}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={saveChanges} disabled={saving || items.length === 0}>
            {saving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
