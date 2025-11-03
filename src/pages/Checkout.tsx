import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("mesa") || "1";
  
  const cart: CartItem[] = location.state?.cart || [];
  
  const [customerName, setCustomerName] = useState(location.state?.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(location.state?.customerWhatsApp || "");
  const [loading, setLoading] = useState(false);

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          table_number: tableNumber,
          status: "pending_payment",
          total_amount: getTotalPrice(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        item_name: item.name,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("Pedido criado! Aguardando pagamento...");
      navigate(`/order/${order.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <p className="text-muted-foreground mb-4">Carrinho vazio</p>
          <Button onClick={() => navigate(`/menu?mesa=${tableNumber}`)}>
            Voltar ao Cardápio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-ocean text-white p-6 shadow-medium">
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 text-white hover:bg-white/20"
          onClick={() => navigate(`/menu?mesa=${tableNumber}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
        <p className="text-white/90 mt-1">Mesa {tableNumber}</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Order Summary */}
        <Card className="p-4 shadow-soft">
          <h2 className="font-bold text-lg mb-4">Resumo do Pedido</h2>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">R$ {getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Customer Info Form */}
        <Card className="p-6 shadow-soft">
          <h2 className="font-bold text-lg mb-4">Seus Dados</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enviaremos notificações sobre seu pedido
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Processando..." : "Prosseguir para Pagamento"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
