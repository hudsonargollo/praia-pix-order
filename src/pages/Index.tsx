import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, ChefHat, DollarSign, QrCode } from "lucide-react";
import logo from "@/assets/coco-loko-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-ocean">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-white">
          <img 
            src={logo} 
            alt="Coco Loko Açaiteria" 
            className="h-32 mx-auto mb-6"
          />
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Sistema completo de pedidos e pagamentos para o melhor açaí à beira-mar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/menu?mesa=1")}
              className="text-lg"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Ver Cardápio (Demo)
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-background py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center shadow-medium hover:shadow-strong transition-shadow">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Cliente</h3>
              <p className="text-sm text-muted-foreground">
                Escaneia QR Code da mesa, faz o pedido, paga com PIX e recebe notificações via WhatsApp
              </p>
            </Card>

            <Card className="p-6 text-center shadow-medium hover:shadow-strong transition-shadow">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2">Cozinha</h3>
              <p className="text-sm text-muted-foreground">
                Visualiza pedidos pagos em tempo real e marca como pronto quando finalizado
              </p>
            </Card>

            <Card className="p-6 text-center shadow-medium hover:shadow-strong transition-shadow">
              <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-bold text-lg mb-2">Caixa</h3>
              <p className="text-sm text-muted-foreground">
                Monitora todos os pedidos e notifica clientes quando estão prontos para retirada
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Acesso Rápido</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/menu?mesa=1")}
              className="h-auto py-6 flex flex-col"
            >
              <QrCode className="h-8 w-8 mb-2" />
              Cardápio Digital
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/kitchen")}
              className="h-auto py-6 flex flex-col"
            >
              <ChefHat className="h-8 w-8 mb-2" />
              Painel Cozinha
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/cashier")}
              className="h-auto py-6 flex flex-col"
            >
              <DollarSign className="h-8 w-8 mb-2" />
              Painel Caixa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
