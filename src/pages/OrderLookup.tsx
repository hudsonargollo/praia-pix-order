import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Phone, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const OrderLookup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");



  const searchByPhone = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Digite o número do telefone");
      return;
    }

    // Format phone number (remove non-digits and add +55 if needed)
    let formattedPhone = phoneNumber.replace(/\D/g, "");
    if (formattedPhone.length === 11 && !formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, created_at")
        .eq("customer_phone", formattedPhone)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error searching orders:", error);
        toast.error("Erro ao buscar pedidos");
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Nenhum pedido encontrado para este telefone");
        return;
      }

      // If only one order, navigate directly
      if (data.length === 1) {
        navigate(`/order-status/${data[0].id}`);
        return;
      }

      // If multiple orders, show selection
      setOrderResults(data);
    } catch (error) {
      console.error("Error searching orders:", error);
      toast.error("Erro ao buscar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const [orderResults, setOrderResults] = useState<any[]>([]);

  const formatPhoneDisplay = (phone: string) => {
    // Remove +55 and format as (XX) XXXXX-XXXX
    const cleaned = phone.replace(/^\+55/, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "Aguardando Pagamento";
      case "paid":
        return "Pagamento Confirmado";
      case "in_preparation":
        return "Em Preparo";
      case "ready":
        return "Pronto";
      case "completed":
        return "Finalizado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "paid":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "in_preparation":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "ready":
        return "text-green-600 bg-green-50 border-green-200";
      case "completed":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-ocean text-white p-6 shadow-medium">
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 text-white hover:bg-white/20"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Consultar Pedido</h1>
        <p className="text-white/90 mt-1">
          Encontre seu pedido pelo telefone cadastrado
        </p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Search by Phone */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Consultar por Telefone</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número do Telefone</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="(73) 99999-9999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchByPhone()}
              />
              <p className="text-sm text-muted-foreground">
                Digite o telefone usado no pedido (com DDD)
              </p>
            </div>
            <Button 
              onClick={searchByPhone} 
              disabled={loading || !phoneNumber.trim()}
              className="w-full"
              size="lg"
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Buscando..." : "Buscar Pedidos"}
            </Button>
          </div>
        </Card>

        {/* Multiple Orders Results */}
        {orderResults.length > 0 && (
          <Card className="p-6 shadow-soft">
            <h3 className="font-bold text-lg mb-4">Pedidos Encontrados</h3>
            <p className="text-muted-foreground mb-4">
              Encontramos {orderResults.length} pedido(s) para este telefone:
            </p>
            <div className="space-y-3">
              {orderResults.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/order-status/${order.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Pedido #{order.order_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setOrderResults([])}
              className="w-full mt-4"
            >
              Nova Busca
            </Button>
          </Card>
        )}

        {/* Help Section */}
        <Card className="p-6 shadow-soft border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Precisa de Ajuda?</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Use o telefone com DDD que foi cadastrado no pedido</p>
                <p>• Exemplo: (73) 99999-9999</p>
                <p>• Se não encontrar seu pedido, entre em contato conosco</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Fazer Novo Pedido
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/menu')}
            className="w-full"
          >
            Ver Cardápio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderLookup;