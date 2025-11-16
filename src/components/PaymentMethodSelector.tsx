/**
 * Payment Method Selector Component
 * 
 * Provides a toggle interface for customers to choose between PIX and credit card payment methods.
 * Implements accessible radio button pattern with keyboard navigation support.
 * 
 * @module PaymentMethodSelector
 */

import { CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Available payment methods
 * @typedef {'pix' | 'credit_card'} PaymentMethod
 */
export type PaymentMethod = 'pix' | 'credit_card';

/**
 * Props for the PaymentMethodSelector component
 * 
 * @interface PaymentMethodSelectorProps
 * @property {PaymentMethod} selectedMethod - Currently selected payment method
 * @property {function} onMethodChange - Callback invoked when payment method changes
 * @property {boolean} [disabled] - Whether the selector is disabled (e.g., during payment processing)
 */
interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

/**
 * PaymentMethodSelector Component
 * 
 * Renders a two-option toggle for selecting payment method (PIX or Credit Card).
 * Features:
 * - Accessible radio button pattern with ARIA attributes
 * - Keyboard navigation support (Enter/Space to select)
 * - Visual feedback for selected state
 * - Disabled state during payment processing
 * - Minimum 44px touch targets for mobile accessibility
 * 
 * @component
 * @example
 * ```tsx
 * <PaymentMethodSelector
 *   selectedMethod="pix"
 *   onMethodChange={(method) => setPaymentMethod(method)}
 *   disabled={isProcessing}
 * />
 * ```
 */
const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  disabled = false
}: PaymentMethodSelectorProps) => {
  /**
   * Handles keyboard navigation for accessibility
   * Allows selection via Enter or Space key
   * 
   * @param {React.KeyboardEvent} e - Keyboard event
   * @param {PaymentMethod} method - Payment method to select
   */
  const handleKeyDown = (e: React.KeyboardEvent, method: PaymentMethod) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onMethodChange(method);
      }
    }
  };

  return (
    <div 
      className="w-full"
      role="radiogroup"
      aria-label="Selecione o método de pagamento"
    >
      <div className="grid grid-cols-2 gap-3 p-1 bg-muted rounded-lg">
        {/* PIX Option */}
        <button
          type="button"
          role="radio"
          aria-checked={selectedMethod === 'pix'}
          aria-label="Pagar com PIX"
          disabled={disabled}
          onClick={() => !disabled && onMethodChange('pix')}
          onKeyDown={(e) => handleKeyDown(e, 'pix')}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-md font-semibold text-sm transition-all duration-200 min-h-[44px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedMethod === 'pix'
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-transparent text-muted-foreground hover:bg-background hover:text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <QrCode 
            className={cn(
              "w-5 h-5",
              selectedMethod === 'pix' ? "text-primary-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          <span>PIX</span>
        </button>

        {/* Credit Card Option */}
        <button
          type="button"
          role="radio"
          aria-checked={selectedMethod === 'credit_card'}
          aria-label="Pagar com Cartão de Crédito"
          disabled={disabled}
          onClick={() => !disabled && onMethodChange('credit_card')}
          onKeyDown={(e) => handleKeyDown(e, 'credit_card')}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-md font-semibold text-sm transition-all duration-200 min-h-[44px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedMethod === 'credit_card'
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-transparent text-muted-foreground hover:bg-background hover:text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <CreditCard 
            className={cn(
              "w-5 h-5",
              selectedMethod === 'credit_card' ? "text-primary-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          <span>Cartão de Crédito</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
