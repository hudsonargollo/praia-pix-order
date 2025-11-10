import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Users, ShoppingBag, BarChart3, MessageSquare, LogOut, ChefHat, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/coco-loko-logo.png";

const Admin = () => {
  const navigate = useNavigate();
  
  // Check if bypass parameter is present
  const urlParams = new URLSearchParams(window.location.search);
  const bypassParam = urlParams.get('bypass');
  const bypassSuffix = bypassParam ? `?bypass=${bypassParam}` : '';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const handleNavigation = (path: string) => {
    navigate(`${path}${bypassSuffix}`);
  };

  const adminMenuItems = [
    { title: "Painel Gerente", icon: ChefHat, path: "/cashier", description: "Gerenciar pedidos" },
    { title: "Relatórios", icon: BarChart3, path: "/reports", description: "Análises e métricas" },
    { title: "Relatórios Garçons", icon: TrendingUp, path: "/admin/waiter-reports", description: "Performance por garçom" },
    { title: "Produtos", icon: ShoppingBag, path: "/admin/products", description: "Gerenciar cardápio" },
    { title: "Garçons", icon: Users, path: "/admin/waiters", description: "Gerenciar equipe" },
    { title: "WhatsApp", icon: MessageSquare, path: "/whatsapp-admin", description: "Configurar notificações" },
    { title: "Monitoramento", icon: LayoutDashboard, path: "/monitoring", description: "Status do sistema" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Coco Loko Açaiteria" 
                  className="h-12 sm:h-16 w-auto drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Painel Administrativo
                </h1>
                <p className="text-blue-100 mt-1 text-xs sm:text-base font-medium">
                  Sistema de Gestão • Coco Loko Açaiteria
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-white to-blue-50/50 shadow-xl border-0 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Bem-vindo ao Sistema de Gestão
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                    Gerencie todos os aspectos do seu negócio de forma eficiente e moderna. 
                    Escolha uma das opções abaixo para começar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {adminMenuItems.map((item, index) => (
              <Card
                key={item.title}
                className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm overflow-hidden"
                onClick={() => handleNavigation(item.path)}
              >
                <CardContent className="p-6 sm:p-8 text-center relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Icon Container */}
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <item.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative">
                    <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-700 transition-colors leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Hover Effect Arrow */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="absolute bottom-2 left-2 opacity-20 group-hover:opacity-30 transition-opacity">
                    <span className="text-4xl font-bold text-purple-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats Footer */}
          <div className="mt-8">
            <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-400">24/7</div>
                    <div className="text-xs sm:text-sm text-gray-300">Sistema Online</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-400">100%</div>
                    <div className="text-xs sm:text-sm text-gray-300">Seguro</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400">∞</div>
                    <div className="text-xs sm:text-sm text-gray-300">Pedidos</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-orange-400">⚡</div>
                    <div className="text-xs sm:text-sm text-gray-300">Rápido</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
