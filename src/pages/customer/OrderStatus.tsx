import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, CreditCard, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
    // Store order ID for editing
    sessionStorage.setItem('editingOrderId', orderId!);
    navigate('/menu');
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
        <div className="max-w-2xl mx-auto px-4 py-4">
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
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Seu Pedido</h1>
              <p className="text-white/90 text-sm mt-0.5">
                Pedido #{order.order_number}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Status do Pedido</h2>
            {getStatusBadge()}
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Cliente:</span> {order.customer_name}</p>
            <p><span className="font-medium">WhatsApp:</span> {order.customer_phone}</p>
            <p><span className="font-medium">Data:</span> {new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
          
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.item_name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity}x R$ {item.unit_price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-purple-600">
                  R$ {(item.quantity * item.unit_price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-purple-600">
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
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-6 text-lg shadow-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Ir para Pagamento
            </Button>
            
            <Button
              onClick={handleEditOrder}
              variant="outline"
              className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 py-6 text-lg"
            >
              <Edit className="w-5 h-5 mr-2" />
              Editar Pedido
            </Button>
          </div>
        )}

        {order.payment_status === 'confirmed' && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Pagamento Confirmado!
              </h3>
              <p className="text-green-700">
                Seu pedido está sendo preparado. Você receberá uma notificação no WhatsApp quando estiver pronto.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;
