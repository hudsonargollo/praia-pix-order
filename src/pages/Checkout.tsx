import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cartContext";
import CustomerInfoForm, { CustomerInfo } from "@/components/CustomerInfoForm";
import OrderNotesInput from "@/components/OrderNotesInput";

const Checkout = () => {
  const navigate = useNavigate();
  
  const { state: cartState, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: ""
  });
  const [orderNotes, setOrderNotes] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isWaiter, setIsWaiter] = useState(false);
  const [waiterId, setWaiterId] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if cart is empty
    if (cartState.items.length === 0) {
      navigate("/menu");
      return;
    }

    // Check for logged-in user (waiter)
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;
      
      if (role === "waiter") {
        setIsWaiter(true);
        setWaiterId(user.id);
        // Waiter-assisted orders require customer info collection
        setIsEditingInfo(true);
        setCustomerInfo({ name: "", phone: "" });
      } else {
        setIsWaiter(false);
        setWaiterId(null);
        // Load customer info from sessionStorage for regular customers
        const storedCustomerInfo = sessionStorage.getItem("customerInfo");
        if (storedCustomerInfo) {
          try {
            const parsed = JSON.parse(storedCustomerInfo);
            setCustomerInfo(parsed);
          } catch (error) {
            console.error("Error parsing customer info:", error);
            setIsEditingInfo(true);
          }
        } else {
          setIsEditingInfo(true);
        }
      }
    };

    checkUserRole();
  }, [navigate, cartState.items.length]);

  const getTotalPrice = () => {
    return cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCreateOrder = async () => {
    if (cartState.items.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    if (!customerInfo.name?.trim() || !customerInfo.phone?.trim()) {
      toast.error("Por favor, preencha o nome e WhatsApp do cliente");
      setIsEditingInfo(true);
      return;
    }

    // Validate phone number (should be 11 digits)
    const phoneDigits = customerInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      toast.error("WhatsApp deve ter 11 dígitos (DDD + número)");
      setIsEditingInfo(true);
      return;
    }

    // Validate name length
    if (customerInfo.name.trim().length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres");
      setIsEditingInfo(true);
      return;
    }

    // Format phone with +55 prefix for database
    const formattedPhone = `+55${phoneDigits}`;

    // Save customer info to sessionStorage
    sessionStorage.setItem("customerInfo", JSON.stringify(customerInfo));

    setLoading(true);

    try {
      // Determine initial status and waiter ID
      const initialStatus = isWaiter ? "pending" : "pending_payment";
      
      const orderData = {
        customer_name: customerInfo.name,
        customer_phone: formattedPhone,
        table_number: "-", // Placeholder - orders identified by phone
        status: initialStatus,
        total_amount: getTotalPrice(),
        waiter_id: waiterId, // Assign waiter ID if present
        order_notes: orderNotes.trim() || null, // Add order notes
        created_by_waiter: isWaiter, // Flag to indicate waiter-created order
      };

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartState.items.map((item) => ({
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

      // Clear cart after successful order creation
      clearCart();

      toast.success("Pedido criado com sucesso!");
      
      // Navigate based on user role
      if (isWaiter) {
        // Waiter-assisted order is created, redirect to the menu for the next order
        navigate("/menu");
      } else {
        // Regular customer order, redirect to payment
        navigate(`/payment/${order.id}`);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <p className="text-muted-foreground mb-4">Carrinho vazio</p>
          <Button onClick={() => navigate("/menu")}>
            Voltar ao Cardápio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-purple-900 text-white p-6 shadow-medium">
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 text-white hover:bg-white/20"
          onClick={() => navigate("/menu")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
        {customerInfo && customerInfo.name && (
          <p className="text-white/90 mt-1">{customerInfo.name}</p>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Order Summary */}
        <Card className="p-6 shadow-lg border-2 border-purple-100 rounded-2xl">
          <h2 className="font-bold text-xl mb-4 text-purple-900">Resumo do Pedido</h2>
          <div className="space-y-3">
            {cartState.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">
                  <span className="font-bold text-purple-900">{item.quantity}x</span> {item.name}
                </span>
                <span className="font-bold text-cyan-600">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mt-4 flex justify-between font-bold text-xl">
              <span className="text-purple-900">Total</span>
              <span className="text-purple-900">R$ {getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Customer Info */}
        {isEditingInfo || !customerInfo.name || !customerInfo.phone ? (
          <CustomerInfoForm
            onCustomerInfoChange={setCustomerInfo}
            initialData={customerInfo}
          />
        ) : (
          <Card className="p-6 shadow-lg border-2 border-cyan-100 rounded-2xl">
            <h2 className="font-bold text-xl mb-4 text-purple-900">
              {isWaiter ? "Dados do Cliente (Pedido Assistido)" : "Seus Dados"}
            </h2>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                <p className="text-lg">{customerInfo.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">WhatsApp</Label>
                <p className="text-lg">+55 {customerInfo.phone}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingInfo(true)}
                className="mt-2"
              >
                Editar Dados
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Enviaremos notificações sobre seu pedido via WhatsApp.
              </p>
            </div>
          </Card>
        )}

        {/* Order Notes - Only for waiter orders */}
        {isWaiter && (
          <OrderNotesInput
            notes={orderNotes}
            onNotesChange={setOrderNotes}
          />
        )}

        {/* Order Action Button */}
        {(!isEditingInfo && customerInfo.name && customerInfo.phone) && (
          <Card className="p-6 shadow-lg border-2 border-green-100 rounded-2xl">
            <p className="text-sm text-muted-foreground mb-4">
              {isWaiter ? "O pedido será criado com status 'Pendente' e atribuído ao seu ID." : "Enviaremos notificações sobre seu pedido via WhatsApp."}
            </p>
            <Button
              onClick={handleCreateOrder}
              size="lg"
              className="w-full bg-purple-900 hover:bg-purple-800 text-white font-bold py-6 rounded-xl shadow-lg"
              disabled={loading}
            >
              {loading ? "Processando..." : isWaiter ? "Finalizar Pedido (Garçom)" : "Prosseguir para Pagamento"}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Checkout;
