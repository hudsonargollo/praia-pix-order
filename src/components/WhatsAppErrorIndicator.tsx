import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WhatsAppError } from '@/hooks/useWhatsAppErrors';

interface WhatsAppErrorIndicatorProps {
  errors: WhatsAppError[];
  orderId: string;
  compact?: boolean;
}

export function WhatsAppErrorIndicator({ errors, orderId, compact = false }: WhatsAppErrorIndicatorProps) {
  const navigate = useNavigate();

  if (!errors || errors.length === 0) {
    return null;
  }

  const criticalErrors = errors.filter(e => e.severity === 'critical' || e.severity === 'high');
  const hasCriticalErrors = criticalErrors.length > 0;

  const handleClick = () => {
    // Navigate to WhatsApp admin page with order filter
    navigate(`/whatsapp-admin?orderId=${orderId}`);
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-auto p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <AlertTriangle className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className="bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-900">
            Erro na Notificação WhatsApp
          </p>
          <p className="text-xs text-red-700 mt-1">
            {hasCriticalErrors ? (
              <>
                {criticalErrors.length} erro{criticalErrors.length > 1 ? 's' : ''} crítico{criticalErrors.length > 1 ? 's' : ''}
              </>
            ) : (
              <>
                {errors.length} erro{errors.length > 1 ? 's' : ''} detectado{errors.length > 1 ? 's' : ''}
              </>
            )}
          </p>
          <p className="text-xs text-red-600 mt-1 underline">
            Clique para ver detalhes
          </p>
        </div>
        <Badge 
          variant="destructive" 
          className="flex-shrink-0"
        >
          {errors.length}
        </Badge>
      </div>
    </div>
  );
}
