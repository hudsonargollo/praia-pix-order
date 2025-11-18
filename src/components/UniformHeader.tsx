import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Wifi, WifiOff, ArrowLeft } from "lucide-react";
import { useConnectionMonitor } from "@/components/ConnectionMonitor";
import logo from "@/assets/coco-loko-logo.png";

interface UniformHeaderProps {
  title?: string;
  actions?: ReactNode;
  showDiagnostic?: boolean;
  showConnection?: boolean;
  onLogout?: () => void;
  onBack?: () => void;
}

export const UniformHeader = ({
  title,
  actions,
  showDiagnostic = false,
  showConnection = false,
  onBack,
  onLogout,
}: UniformHeaderProps) => {
  const { connectionStatus, reconnect } = useConnectionMonitor();

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 sm:py-4">
          {/* Desktop Layout - Single Line */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {/* Left: Back Button, Logo and Title */}
            <div className="flex items-center gap-3">
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
              <a href="/admin" className="relative cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
                <img 
                  src={logo} 
                  alt="Coco Loko" 
                  className="h-10 sm:h-12 w-auto drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </a>
              {title && (
                <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
              )}
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

          {/* Mobile/Tablet Layout - Single Line */}
          <div className="lg:hidden">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 transition-all flex-shrink-0"
                    onClick={onBack}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <a href="/admin" className="relative cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
                  <img 
                    src={logo} 
                    alt="Coco Loko" 
                    className="h-8 w-auto drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                </a>
                {title && (
                  <h1 className="text-base sm:text-lg font-bold truncate">{title}</h1>
                )}
              </div>
              
              {/* Actions and Buttons */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                {actions}
                {showDiagnostic && (
                  <Button 
                    variant="ghost" 
                    onClick={() => window.location.href = "/waiter-diagnostic"} 
                    className="text-white hover:bg-white/20 transition-all h-8 px-2"
                    size="sm"
                    title="System Diagnostics"
                  >
                    🔧
                  </Button>
                )}
                
                {/* Connection Status */}
                {showConnection && (
                  <>
                    {connectionStatus === 'connected' ? (
                      <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                        <Wifi className="h-3.5 w-3.5 text-green-200" />
                        <span className="text-xs text-green-200 font-medium hidden sm:inline">Online</span>
                      </div>
                    ) : connectionStatus === 'connecting' ? (
                      <div className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                        <Wifi className="h-3.5 w-3.5 animate-pulse text-yellow-200" />
                        <span className="text-xs text-yellow-200 font-medium hidden sm:inline">Conectando...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 bg-red-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                          <WifiOff className="h-3.5 w-3.5 text-red-200" />
                          <span className="text-xs text-red-200 font-medium hidden sm:inline">Offline</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={reconnect}
                          className="text-xs text-white border-white/30 hover:bg-white/10 backdrop-blur-sm h-7 px-2"
                        >
                          Reconectar
                        </Button>
                      </>
                    )}
                  </>
                )}
                
                {onLogout && (
                  <Button
                    onClick={onLogout}
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all h-8"
                    size="sm"
                  >
                    <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
