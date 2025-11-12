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
    <div className="h-screen overflow-hidden relative">
      {/* Background with açaí bowl image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(88, 28, 135, 0.7), rgba(59, 130, 246, 0.7)), url('/bck-m.webp')`,
        }}
      />
      
      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Coco Loko Açaiteria" 
            className="h-32 sm:h-40 mx-auto mb-6 drop-shadow-2xl"
          />
          
          {/* Welcome Text */}
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Bem-vindo!
          </h1>
          <p className="text-xl sm:text-2xl text-white/95 mb-2 drop-shadow-md">
            O melhor açaí à beira-mar
          </p>
          
          {/* Table Info */}
          <div className="flex items-center justify-center gap-2 mb-8 text-white/90">
            <MapPin className="h-5 w-5" />
            <span className="text-lg font-semibold">{formatTableDisplay(tableId)}</span>
          </div>
          
          {/* Main CTA Button with Pulse */}
          <Button 
            size="lg" 
            onClick={handleStartOrdering}
            className="w-full text-xl py-7 bg-white text-primary hover:bg-white/90 shadow-2xl animate-pulse hover:animate-none transition-all transform hover:scale-105"
          >
            <QrCode className="mr-2 h-6 w-6" />
            Começar Pedido
          </Button>
          
          {/* Quick Info */}
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white/90 text-sm">
            <p className="mb-2">✨ Peça pelo celular</p>
            <p className="mb-2">💳 Pague com PIX</p>
            <p>📱 Receba notificações no WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;