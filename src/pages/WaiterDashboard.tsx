import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, DollarSign, ShoppingCart, LogOut, Users, TrendingUp, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PIXQRGenerator } from "@/components";
import logo from "@/assets/coco-loko-logo.png";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  commission_amount?: number;
  customer_name?: string;
  customer_phone?: string;
}

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [waiterName, setWaiterName] = useState("Garçom");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPIXGenerator, setShowPIXGenerator] = useState(false);

  useEffect(() => {
    fetchWaiterData();
  }, []);

  const fetchWaiterData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Usuário não autenticado.");
      navigate("/auth");
      return;
    }

    setWaiterName(user.user_metadata?.full_name || user.email || "Garçom");

    // Fetch orders placed by the current waiter
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, 
        created_at, 
        total_amount, 
        status, 
        commission_amount, 
        customer_name, 
        customer_phone
      `)
      .eq("waiter_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos: " + error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleGeneratePIX = (order: Order) => {
    setSelectedOrder(order);
    setShowPIXGenerator(true);
  };

  const handlePIXPaymentComplete = async (paymentId: string) => {
    if (!selectedOrder) return;

    try {
      // Update order status to paid
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          mercadopago_payment_id: paymentId
        })
        .eq('id', selectedOrder.id);

      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Erro ao atualizar status do pedido');
      } else {
        toast.success('Pedido marcado como pago!');
        // Refresh orders to show updated status
        fetchWaiterData();
      }
    } catch (error) {
      console.error('Error handling payment completion:', error);
      toast.error('Erro ao processar pagamento');
    }

    setShowPIXGenerator(false);
    setSelectedOrder(null);
  };

  const handleClosePIXGenerator = () => {
    setShowPIXGenerator(false);
    setSelectedOrder(null);
  };

  const canGeneratePIX = (order: Order) => {
    // Allow PIX generation for orders that haven't been paid yet
    const unpaidStatuses = ['pending', 'in_preparation', 'ready'];
    return unpaidStatuses.includes(order.status.toLowerCase()) && 
           order.customer_name && 
           order.customer_phone;
  };

  const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalCommissions = orders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary"; // Yellow for pending orders
      case "pending_payment":
        return "destructive"; // Red for awaiting payment
      case "paid":
        return "default"; // Blue for paid orders
      case "in_preparation":
        return "secondary"; // Yellow for in preparation
      case "ready":
        return "default"; // Blue for ready orders
      case "completed":
        return "default"; // Green for completed
      case "cancelled":
        return "destructive"; // Red for cancelled
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pendente";
      case "pending_payment":
        return "Aguardando Pagamento";
      case "paid":
        return "Pago";
      case "in_preparation":
        return "Em Preparo";
      case "ready":
        return "Pronto";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-acai flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-acai">
      {/* Header */}
      <div className="bg-gradient-sunset text-white p-4 sm:p-6 shadow-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logo} 
              alt="Coco Loko" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <LayoutDashboard className="w-6 h-6 mr-2" />
                Dashboard do Garçom
              </h1>
              <p className="text-white/80 text-sm">Bem-vindo, {waiterName}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-white hover:bg-white/20">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Action Button */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Criar Novo Pedido</h3>
                  <p className="text-white/90">Abra o cardápio para fazer um pedido para o cliente</p>
                </div>
                <Button 
                  onClick={() => navigate("/menu")}
                  size="lg"
                  className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-3"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Novo Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 transition-all duration-300 group cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-white transition-colors">
                Total de Vendas
              </CardTitle>
              <div className="p-2 bg-gradient-ocean rounded-lg group-hover:bg-white/20">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 group-hover:text-white transition-colors">
                {totalSales.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-sm text-gray-500 group-hover:text-white/90 transition-colors flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {orders.length} pedidos realizados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl hover:bg-gradient-to-br hover:from-orange-500 hover:to-red-500 transition-all duration-300 group cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-white transition-colors">
                Suas Comissões (10%)
              </CardTitle>
              <div className="p-2 bg-gradient-sunset rounded-lg group-hover:bg-white/20">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 group-hover:text-white transition-colors">
                {totalCommissions.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-sm text-gray-500 group-hover:text-white/90 transition-colors">
                10% de comissão sobre vendas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl hover:bg-gradient-to-br hover:from-purple-500 hover:to-purple-600 transition-all duration-300 group cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-white transition-colors">
                Performance
              </CardTitle>
              <div className="p-2 bg-gradient-acai rounded-lg group-hover:bg-white/20">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 group-hover:text-white transition-colors">
                {orders.length > 0 ? (totalSales / orders.length).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
              </div>
              <p className="text-sm text-gray-500 group-hover:text-white/90 transition-colors">
                Ticket médio por pedido
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders History */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-purple-600" />
              Histórico de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">ID do Pedido</TableHead>
                    <TableHead className="text-gray-600">Cliente</TableHead>
                    <TableHead className="text-gray-600">Data</TableHead>
                    <TableHead className="text-right text-gray-600">Total</TableHead>
                    <TableHead className="text-right text-gray-600">Sua Comissão</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-gray-100 hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-900">
                        #{order.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div>
                          <div className="font-medium">{order.customer_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{order.customer_phone || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(order.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {order.total_amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {(order.commission_amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)} className="font-medium">
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canGeneratePIX(order) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePIX(order)}
                            className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <QrCode className="w-3 h-3" />
                            Gerar PIX
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center">
                          <ShoppingCart className="w-12 h-12 text-gray-300 mb-2" />
                          <p>Nenhum pedido encontrado</p>
                          <p className="text-sm">Clique em "Novo Pedido" para começar a atender clientes</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIX QR Generator Modal */}
      {selectedOrder && (
        <PIXQRGenerator
          isOpen={showPIXGenerator}
          orderId={selectedOrder.id}
          amount={selectedOrder.total_amount}
          customerInfo={{
            name: selectedOrder.customer_name,
            phone: selectedOrder.customer_phone
          }}
          onPaymentComplete={handlePIXPaymentComplete}
          onClose={handleClosePIXGenerator}
        />
      )}
    </div>
  );
};

export default WaiterDashboard;
