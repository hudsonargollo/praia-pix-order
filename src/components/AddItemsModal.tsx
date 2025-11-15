import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, Minus, ShoppingCart, AlertTriangle, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type MenuItem = Tables<"menu_items">;

interface AddItemsModalProps {
  isOpen: boolean;
  orderId: string;
  currentTotal: number;
  hasPIX: boolean;
  onClose: () => void;
  onSuccess: (newTotal: number) => void;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

const COMMISSION_RATE = 0.1;

export const AddItemsModal = ({
  isOpen,
  orderId,
  currentTotal,
  hasPIX,
  onClose,
  onSuccess,
}: AddItemsModalProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  // Fetch menu items
  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .order("name");

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Erro ao carregar itens do cardápio");
    } finally {
      setLoading(false);
    }
  };

  // Filter menu items by search query
  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add item to cart
  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(menuItem.id);
      
      if (existing) {
        newCart.set(menuItem.id, {
          ...existing,
          quantity: existing.quantity + 1,
        });
      } else {
        newCart.set(menuItem.id, {
          menuItem,
          quantity: 1,
        });
      }
      
      return newCart;
    });
  };

  // Remove item from cart
  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(menuItemId);
      
      if (existing && existing.quantity > 1) {
        newCart.set(menuItemId, {
          ...existing,
          quantity: existing.quantity - 1,
        });
      } else {
        newCart.delete(menuItemId);
      }
      
      return newCart;
    });
  };

  // Calculate totals
  const cartItems = Array.from(cart.values());
  const addedAmount = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const newTotal = currentTotal + addedAmount;
  const newCommission = newTotal * COMMISSION_RATE;

  // Handle submit
  const handleSubmit = async () => {
    if (cart.size === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      // Prepare items for API
      const items = cartItems.map((item) => ({
        productId: item.menuItem.id,
        quantity: item.quantity,
      }));

      // Call add-items API endpoint
      const response = await fetch("/api/orders/add-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          items,
          waiterId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erro ao adicionar itens");
      }

      // Show success message
      if (result.pixInvalidated) {
        toast.success("Itens adicionados!", {
          description: "O PIX foi invalidado. Gere um novo PIX com o valor atualizado.",
        });
      } else {
        toast.success("Itens adicionados com sucesso!");
      }

      // Call success callback
      onSuccess(result.newTotal);
      
      // Reset and close
      setCart(new Map());
      setSearchQuery("");
      onClose();
    } catch (error) {
      console.error("Error adding items:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao adicionar itens"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Adicionar Itens ao Pedido
          </DialogTitle>
          <DialogDescription>
            Selecione os itens que deseja adicionar ao pedido
          </DialogDescription>
        </DialogHeader>

        {/* PIX Warning */}
        {hasPIX && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este pedido já possui um PIX gerado. Ao adicionar itens, o PIX será
              invalidado e você precisará gerar um novo com o valor atualizado.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar itens do cardápio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum item encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMenuItems.map((item) => {
                  const cartItem = cart.get(item.id);
                  const quantity = cartItem?.quantity || 0;

                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all ${
                        quantity > 0
                          ? "border-purple-500 bg-purple-50"
                          : "hover:border-purple-300"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {item.description}
                              </p>
                            )}
                            <p className="text-lg font-bold text-purple-600 mt-2">
                              {item.price.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            {quantity > 0 ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Badge variant="secondary" className="min-w-[2rem] justify-center">
                                  {quantity}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addToCart(item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="h-8 px-3"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.size > 0 && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Atual:</span>
                    <span className="font-semibold">
                      {currentTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Itens Adicionados:</span>
                    <span className="font-semibold text-purple-600">
                      +{" "}
                      {addedAmount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <div className="border-t border-purple-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Novo Total:</span>
                    <span className="font-bold text-lg text-purple-600">
                      {newTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Nova Comissão (10%):</span>
                    <span className="font-semibold">
                      {newCommission.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={cart.size === 0 || submitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar {cart.size} {cart.size === 1 ? "Item" : "Itens"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
