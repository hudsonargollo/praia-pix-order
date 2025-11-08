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

    try {
      setSaving(true);

      // Delete all existing items
      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (deleteError) throw deleteError;

      // Insert updated items
      const itemsToInsert = items.map((item) => ({
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: insertError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      // Update order total
      const newTotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      const { error: updateError } = await supabase
        .from("orders")
        .update({ total_amount: newTotal })
        .eq("id", orderId);

      if (updateError) throw updateError;

      toast.success("Pedido atualizado com sucesso!");
      onOrderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving order changes:", error);
      toast.error("Erro ao salvar alterações");
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
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removeItem(item.id)}
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
