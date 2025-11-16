import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cartContext";
import { normalizePhone } from "@/lib/phoneUtils";

type CheckoutStep = 'NAME' | 'WHATSAPP' | 'CONFIRM' | 'REVIEW';

const Checkout = () => {
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  
  const [step, setStep] = useState<CheckoutStep>('NAME');
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [errors, setErrors] = useState({ name: "", whatsapp: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartState.items.length === 0) {
      navigate("/qr");
    }
  }, [cartState.items.length, navigate]);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const transition = { duration: 0.3 };

  // Validation functions
  const validateName = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setErrors(prev => ({ ...prev, name: "Nome deve ter pelo menos 2 caracteres" }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: "" }));
    return true;
  };

  const validateWhatsApp = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11) {
      setErrors(prev => ({ ...prev, whatsapp: "WhatsApp deve ter 11 dígitos (DDD + número)" }));
      return false;
    }
    const ddd = parseInt(digits.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      setErrors(prev => ({ ...prev, whatsapp: "DDD inválido" }));
      return false;
    }
    setErrors(prev => ({ ...prev, whatsapp: "" }));
    return true;
  };

  // Step handlers
  const handleNameContinue = () => {
    if (validateName(name)) {
      setStep('WHATSAPP');
    }
  };

  const handleWhatsAppContinue = () => {
    if (validateWhatsApp(whatsapp)) {
      setStep('CONFIRM');
    }
  };

  const handleWhatsAppInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setWhatsapp(digits.slice(0, 11));
  };

  // Auto-advance from CONFIRM to REVIEW
  useEffect(() => {
    if (step === 'CONFIRM') {
      const timer = setTimeout(() => {
        setStep('REVIEW');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle payment navigation
  const handleGoToPayment = async () => {
    setIsSubmitting(true);
    
    try {
      // Normalize phone number
      const normalizedPhone = normalizePhone(whatsapp);
      if (!normalizedPhone) {
        toast.error("Número de WhatsApp inválido");
        return;
      }

      // Upsert customer record
      // @ts-ignore - customers table exists but types need regeneration
      const { error: customerError } = await supabase
        .from('customers')
        .upsert({
          whatsapp: normalizedPhone,
          name: name.trim(),
          last_order_date: new Date().toISOString()
        }, {
          onConflict: 'whatsapp'
        });

      if (customerError) {
        console.error('Error upserting customer:', customerError);
        toast.error("Erro ao salvar informações. Tente novamente.");
        return;
      }

      // Calculate total
      const totalAmount = cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: name.trim(),
          customer_phone: normalizedPhone,
          table_number: '-',
          status: 'pending_payment',
          payment_status: 'pending',
          total_amount: totalAmount
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('Error creating order:', orderError);
        toast.error("Erro ao criar pedido. Tente novamente.");
        return;
      }

      // Create order items
      const orderItems = cartState.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        item_name: item.name
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        toast.error("Erro ao criar itens do pedido. Tente novamente.");
        return;
      }

      // Save customer info to sessionStorage
      sessionStorage.setItem('customerInfo', JSON.stringify({
        name: name.trim(),
        phone: normalizedPhone
      }));

      // Clear cart after successful order creation
      clearCart();

      // Navigate to payment with orderId
      toast.success("Pedido criado com sucesso!");
      navigate(`/payment/${order.id}`);
      
    } catch (error) {
      console.error('Exception in handleGoToPayment:', error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'NAME' && (
            <motion.div
              key="name"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
            >
              <Card className="p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Olá! 👋 Para quem é o pedido?
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-base">
                      👤 Seu nome
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => validateName(name)}
                      className="mt-2 text-lg"
                      autoFocus
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleNameContinue}
                    disabled={name.trim().length < 2}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-6 text-lg"
                  >
                    Continuar
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'WHATSAPP' && (
            <motion.div
              key="whatsapp"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
            >
              <Card className="p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Legal, {name}! E qual o seu WhatsApp com DDD?
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="whatsapp" className="text-base">
                      📱 WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="71987654321"
                      value={whatsapp}
                      onChange={(e) => handleWhatsAppInput(e.target.value)}
                      onBlur={() => validateWhatsApp(whatsapp)}
                      className="mt-2 text-lg"
                      autoFocus
                    />
                    {errors.whatsapp && (
                      <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleWhatsAppContinue}
                    disabled={whatsapp.replace(/\D/g, '').length !== 11}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-6 text-lg"
                  >
                    Confirmar WhatsApp
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'CONFIRM' && (
            <motion.div
              key="confirm"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
            >
              <Card className="p-6 shadow-xl text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Perfeito! Vamos te avisar sobre o pedido pelo WhatsApp. 👍
                </h2>
              </Card>
            </motion.div>
          )}

          {step === 'REVIEW' && (
            <motion.div
              key="review"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
            >
              <Card className="p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Aqui está o seu pedido, {name}. Tudo certo?
                </h2>
                <div className="space-y-4">
                  {/* Cart items */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {cartState.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">x{item.quantity}</p>
                          <p className="text-sm font-bold text-cyan-600">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-4 flex justify-between items-center">
                    <span className="font-bold text-xl text-purple-900">Total</span>
                    <span className="font-bold text-2xl text-purple-900">
                      R$ {cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={() => navigate('/menu')}
                      variant="outline"
                      className="w-full py-6 text-lg font-semibold"
                    >
                      Editar Pedido
                    </Button>
                    <Button
                      onClick={handleGoToPayment}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-6 text-lg"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Processando...
                        </span>
                      ) : (
                        "Ir para Pagamento"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Checkout;
