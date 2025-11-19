import { Printer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AutoPrintToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

/**
 * Toggle control for enabling/disabling automatic printing in Kitchen view
 * 
 * Requirements: 1.2
 */
export function AutoPrintToggle({ enabled, onToggle }: AutoPrintToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Printer className={`h-4 w-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
      <Label 
        htmlFor="auto-print-toggle" 
        className="text-sm font-medium cursor-pointer"
      >
        Impressão Automática
      </Label>
      <Switch
        id="auto-print-toggle"
        checked={enabled}
        onCheckedChange={onToggle}
        aria-label="Toggle automatic printing"
      />
    </div>
  );
}
