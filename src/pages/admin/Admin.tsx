import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ShoppingBag, BarChart3, ChefHat, MessageCircle, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UniformHeader } from "@/components/UniformHeader";

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
    { title: "Criar Pedido", icon: PlusCircle, path: "/menu", description: "Novo pedido", highlight: true },
    { title: "Pedidos", icon: ChefHat, path: "/cashier", description: "Gerenciar pedidos" },
    { title: "Produtos", icon: ShoppingBag, path: "/admin/products", description: "Gerenciar cardápio" },
    { title: "Relatórios", icon: BarChart3, path: "/reports", description: "Análises e métricas" },
    { title: "Garçons", icon: Users, path: "/waiter-management", description: "Gerenciar equipe" },
    { title: "Clientes", icon: Users, path: "/customers", description: "Gerenciar clientes" },
    { title: "WhatsApp", icon: MessageCircle, path: "/whatsapp-admin", description: "Configurar WhatsApp" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Uniform Header */}
      <UniformHeader
        title="Admin"
        onLogout={handleLogout}
      />

      {/* Enhanced Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Responsive Grid - 2x2 on mobile, 2 lines on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-6xl mx-auto">
            {adminMenuItems.map((item) => (
              <Card
                key={item.title}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 backdrop-blur-sm overflow-hidden shadow-lg aspect-square md:aspect-auto ${
                  item.highlight 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-white via-white to-purple-50/30'
                }`}
                onClick={() => handleNavigation(item.path)}
              >
                <CardContent className="p-4 sm:p-6 text-center relative h-full flex flex-col justify-center items-center">
                  {/* Background Pattern */}
                  <div className={`absolute inset-0 transition-opacity duration-300 ${
                    item.highlight
                      ? 'bg-gradient-to-br from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100'
                      : 'bg-gradient-to-br from-transparent via-purple-50/20 to-blue-50/40 opacity-0 group-hover:opacity-100'
                  }`}></div>
                  
                  {/* Icon Container */}
                  <div className="relative mb-3 sm:mb-4">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 ${
                      item.highlight
                        ? 'bg-white/20'
                        : 'bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600'
                    }`}>
                      <item.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${item.highlight ? 'text-white' : 'text-white'}`} />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative">
                    <h3 className={`font-bold text-sm sm:text-lg mb-1 sm:mb-2 transition-colors ${
                      item.highlight
                        ? 'text-white group-hover:text-white'
                        : 'text-gray-900 group-hover:text-purple-700'
                    }`}>
                      {item.title}
                    </h3>
                    <p className={`text-xs transition-colors hidden sm:block ${
                      item.highlight
                        ? 'text-white/90 group-hover:text-white'
                        : 'text-gray-600 group-hover:text-gray-700'
                    }`}>
                      {item.description}
                    </p>
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
