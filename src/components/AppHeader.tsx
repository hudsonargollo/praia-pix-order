import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Package, Bell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { useConnectionMonitor } from "@/components/ConnectionMonitor";
import logo from "@/assets/coco-loko-logo.png";

export interface HeaderAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

export interface AppHeaderProps {
  // Page identification
  pageName?: string;
  
  // Action buttons (optional)
  actions?: HeaderAction[];
  
  // Show/hide elements
  showConnectionStatus?: boolean;
  showActionButtons?: boolean;
  showLogout?: boolean;
  
  // Custom content
  customContent?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  pageName,
  actions = [],
  showConnectionStatus = true,
  showActionButtons = true,
  showLogout = true,
  customContent,
}) => {
  const navigate = useNavigate();
  const { connectionStatus, reconnect } = useConnectionMonitor();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const defaultActions: HeaderAction[] = [
    {
      label: "Relatórios",
      icon: BarChart3,
      onClick: () => navigate("/reports"),
    },
    {
      label: "Produtos",
      icon: Package,
      onClick: () => navigate("/admin/products"),
    },
    {
      label: "WhatsApp",
      icon: Bell,
      onClick: () => navigate("/whatsapp-admin"),
    },
  ];

  const allActions = [...defaultActions, ...actions];

  return (
    <header className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 lg:bg-orange-500 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            {/* Left: Logo */}
            <div className="flex items-center">
              <div className="relative">
                <img src={logo} alt="Coco Loko" className="h-20 w-auto" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Center: Action Buttons */}
            {showActionButtons && (
              <div className="flex gap-2">
                {allActions
                  .filter((a) => !a.mobileOnly)
                  .map((action, idx) => (
                    <Button
                      key={idx}
                      onClick={action.onClick}
                      className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                      size="sm"
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
              </div>
            )}

            {/* Right: Connection Status & Logout */}
            <div className="flex items-center gap-3">
              {showConnectionStatus && (
                <ConnectionStatusBadge
                  status={connectionStatus}
                  onReconnect={reconnect}
                />
              )}
              {showLogout && (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 transition-all duration-300 hover:scale-105"
                  size="sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              )}
            </div>
          </div>

          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden">
            {/* Top row: Logo, Connection, Logout */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                <div className="relative">
                  <img
                    src={logo}
                    alt="Coco Loko"
                    className="h-12 sm:h-16 w-auto drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {showConnectionStatus && (
                  <ConnectionStatusBadge
                    status={connectionStatus}
                    onReconnect={reconnect}
                    compact
                  />
                )}
                {showLogout && (
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    size="sm"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom row: Action Buttons */}
            {showActionButtons && (
              <div className="flex flex-wrap gap-2">
                {allActions
                  .filter((a) => !a.desktopOnly)
                  .map((action, idx) => (
                    <Button
                      key={idx}
                      onClick={action.onClick}
                      className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                      size="sm"
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  ))}
              </div>
            )}
          </div>

          {/* Custom Content */}
          {customContent}
        </div>
      </div>
    </header>
  );
};
