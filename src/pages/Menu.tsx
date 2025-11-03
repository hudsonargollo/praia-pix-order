import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/coco-loko-logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const Menu = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("mesa") || "1";
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsApp, setCustomerWhatsApp] = useState("");
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const { data: categoriesData, error: catError } = await supabase
        .from("menu_categories")
        .select("*")
        .order("display_order");

      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true);

      if (catError) throw catError;
      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error("Error loading menu:", error);
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    // If cart is empty and no customer info, show dialog first
    if (cart.length === 0 && !customerName) {
      setPendingItem(item);
      setShowCustomerDialog(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} adicionado ao carrinho`);
  };

  const handleCustomerInfoSubmit = () => {
    if (!customerName.trim()) {
      toast.error("Por favor, insira seu nome");
      return;
    }
    if (!customerWhatsApp.trim()) {
      toast.error("Por favor, insira seu WhatsApp");
      return;
    }

    setShowCustomerDialog(false);
    
    // Add the pending item to cart
    if (pendingItem) {
      setCart([{ ...pendingItem, quantity: 1 }]);
      toast.success(`${pendingItem.name} adicionado ao carrinho`);
      setPendingItem(null);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find((i) => i.id === itemId)?.quantity || 0;
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const goToCheckout = () => {
    if (cart.length === 0) {
      toast.error("Adicione itens ao carrinho");
      return;
    }
    navigate(`/checkout?mesa=${tableNumber}`, { 
      state: { 
        cart,
        customerName,
        customerWhatsApp 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando cardápio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-ocean text-white p-6 shadow-medium sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <img 
            src={logo} 
            alt="Coco Loko Açaiteria" 
            className="h-16"
          />
          <p className="text-white font-semibold text-lg">Mesa {tableNumber}</p>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(
            (item) => item.category_id === category.id
          );
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id}>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {category.name}
              </h2>
              <div className="grid gap-4">
                {categoryItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <Card key={item.id} className="p-4 shadow-soft hover:shadow-medium transition-shadow">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-primary font-bold mt-2">
                            R$ {item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {quantity > 0 ? (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                                className="h-8 w-8"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-bold">
                                {quantity}
                              </span>
                              <Button
                                size="icon"
                                onClick={() => addToCart(item)}
                                className="h-8 w-8"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                            >
                              Adicionar
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Info Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Olá, informe seus dados:</DialogTitle>
            <DialogDescription>
              Para iniciar seu pedido, precisamos de algumas informações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="(00) 00000-0000"
                value={customerWhatsApp}
                onChange={(e) => setCustomerWhatsApp(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleCustomerInfoSubmit} className="w-full">
            Continuar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-strong">
          <div className="max-w-4xl mx-auto">
            <Button
              size="lg"
              className="w-full"
              onClick={goToCheckout}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ver Carrinho ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}) - R$ {getTotalPrice().toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
