import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const QRLanding = () => {
  const navigate = useNavigate();

  const handleViewMenu = () => {
    navigate("/menu");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Image - No overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/bck.webp')`,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col justify-end py-8 px-4">
        {/* Bottom Section - Button */}
        <div className="pb-6 md:pb-8">
          <div className="max-w-lg mx-auto px-2 md:px-4">
            <Button 
              size="lg" 
              onClick={handleViewMenu}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold text-lg md:text-xl py-6 md:py-7 rounded-xl md:rounded-2xl shadow-xl transition-all hover:scale-105"
            >
              Ver Cardápio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRLanding;
