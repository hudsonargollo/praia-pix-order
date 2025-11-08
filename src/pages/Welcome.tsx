import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, MapPin } from "lucide-react";
import { validateTableId, formatTableDisplay } from "@/lib/tableContext";
import logo from "@/assets/coco-loko-logo.png";

const Welcome = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();

  // If no table ID or invalid format, redirect to home
  if (!tableId || !validateTableId(tableId)) {
    navigate("/");
    return null;
  }

  const handleStartOrdering = () => {
    navigate(`/menu/${tableId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-ocean">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <img 
            src={logo} 
            alt="Coco Loko Açaiteria" 
            className="h-32 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold mb-2">Bem-vindo!</h1>
          <p className="text-white/90">
            O melhor açaí à beira-mar
          </p>
        </div>

        {/* Table Info Card */}
        <Card className="p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">{formatTableDisplay(tableId)}</span>
          </div>
          <p className="text-muted-foreground mb-6">
            Faça seu pedido diretamente pelo celular e pague com PIX. 
            Você receberá notificações via WhatsApp sobre o status do seu pedido.
          </p>
          
          <Button 
            size="lg" 
            onClick={handleStartOrdering}
            className="w-full text-lg py-6"
          >
            <QrCode className="mr-2 h-5 w-5" />
            Começar Pedido
          </Button>
        </Card>

        {/* Info Cards */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Escolha seus itens</h3>
                <p className="text-sm text-muted-foreground">
                  Navegue pelo cardápio e adicione os itens desejados ao carrinho
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Informe seus dados</h3>
                <p className="text-sm text-muted-foreground">
                  Digite seu nome e WhatsApp para receber atualizações
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Pague com PIX</h3>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código PIX para pagamento
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Welcome;