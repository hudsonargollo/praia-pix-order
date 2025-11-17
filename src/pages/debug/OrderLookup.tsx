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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm rounded-full p-3"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Consultar Pedido
              </h1>
              <p className="text-blue-100 mt-1 text-sm sm:text-base font-medium">
                Encontre seu pedido pelo telefone cadastrado
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Enhanced Search by Phone */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white/50" />
          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Consultar por Telefone</h2>
                <p className="text-sm text-gray-600">Digite seu número para encontrar seus pedidos</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="phoneNumber" className="text-base font-semibold text-gray-700">
                  Número do Telefone
                </Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="(73) 99999-9999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchByPhone()}
                    className="text-lg py-4 pl-4 pr-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-lg"
                  />
                  <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  💡 Digite o telefone usado no pedido (com DDD)
                </p>
              </div>
              <Button 
                onClick={searchByPhone} 
                disabled={loading || !phoneNumber.trim()}
                className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Buscando Pedidos...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-3" />
                    Buscar Pedidos
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Enhanced Multiple Orders Results */}
        {orderResults.length > 0 && (
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <h3 className="font-bold text-xl mb-2">🎉 Pedidos Encontrados!</h3>
              <p className="text-green-100">
                Encontramos {orderResults.length} pedido(s) para este telefone
              </p>
            </div>
            <div className="p-6 space-y-4">
              {orderResults.map((order, index) => (
                <div
                  key={order.id}
                  className="group border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-white to-gray-50"
                  onClick={() => navigate(`/order-status/${order.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                          Pedido #{order.order_number}
                        </h4>
                        <p className="text-sm text-gray-600">
                          👤 {order.customer_name}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 shadow-lg ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      📅 {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        Clique para ver detalhes →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setOrderResults([])}
                className="w-full mt-6 py-3 text-base font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-700 transition-all duration-300 rounded-xl"
              >
                🔍 Nova Busca
              </Button>
            </div>
          </Card>
        )}

        {/* Enhanced Help Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-blue-800 mb-3">💡 Precisa de Ajuda?</h3>
                <div className="space-y-3">
                  <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">
                      📱 Use o telefone com DDD que foi cadastrado no pedido
                    </p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">
                      ✅ Exemplo: (73) 99999-9999
                    </p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">
                      🤝 Se não encontrar seu pedido, entre em contato conosco
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full py-4 text-base font-bold border-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-500 hover:text-green-800 transition-all duration-300 transform hover:scale-105 rounded-xl shadow-lg"
          >
            🛒 Fazer Novo Pedido
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/menu')}
            className="w-full py-4 text-base font-bold border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-500 hover:text-purple-800 transition-all duration-300 transform hover:scale-105 rounded-xl shadow-lg"
          >
            📋 Ver Cardápio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderLookup;
