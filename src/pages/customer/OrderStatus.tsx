import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, CreditCard, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { OrderEditDialog } from "@/components/OrderEditDialog";
import { formatPhoneNumber } from "@/lib/phoneUtils";

interface OrderItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  table_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

const OrderStatus = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);

      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('Error loading order:', orderError);
        toast.error('Erro ao carregar pedido');
        navigate('/');
        return;
      }

      setOrder(orderData);

      // Load order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error loading order items:', itemsError);
      } else {
        setOrderItems(itemsData || []);
      }

    } catch (error) {
      console.error('Exception loading order:', error);
      toast.error('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPayment = () => {
    navigate(`/payment/${orderId}`);
  };

  const handleEditOrder = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    setIsEditDialogOpen(false);
    loadOrder(); // Reload order to show updated data
  };

  const getStatusBadge = () => {
    if (order?.payment_status === 'confirmed') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Aguardando Pagamento
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">Pedido não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-all"
              onClick={() => navigate('/menu')}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Acompanhe seu Pedido
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <Card className="p-6 sm:p-8 shadow-xl border-2 border-purple-100">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              order.payment_status === 'confirmed' 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-yellow-500 to-orange-600'
            }`}>
              {order.payment_status === 'confirmed' ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : (
                <Clock className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pedido #{order.order_number}
            </h2>
            {getStatusBadge()}
          </div>
          
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Cliente</span>
              <span className="text-sm font-semibold text-gray-900">{order.customer_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">WhatsApp</span>
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {formatPhoneNumber(order.customer_phone)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Data</span>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(order.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-6 sm:p-8 shadow-xl border-2 border-purple-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Itens do Pedido</h2>
          
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-base">{item.item_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.quantity}x R$ {item.unit_price.toFixed(2)}
                  </p>
                </div>
                <p className="font-bold text-lg text-purple-600">
                  R$ {(item.quantity * item.unit_price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t-2 border-purple-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 flex items-center justify-between shadow-lg">
              <span className="text-xl font-bold text-white">Total</span>
              <span className="text-3xl font-bold text-white">
                R$ {order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        {order.payment_status === 'pending' && (
          <div className="space-y-3">
            <Button
              onClick={handleGoToPayment}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              <CreditCard className="w-6 h-6 mr-2" />
              💳 Ir para Pagamento
            </Button>
            
            <Button
              onClick={handleEditOrder}
              variant="outline"
              className="w-full border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 py-6 text-lg font-semibold transition-colors"
            >
              <Edit className="w-5 h-5 mr-2" />
              ✏️ Editar Pedido
            </Button>
          </div>
        )}

        {order.payment_status === 'confirmed' && (
          <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-3">
                Pagamento Confirmado! ✨
              </h3>
              <p className="text-lg text-green-700 leading-relaxed">
                Seu pedido está sendo preparado com carinho. Você receberá uma notificação no WhatsApp quando estiver pronto para retirada!
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Order Edit Dialog */}
      <OrderEditDialog
        orderId={orderId || null}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onOrderUpdated={handleEditComplete}
      />
    </div>
  );
};

export default OrderStatus;
