import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrderSubscription } from "@/hooks/useRealtimeOrders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, CreditCard, ChefHat, Package, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/integrations/supabase/realtime";

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

const OrderStatus = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription to order updates
  useOrderSubscription(
    orderId || null,
    (updatedOrder) => {
      setOrder(updatedOrder);
      // Show toast notification for status changes
      if (updatedOrder.status === 'paid') {
        toast.success('Pagamento confirmado! Seu pedido está sendo preparado.');
      } else if (updatedOrder.status === 'in_preparation') {
        toast.info('Seu pedido está sendo preparado na cozinha.');
      } else if (updatedOrder.status === 'ready') {
        toast.success('Seu pedido está pronto! Pode retirar no balcão.');
      } else if (updatedOrder.status === 'completed') {
        toast.success('Pedido finalizado. Obrigado!');
      }
    },
    !!orderId
  );

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    } else {
      setError('ID do pedido não fornecido');
      setLoading(false);
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Pedido não encontrado');

      setOrder(orderData as Order);

      // Load order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);

    } catch (error) {
      console.error("Error loading order:", error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending_payment":
        return {
          label: "Aguardando Pagamento",
          description: "Complete o pagamento PIX para confirmar seu pedido",
          icon: <CreditCard className="h-8 w-8" />,
          color: "bg-yellow-500",
          estimatedTime: null,
          progress: 25
        };
      case "paid":
        return {
          label: "Pagamento Confirmado",
          description: "Aguardando a cozinha iniciar o preparo do seu pedido",
          icon: <CheckCircle className="h-8 w-8" />,
          color: "bg-green-500",
          estimatedTime: null,
          progress: 40
        };
      case "in_preparation":
        return {
          label: "Pedido Sendo Preparado",
          description: "Nossos chefs estão preparando seu pedido com carinho",
          icon: <ChefHat className="h-8 w-8" />,
          color: "bg-blue-500",
          estimatedTime: "10-15 minutos",
          progress: 70
        };
      case "ready":
        return {
          label: "Pronto para Retirada",
          description: "Seu pedido está pronto! Pode retirar no balcão",
          icon: <Package className="h-8 w-8" />,
          color: "bg-green-600",
          estimatedTime: "Agora",
          progress: 100
        };
      case "completed":
        return {
          label: "Pedido Finalizado",
          description: "Pedido entregue com sucesso. Obrigado!",
          icon: <CheckCircle className="h-8 w-8" />,
          color: "bg-gray-500",
          estimatedTime: null,
          progress: 100
        };
      default:
        return {
          label: status,
          description: "Status do pedido",
          icon: <Clock className="h-8 w-8" />,
          color: "bg-gray-400",
          estimatedTime: null,
          progress: 0
        };
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes === 1) return '1 minuto atrás';
    if (diffMinutes < 60) return `${diffMinutes} minutos atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hora atrás';
    return `${diffHours} horas atrás`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <div className="text-destructive mb-4">
            <Clock className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h2 className="font-bold text-lg mb-2">Pedido não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'Não foi possível encontrar este pedido'}
          </p>
          <div className="space-y-2">
            <Button onClick={loadOrderData} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar ao Início
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-ocean text-white p-6 shadow-medium">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Status do Pedido</h1>
        </div>
        <p className="text-white/90 text-lg font-medium">
          Pedido #{order.order_number}
        </p>
        <p className="text-white/70 text-sm mt-1">
          {order.customer_phone} • {getElapsedTime(order.created_at)}
        </p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Status Progress Card */}
        <Card className="p-6 shadow-medium">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${statusInfo.color} text-white mb-4`}>
              {statusInfo.icon}
            </div>
            <h2 className="text-2xl font-bold mb-2">{statusInfo.label}</h2>
            <p className="text-muted-foreground mb-4">{statusInfo.description}</p>
            
            {statusInfo.estimatedTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-800">
                  Tempo estimado: {statusInfo.estimatedTime}
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${statusInfo.progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pedido</span>
            <span>Pagamento</span>
            <span>Preparo</span>
            <span>Pronto</span>
          </div>
        </Card>

        {/* Order Items */}
        {orderItems.length > 0 && (
          <Card className="p-6 shadow-soft">
            <h3 className="font-bold text-lg mb-4">Itens do Pedido</h3>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantidade: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      R$ {(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      R$ {item.unit_price.toFixed(2)} cada
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Order Details */}
        <Card className="p-6 shadow-soft">
          <h3 className="font-bold text-lg mb-4">Detalhes do Pedido</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-semibold">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefone:</span>
              <span className="font-semibold">{order.customer_phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado:</span>
              <span className="font-semibold">
                {new Date(order.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {order.payment_confirmed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagamento:</span>
                <span className="font-semibold text-green-600">
                  {new Date(order.payment_confirmed_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            {order.ready_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pronto:</span>
                <span className="font-semibold text-green-600">
                  {new Date(order.ready_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total:</span>
              <span className="text-primary">R$ {Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        {order.status === "pending_payment" && (
          <Card className="p-6 shadow-soft border-2 border-dashed border-yellow-300">
            <div className="text-center">
              <h3 className="font-bold text-lg mb-2">Pagamento Pendente</h3>
              <p className="text-muted-foreground mb-4">
                Complete o pagamento PIX para confirmar seu pedido
              </p>
              <Button 
                onClick={() => navigate(`/payment/${order.id}`)}
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Ir para Pagamento
              </Button>
            </div>
          </Card>
        )}

        {order.status === "ready" && (
          <Card className="p-6 shadow-soft border-2 border-green-300 bg-green-50">
            <div className="text-center">
              <Package className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg text-green-800 mb-2">Pedido Pronto!</h3>
              <p className="text-green-700 mb-4">
                Seu pedido está pronto para retirada no balcão
              </p>
              <p className="text-sm text-green-600">
                Apresente este número: <strong>#{order.order_number}</strong>
              </p>
            </div>
          </Card>
        )}

        {/* Refresh Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={loadOrderData}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Status
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
