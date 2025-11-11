import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Users, ShoppingBag, BarChart3, MessageSquare, LogOut, ChefHat } from "lucide-react";
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
    { title: "Pedidos", icon: ChefHat, path: "/cashier", description: "Gerenciar pedidos" },
    { title: "Relatórios", icon: BarChart3, path: "/reports", description: "Análises e métricas" },
    { title: "Produtos", icon: ShoppingBag, path: "/admin/products", description: "Gerenciar cardápio" },
    { title: "Garçons", icon: Users, path: "/waiter-management", description: "Gerenciar equipe e relatórios" },
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
          {/* Responsive Grid - 2x2 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
            {adminMenuItems.map((item) => (
              <Card
                key={item.title}
                className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 border-0 bg-gradient-to-br from-white via-white to-purple-50/30 backdrop-blur-sm overflow-hidden shadow-lg aspect-square"
                onClick={() => handleNavigation(item.path)}
              >
                <CardContent className="p-6 text-center relative h-full flex flex-col justify-center items-center">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-50/20 to-blue-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Icon Container */}
                  <div className="relative mb-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">
                      {item.description}
                    </p>
                  </div>

                  {/* Hover Effect Arrow */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
