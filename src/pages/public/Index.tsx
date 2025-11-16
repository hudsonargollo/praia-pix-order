import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, QrCode, Search, Lock } from "lucide-react";
import logo from "@/assets/coco-loko-logo.png";

const Index = () => {
  const navigate = useNavigate();

  // Initialize carousel with autoplay
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center' },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  // Carousel state
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  // Update selected index when carousel scrolls
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Initialize scroll snaps
  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  // Scroll to specific slide
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  // Auto-play pause and resume logic
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = emblaApi.plugins()?.autoplay;
    if (!autoplay) return;

    let resumeTimer: NodeJS.Timeout;

    const handleInteraction = () => {
      // Pause auto-play on user interaction
      autoplay.stop();

      // Clear any existing resume timer
      clearTimeout(resumeTimer);

      // Resume auto-play after 10 seconds of inactivity
      resumeTimer = setTimeout(() => {
        autoplay.play();
      }, 10000);
    };

    // Listen for user interactions
    emblaApi.on('pointerDown', handleInteraction);

    return () => {
      clearTimeout(resumeTimer);
      emblaApi.off('pointerDown', handleInteraction);
    };
  }, [emblaApi]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!emblaApi) return;

    if (event.key === 'ArrowLeft') {
      emblaApi.scrollPrev();
    } else if (event.key === 'ArrowRight') {
      emblaApi.scrollNext();
    }
  }, [emblaApi]);

  // Initial animation hint - trigger first slide after 2 seconds
  useEffect(() => {
    if (!emblaApi) return;

    const timer = setTimeout(() => {
      emblaApi.scrollNext();
    }, 2000);

    return () => clearTimeout(timer);
  }, [emblaApi]);

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
          <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
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
              onClick={() => navigate("/auth")}
              className="h-auto py-6 sm:py-8 flex flex-col bg-yellow-500 text-purple-900 hover:bg-yellow-400 shadow-lg hover:shadow-xl transition-all rounded-2xl min-h-[120px] sm:min-h-[140px]"
            >
              <Lock className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3" />
              <span className="font-bold text-sm sm:text-base text-center">Área Restrita</span>
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/customers")}
              className="h-auto py-6 sm:py-8 flex flex-col bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all rounded-2xl min-h-[120px] sm:min-h-[140px]"
            >
              <Users className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3" />
              <span className="font-bold text-sm sm:text-base text-center">Clientes</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#4a1a4a] py-8 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-white">Como Funciona</h2>
          
          {/* Carousel Container */}
          <div 
            className="overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg" 
            ref={emblaRef}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-label="Como Funciona carousel"
          >
            <div className="flex touch-pan-y -mx-2 sm:-mx-3">
              {/* Slide 1 - Cliente */}
              <div className="flex-[0_0_90%] sm:flex-[0_0_85%] min-w-0 px-2 sm:px-3">
                <Card className="p-6 sm:p-8 text-center shadow-lg hover:shadow-xl transition-all border-2 border-purple-100 rounded-2xl">
                  <div className="bg-purple-900 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-3 text-purple-900">Cliente</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Escaneia QR Code, informa nome e WhatsApp, faz o pedido, paga com PIX e recebe notificações
                  </p>
                </Card>
              </div>

              {/* Slide 2 - Área Restrita */}
              <div className="flex-[0_0_90%] sm:flex-[0_0_85%] min-w-0 px-2 sm:px-3">
                <Card className="p-6 sm:p-8 text-center shadow-lg hover:shadow-xl transition-all border-2 border-yellow-100 rounded-2xl">
                  <div className="bg-yellow-500 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-purple-900" />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-3 text-purple-900">Área Restrita</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Acesso para garçons e gerentes gerenciarem pedidos e operações
                  </p>
                </Card>
              </div>

              {/* Slide 3 - Clientes */}
              <div className="flex-[0_0_90%] sm:flex-[0_0_85%] min-w-0 px-2 sm:px-3">
                <Card className="p-6 sm:p-8 text-center shadow-lg hover:shadow-xl transition-all border-2 border-indigo-100 rounded-2xl">
                  <div className="bg-indigo-600 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-3 text-purple-900">Clientes</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Gerenciamento completo de clientes com importação e exportação CSV
                  </p>
                </Card>
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollTo(index)}
                className={`transition-all rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  index === selectedIndex
                    ? 'bg-purple-900 w-8 h-3'
                    : 'bg-purple-300 w-3 h-3'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === selectedIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        </div>
      </div>


    </div>
  );
};

export default Index;
