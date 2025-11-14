import { Button } from "@/components/ui/button";
import { Wifi, WifiOff } from "lucide-react";

export interface ConnectionStatusBadgeProps {
  status: "connected" | "connecting" | "disconnected";
  onReconnect: () => void;
  compact?: boolean;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  status,
  onReconnect,
  compact = false,
}) => {
  if (status === "connected") {
    return (
      <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
        <Wifi className="h-4 w-4 text-green-200" />
        {!compact && (
          <span className="text-sm text-green-200 font-medium">Online</span>
        )}
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
        <Wifi className="h-4 w-4 animate-pulse text-yellow-200" />
        {!compact && (
          <span className="text-sm text-yellow-200 font-medium hidden sm:inline">
            Conectando...
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
        <WifiOff className="h-4 w-4 text-red-200" />
        {!compact && (
          <span className="text-sm text-red-200 font-medium">Offline</span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReconnect}
        className="text-xs text-white border-white/30 hover:bg-white/10 backdrop-blur-sm"
      >
        Reconectar
      </Button>
    </div>
  );
};
