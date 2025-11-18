import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, ArrowLeft, Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cartContext";
import { normalizePhone } from "@/lib/phoneUtils";
import { notificationTriggers } from "@/integrations/whatsapp";

type CheckoutStep = 'NAME' | 'WHATSAPP' | 'CONFIRM' | 'REVIEW';

const Checkout = () => {
  const navigate = useNavigate();
  const { state: cartState, clearCart, addItem, removeItem } = useCart();
  
  const [step, setStep] = useState<CheckoutStep>('NAME');
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [errors, setErrors] = useState({ name: "", whatsapp: "" });
  const [touched, setTouched] = useState({ name: false, whatsapp: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogView, setDialogView] = useState<'cart' | 'menu'>('cart');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const transition = { duration: 0.3 };

  // Validation functions
  const validateName = (value: string, showError: boolean = true): boolean => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      if (showError) {
        setErrors(prev => ({ ...prev, name: "Nome deve ter pelo menos 2 caracteres" }));
      }
      return false;
    }
    setErrors(prev => ({ ...prev, name: "" }));
    return true;
  };

  const validateWhatsApp = (value: string, showError: boolean = true): boolean => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11) {
      if (showError) {
        setErrors(prev => ({ ...prev, whatsapp: "WhatsApp deve ter 11 dígitos (DDD + número)" }));
      }
      return false;
    }
    const ddd = parseInt(digits.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      if (showError) {
        setErrors(prev => ({ ...prev, whatsapp: "DDD inválido" }));
      }
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

  // Load menu items when switching to menu view
  const loadMenuItems = async () => {
    setLoadingMenu(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu:', error);
      toast.error('Erro ao carregar cardápio');
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleShowMenu = () => {
    setDialogView('menu');
    loadMenuItems();
  };

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
      try {
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
          // Don't fail the order if customer upsert fails - it's not critical
        }
      } catch (err) {
        console.error('Exception upserting customer:', err);
        // Continue with order creation even if customer upsert fails
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

      // Navigate directly to payment (original behavior)
      toast.success("Pedido criado com sucesso!");
      navigate(`/payment/${order.id}`);

      // Send WhatsApp notification asynchronously (don't block navigation)
      setTimeout(async () => {
        try {
          const baseUrl = window.location.origin;
          await notificationTriggers.onOrderCreatedWithLinks(order.id, baseUrl);
          console.log('✅ WhatsApp notification triggered for order:', order.id);
        } catch (notifError) {
          console.error('❌ Failed to trigger WhatsApp notification:', notifError);
          // Silently fail - notification is not critical for order flow
        }
      }, 100);
      
    } catch (error) {
      console.error('Exception in handleGoToPayment:', error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
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
              {name && (
                <p className="text-white/90 text-sm mt-0.5">{name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4 pt-8">
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
              <Card className="p-6 sm:p-8 shadow-xl border-2 border-purple-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">👋</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Olá, é uma honra ter você aqui.
                  </h2>
                  <p className="text-gray-600">Como você gostaria de ser chamado?</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-base font-semibold text-gray-700">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="ex: João"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (touched.name) {
                          validateName(e.target.value, true);
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, name: true }));
                        validateName(name, true);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleNameContinue()}
                      className="mt-2 text-lg h-14 border-2 focus:border-purple-500"
                      autoFocus
                    />
                    {touched.name && errors.name && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span>⚠️</span> {errors.name}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleNameContinue}
                    disabled={name.trim().length < 2}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Continuar →
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
              <Card className="p-6 sm:p-8 shadow-xl border-2 border-purple-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📱</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Ótimo, {name}!
                  </h2>
                  <p className="text-gray-600">Agora precisamos do seu WhatsApp para te avisar quando o pedido estiver pronto</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="whatsapp" className="text-base font-semibold text-gray-700">
                      WhatsApp (com DDD)
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="(71) 98765-4321"
                      value={whatsapp}
                      onChange={(e) => {
                        handleWhatsAppInput(e.target.value);
                        if (touched.whatsapp) {
                          validateWhatsApp(e.target.value, true);
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, whatsapp: true }));
                        validateWhatsApp(whatsapp, true);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleWhatsAppContinue()}
                      className="mt-2 text-lg h-14 border-2 focus:border-green-500"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">Digite apenas números (DDD + número)</p>
                    {touched.whatsapp && errors.whatsapp && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span>⚠️</span> {errors.whatsapp}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleWhatsAppContinue}
                    disabled={whatsapp.replace(/\D/g, '').length !== 11}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Confirmar →
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
              <Card className="p-8 shadow-xl text-center border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  Tudo certo! ✨
                </h2>
                <p className="text-lg text-gray-700">
                  Vamos te avisar pelo WhatsApp quando seu pedido estiver pronto!
                </p>
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
              <Card className="p-6 sm:p-8 shadow-xl border-2 border-purple-100">
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Aqui está o seu pedido, {name}!
                  </h2>
                  <p className="text-gray-600">Confira se está tudo certo antes de prosseguir</p>
                </div>
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
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 flex justify-between items-center shadow-lg">
                    <span className="font-bold text-xl text-white">Total</span>
                    <span className="font-bold text-3xl text-white">
                      R$ {cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={handleGoToPayment}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-7 text-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Processando...
                        </span>
                      ) : (
                        <>
                          💳 Ir para Pagamento
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setIsEditDialogOpen(true)}
                      variant="outline"
                      className="w-full py-6 text-lg font-semibold border-2 hover:bg-gray-50"
                    >
                      ✏️ Editar Pedido
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setDialogView('cart'); // Reset to cart view when closing
          setSelectedMenuItem(null);
          setItemQuantity(1);
        }
      }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {dialogView === 'menu' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDialogView('cart');
                    setSelectedMenuItem(null);
                    setItemQuantity(1);
                  }}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {dialogView === 'cart' ? 'Editar Pedido' : 'Adicionar Itens'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dialogView === 'cart' ? (
              // Cart View
              <>
                {cartState.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-full"
                    onClick={() => removeItem(item.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-lg min-w-[2rem] text-center">
                    {item.quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-full"
                    onClick={() => addItem(item)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {cartState.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Carrinho vazio</p>
                <Button
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    navigate('/menu');
                  }}
                  className="mt-4"
                >
                  Voltar ao Cardápio
                </Button>
              </div>
            )}
            
            {cartState.items.length > 0 && (
              <>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-purple-600">
                      R$ {cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShowMenu}
                  >
                    Adicionar Mais
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            )}
            </> 
            ) : (
              // Menu View
              <>
                {loadingMenu ? (
                  <div className="text-center py-8">
                    <div className="animate-spin text-4xl mb-2">⏳</div>
                    <p className="text-gray-600">Carregando cardápio...</p>
                  </div>
                ) : (
                  <>
                    {menuItems.map((item) => {
                      const isSelected = selectedMenuItem?.id === item.id;
                      return (
                        <div key={item.id} className="bg-gray-50 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 p-3">
                            {item.image_url && (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                              )}
                              <p className="text-sm font-bold text-purple-600 mt-1">
                                R$ {item.price.toFixed(2)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  // Add the item with selected quantity
                                  for (let i = 0; i < itemQuantity; i++) {
                                    addItem(item);
                                  }
                                  toast.success(`${itemQuantity}x ${item.name} adicionado!`);
                                  setSelectedMenuItem(null);
                                  setItemQuantity(1);
                                } else {
                                  // Show quantity selector
                                  setSelectedMenuItem(item);
                                  setItemQuantity(1);
                                }
                              }}
                              className="bg-gradient-to-r from-purple-600 to-indigo-600"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {isSelected ? 'Confirmar' : 'Adicionar'}
                            </Button>
                          </div>
                          {isSelected && (
                            <div className="px-3 pb-3 flex items-center justify-between bg-white border-t">
                              <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold text-lg min-w-[2rem] text-center">
                                  {itemQuantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => setItemQuantity(itemQuantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="border-t pt-4">
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                        onClick={() => setDialogView('cart')}
                      >
                        Ver Carrinho ({cartState.items.reduce((sum, item) => sum + item.quantity, 0)} itens)
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
