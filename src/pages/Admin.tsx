import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Users, ShoppingBag, Settings, BarChart3, MessageSquare, LogOut, ChefHat, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-acai">
      {/* Header */}
      <div className="bg-gradient-sunset text-white p-4 sm:p-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src={logo} 
                alt="Coco Loko Açaiteria" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Painel Administrativo</h1>
                <p className="text-white/90 mt-1 text-sm sm:text-base">Sistema de Gestão</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8">
        <Card className="max-w-6xl mx-auto shadow-xl">
          <CardHeader className="pb-6">
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminMenuItems.map((item) => (
                <Button
                  key={item.title}
                  variant="outline"
                  className="flex flex-col h-40 p-6 justify-center items-center text-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 hover:text-white hover:border-transparent transition-all duration-300 group"
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="w-12 h-12 mb-3 text-primary group-hover:text-white transition-colors" />
                  <span className="font-semibold text-lg mb-1 group-hover:text-white transition-colors">{item.title}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-white/80 transition-colors">{item.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
