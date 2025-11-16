import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Wifi, WifiOff, ArrowLeft } from "lucide-react";
import { useConnectionMonitor } from "@/components/ConnectionMonitor";
import logo from "@/assets/coco-loko-logo.png";

interface UniformHeaderProps {
  title: string;
  actions?: ReactNode;
  showDiagnostic?: boolean;
  showConnection?: boolean;
  onLogout?: () => void;
  onBack?: () => void;
  logoLink?: string;
}

export const UniformHeader = ({
  title,
  actions,
  showDiagnostic = false,
  showConnection = false,
  onBack,
  onLogout,
  logoLink,
}: UniformHeaderProps) => {
  const { connectionStatus, reconnect } = useConnectionMonitor();

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 transition-all"
                  onClick={onBack}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {logoLink ? (
                <a href={logoLink} className="relative cursor-pointer hover:opacity-80 transition-opacity">
                  <img 
                    src={logo} 
                    alt="Coco Loko" 
                    className="h-14 sm:h-16 w-auto drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </a>
              ) : (
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="Coco Loko" 
                    className="h-14 sm:h-16 w-auto drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
              </div>
            </div>

            {/* Center: Actions */}
            {actions && (
              <div className="flex gap-2 items-center">
                {actions}
              </div>
            )}

            {/* Right: Diagnostic, Connection Status & Logout */}
            <div className="flex items-center gap-2">
              {showDiagnostic && (
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = "/waiter-diagnostic"} 
                  className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  size="sm"
                  title="System Diagnostics"
                >
                  🔧
                </Button>
              )}
              
              {showConnection && (
                <>
                  {connectionStatus === 'connected' ? (
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full">
                      <Wifi className="h-4 w-4 text-green-200" />
                      <span className="text-sm text-green-200 font-medium">Online</span>
                    </div>
                  ) : connectionStatus === 'connecting' ? (
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full">
                      <Wifi className="h-4 w-4 animate-pulse text-yellow-200" />
                      <span className="text-sm text-yellow-200 font-medium">Conectando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full">
                        <WifiOff className="h-4 w-4 text-red-200" />
                        <span className="text-sm text-red-200 font-medium">Offline</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reconnect}
                        className="text-xs text-white border-white/30 hover:bg-white/10"
                      >
                        Reconectar
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {onLogout && (
                <Button
                  onClick={onLogout}
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
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 transition-all"
                    onClick={onBack}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                {logoLink ? (
                  <a href={logoLink} className="relative cursor-pointer hover:opacity-80 transition-opacity">
                    <img 
                      src={logo} 
                      alt="Coco Loko" 
                      className="h-12 sm:h-14 w-auto drop-shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </a>
                ) : (
                  <div className="relative">
                    <img 
                      src={logo} 
                      alt="Coco Loko" 
                      className="h-12 sm:h-14 w-auto drop-shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
                </div>
              </div>
              
              {/* Connection Status */}
              {showConnection && (
                <div className="flex items-center gap-2">
                  {connectionStatus === 'connected' ? (
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Wifi className="h-4 w-4 text-green-200" />
                      <span className="text-xs sm:text-sm text-green-200 font-medium">Online</span>
                    </div>
                  ) : connectionStatus === 'connecting' ? (
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Wifi className="h-4 w-4 animate-pulse text-yellow-200" />
                      <span className="text-xs sm:text-sm text-yellow-200 font-medium hidden sm:inline">Conectando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        <WifiOff className="h-4 w-4 text-red-200" />
                        <span className="text-xs sm:text-sm text-red-200 font-medium">Offline</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reconnect}
                        className="text-xs text-white border-white/30 hover:bg-white/10 backdrop-blur-sm"
                      >
                        Reconectar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {showDiagnostic && (
                  <Button 
                    variant="ghost" 
                    onClick={() => window.location.href = "/waiter-diagnostic"} 
                    className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                    size="sm"
                    title="System Diagnostics"
                  >
                    🔧
                  </Button>
                )}
                {actions}
              </div>
              {onLogout && (
                <Button
                  onClick={onLogout}
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
        </div>
      </div>
    </div>
  );
};
