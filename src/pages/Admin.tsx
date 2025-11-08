import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Users, ShoppingBag, Settings, BarChart3, MessageSquare } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();

  const adminMenuItems = [
    { title: "Relatórios", icon: BarChart3, path: "/reports" },
    { title: "Produtos", icon: ShoppingBag, path: "/admin/products" },
    { title: "Garçons", icon: Users, path: "/admin/waiters" }, // New Waiter Management
    { title: "WhatsApp Admin", icon: MessageSquare, path: "/whatsapp-admin" },
    { title: "Monitoramento", icon: LayoutDashboard, path: "/monitoring" },
    { title: "Configurações", icon: Settings, path: "/admin/settings" }, // Placeholder
  ];

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Painel Administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">
            Bem-vindo ao painel de controle. Selecione uma opção para gerenciar o sistema.
          </p>
          <Separator className="mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {adminMenuItems.map((item) => (
              <Button
                key={item.title}
                variant="outline"
                className="flex flex-col h-32 p-4 justify-center items-center text-center"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-8 h-8 mb-2 text-primary" />
                <span className="font-semibold">{item.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
