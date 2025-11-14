/**
 * CommissionDisplay Component
 * 
 * Reusable component for displaying commission information with proper styling,
 * icons, and tooltips based on payment status.
 */

import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CommissionDisplayConfig } from '@/types/commission';

interface CommissionDisplayProps {
  /** Commission display configuration from getCommissionStatus() */
  config: CommissionDisplayConfig;
  /** Whether to show the status icon */
  showIcon?: boolean;
  /** Size variant for the display */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Size-based styling configurations
 */
const sizeStyles = {
  sm: {
    text: 'text-sm',
    icon: 'w-3 h-3'
  },
  md: {
    text: 'text-base',
    icon: 'w-4 h-4'
  },
  lg: {
    text: 'text-lg',
    icon: 'w-5 h-5'
  }
} as const;

/**
 * Icon component mapping
 */
const iconMap = {
  CheckCircle,
  Clock,
  XCircle
} as const;

/**
 * CommissionDisplay - Displays commission amount with status indicator
 * 
 * @example
 * ```tsx
 * const config = getCommissionStatus(order);
 * <CommissionDisplay config={config} showIcon={true} size="md" />
 * ```
 */
export function CommissionDisplay({ 
  config, 
  showIcon = true, 
  size = 'md' 
}: CommissionDisplayProps) {
  const IconComponent = iconMap[config.icon];
  const styles = sizeStyles[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {showIcon && (
              <IconComponent 
                className={cn(styles.icon, config.className)} 
                aria-hidden="true"
              />
            )}
            <span className={cn(config.className, styles.text)}>
              {config.displayAmount}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
