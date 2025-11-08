import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, DollarSign, ShoppingCart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  commission_amount: number;
}

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [waiterName, setWaiterName] = useState("Garçom");

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
      .select("id, created_at, total_amount, status, commission_amount")
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

  const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalCommissions = orders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "default";
      case "in progress":
        return "secondary";
      case "completed":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando Dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <LayoutDashboard className="w-8 h-8 mr-2 text-primary" />
          Dashboard do Garçom
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Vendas (Bruto)
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSales.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">
              {orders.length} pedidos realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comissões Ganhas (10%)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCommissions.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">
              Comissão de 10% sobre o total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nome do Garçom
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waiterName}</div>
            <p className="text-xs text-muted-foreground">
              Seu ID de rastreamento está ativo
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Histórico de Pedidos</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID do Pedido</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-right">
                  {order.total_amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell className="text-right">
                  {(order.commission_amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Nenhum pedido encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WaiterDashboard;
