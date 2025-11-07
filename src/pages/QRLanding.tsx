import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/coco-loko-logo.png";

const QRLanding = () => {
  const navigate = useNavigate();

  const handleViewMenu = () => {
    navigate("/menu");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Image with Purple Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(88, 28, 135, 0.3) 0%, rgba(88, 28, 135, 0.85) 100%), url('/bck.webp')`,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between py-8 px-4">
        {/* Top Spacer */}
        <div className="flex-1" />

        {/* Middle Section - Logo */}
        <div className="flex items-center justify-center py-8">
          <div className="bg-white rounded-[60px] px-8 py-6 md:px-12 md:py-8 shadow-2xl max-w-[90%] md:max-w-md">
            <img 
              src={logo} 
              alt="Coco Loko Açaiteria" 
              className="h-20 md:h-32 w-auto mx-auto"
            />
          </div>
        </div>

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
