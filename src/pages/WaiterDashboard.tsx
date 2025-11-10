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
  const totalCommissions = totalSales * 0.1; // 10% commission

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
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Coco Loko" 
                  className="h-10 sm:h-14 w-auto drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold flex items-center bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                  <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-white" />
                  Dashboard do Garçom
                </h1>
                <p className="text-orange-100 text-xs sm:text-sm font-medium">
                  Bem-vindo, {waiterName} • Sistema de Vendas
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Enhanced Action Button */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white shadow-2xl border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold">Criar Novo Pedido</h3>
                      <p className="text-green-100 text-sm">Comece a atender um novo cliente</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm sm:text-base">
                    Abra o cardápio digital para fazer um pedido personalizado para o cliente
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/menu")}
                  size="lg"
                  className="bg-white text-green-600 hover:bg-gray-100 font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Novo Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-white transition-colors">
                Total de Vendas
              </CardTitle>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-white/20 group-hover:shadow-xl transition-all duration-300">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-white transition-colors mb-2">
                {totalSales.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-sm text-gray-500 group-hover:text-white/90 transition-colors flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {orders.length} pedidos realizados
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-white transition-colors">
                Suas Comissões (10%)
              </CardTitle>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-white/20 group-hover:shadow-xl transition-all duration-300">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 group-hover:text-white transition-colors mb-2">
                {totalCommissions.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-sm text-gray-500 group-hover:text-white/90 transition-colors">
                10% de comissão sobre vendas
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm overflow-hidden relative sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-white transition-colors">
                Performance
              </CardTitle>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-white/20 group-hover:shadow-xl transition-all duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 group-hover:text-white transition-colors mb-2">
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
                        {(order.total_amount * 0.1).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
