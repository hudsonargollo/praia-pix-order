import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cartContext";
import CustomerInfoForm, { CustomerInfo } from "@/components/CustomerInfoForm";
import OrderNotesInput from "@/components/OrderNotesInput";

const Checkout = () => {
  const navigate = useNavigate();
  
  const { state: cartState, clearCart, addItem, removeItem } = useCart();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-all"
              onClick={() => navigate("/menu")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Finalizar Pedido</h1>
              {customerInfo && customerInfo.name && (
                <p className="text-white/90 text-sm mt-0.5">{customerInfo.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-24">
        {/* Order Summary */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-6">
            <h2 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Resumo do Pedido
            </h2>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {cartState.items.map((item) => (
              <div key={item.id} className="flex items-start sm:items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 bg-purple-50 rounded-lg p-1">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 rounded-md bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm"
                      aria-label="Remover um"
                    >
                      <span className="text-lg leading-none">−</span>
                    </button>
                    <span className="font-bold text-purple-900 text-sm sm:text-base min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addItem(item)}
                      className="w-7 h-7 rounded-md bg-green-500 hover:bg-green-600 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm"
                      aria-label="Adicionar mais"
                    >
                      <span className="text-lg leading-none">+</span>
                    </button>
                  </div>
                  <span className="font-bold text-cyan-600 text-sm sm:text-base min-w-[70px] sm:min-w-[80px] text-right">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-4 mt-4 flex justify-between items-center shadow-sm">
              <span className="font-bold text-lg sm:text-xl text-purple-900">Total</span>
              <span className="font-bold text-xl sm:text-2xl text-purple-900">R$ {getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Customer Info */}
        {isEditingInfo || !customerInfo.name || !customerInfo.phone ? (
          <>
            <CustomerInfoForm
              onCustomerInfoChange={setCustomerInfo}
              initialData={customerInfo}
            />
            {/* Confirm button to exit editing mode */}
            {customerInfo.name && customerInfo.phone && customerInfo.phone.replace(/\D/g, '').length === 11 && (
              <Button
                onClick={() => setIsEditingInfo(false)}
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98"
              >
                ✓ Confirmar Dados
              </Button>
            )}
          </>
        ) : (
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 sm:p-6">
              <h2 className="font-bold text-lg sm:text-xl text-white">
                {isWaiter ? "Dados do Cliente" : "Seus Dados"}
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Nome</Label>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">{customerInfo.name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">WhatsApp</Label>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">+55 {customerInfo.phone}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingInfo(true)}
                className="w-full sm:w-auto border-2 hover:bg-gray-50"
              >
                ✏️ Editar Dados
              </Button>
              <p className="text-xs sm:text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                💬 Enviaremos notificações sobre seu pedido via WhatsApp
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
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-4 sm:relative sm:border-0 sm:shadow-none sm:p-0 z-20">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50 sm:shadow-lg">
                <div className="p-4 sm:p-6 space-y-4">
                  <p className="text-xs sm:text-sm text-gray-700 bg-white/80 rounded-lg p-3 border border-gray-200">
                    {isWaiter ? "🎯 O pedido será criado e atribuído ao seu ID" : "📱 Você receberá atualizações via WhatsApp"}
                  </p>
                  <Button
                    onClick={handleCreateOrder}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-800 text-white font-bold py-6 sm:py-7 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98 text-base sm:text-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Processando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {isWaiter ? "✓ Finalizar Pedido" : "💳 Prosseguir para Pagamento"}
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
