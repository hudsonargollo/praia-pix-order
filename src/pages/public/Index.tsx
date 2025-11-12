import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, ChefHat, DollarSign, QrCode, Search, UserCheck } from "lucide-react";
import logo from "@/assets/coco-loko-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-ocean md:bg-gradient-acai">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-16 text-center text-white">
          <img 
            src={logo} 
            alt="Coco Loko Açaiteria" 
            className="h-24 sm:h-32 mx-auto mb-8 sm:mb-12"
          />
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-purple-900">Acesso Rápido</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <Button
              size="lg"
              onClick={() => navigate("/qr")}
              className="h-auto py-6 sm:py-8 flex flex-col bg-purple-900 text-white hover:bg-purple-800 shadow-lg hover:shadow-xl transition-all rounded-2xl min-h-[120px] sm:min-h-[140px]"
            >
              <QrCode className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3" />
              <span className="font-bold text-sm sm:text-base text-center">Fazer Pedido</span>
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/order-lookup")}
              className="h-auto py-6 sm:py-8 flex flex-col bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg hover:shadow-xl transition-all rounded-2xl min-h-[120px] sm:min-h-[140px]"
            >
              <Search className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3" />
              <span className="font-bold text-sm sm:text-base text-center">Consultar Pedido</span>
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/waiter")}
              className="h-auto py-6 sm:py-8 flex flex-col bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all rounded-2xl min-h-[120px] sm:min-h-[140px]"
            >
              <UserCheck className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3" />
              <span className="font-bold text-sm sm:text-base text-center">Garçom</span>
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="h-auto py-6 sm:py-8 flex flex-col bg-yellow-500 text-purple-900 hover:bg-yellow-400 shadow-lg hover:shadow-xl transition-all rounded-2xl min-h-[120px] sm:min-h-[140px]"
            >
              <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3" />
              <span className="font-bold text-sm sm:text-base text-center">Gerente</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-8 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-purple-900">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="p-6 sm:p-8 text-center shadow-lg hover:shadow-xl transition-all border-2 border-purple-100 rounded-2xl">
              <div className="bg-purple-900 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-3 text-purple-900">Cliente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Escaneia QR Code, informa nome e WhatsApp, faz o pedido, paga com PIX e recebe notificações
              </p>
            </Card>

            <Card className="p-6 sm:p-8 text-center shadow-lg hover:shadow-xl transition-all border-2 border-green-100 rounded-2xl">
              <div className="bg-green-600 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-3 text-purple-900">Garçom</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Gerencia mesas, atende clientes e acompanha pedidos em tempo real
              </p>
            </Card>

            <Card className="p-6 sm:p-8 text-center shadow-lg hover:shadow-xl transition-all border-2 border-yellow-100 rounded-2xl">
              <div className="bg-yellow-500 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-purple-900" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-3 text-purple-900">Gerente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Gerencia todos os pedidos, edita itens e acompanha relatórios de vendas
              </p>
            </Card>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Index;
