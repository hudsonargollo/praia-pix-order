/**
 * OrderItemRow Component
 * 
 * Displays a single order item with quantity controls and remove button.
 * Can be in editable or read-only mode.
 */

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

export interface OrderItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface OrderItemRowProps {
  /** The order item to display */
  item: OrderItem;
  /** Whether the item can be edited */
  isEditable: boolean;
  /** Callback when quantity changes */
  onQuantityChange: (delta: number) => void;
  /** Callback when item is removed */
  onRemove: () => void;
}

/**
 * OrderItemRow displays a single order item with controls
 * for editing quantity and removing the item.
 */
export function OrderItemRow({
  item,
  isEditable,
  onQuantityChange,
  onRemove
}: OrderItemRowProps) {
  const subtotal = item.quantity * item.unit_price;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-0 transition-all duration-200 hover:bg-gray-50 gap-2 sm:gap-0">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm sm:text-base font-medium text-gray-900 break-words">
          {item.item_name}
        </h4>
        <p className="text-xs sm:text-sm text-gray-600">
          {item.unit_price.toLocaleString("pt-BR", { 
            style: "currency", 
            currency: "BRL" 
          })} cada
        </p>
      </div>

      {isEditable ? (
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 sm:ml-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-8 sm:w-8 hover:bg-gray-200 touch-manipulation"
              onClick={() => onQuantityChange(-1)}
              disabled={item.quantity <= 1}
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm sm:text-base font-semibold text-gray-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-8 sm:w-8 hover:bg-gray-200 touch-manipulation"
              onClick={() => onQuantityChange(1)}
              disabled={item.quantity >= 99}
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Subtotal */}
          <span className="text-sm sm:text-base font-semibold text-purple-600 min-w-[4rem] sm:min-w-[5rem] text-right transition-all duration-300">
            {subtotal.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })}
          </span>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-8 sm:w-8 text-red-600 hover:bg-red-50 hover:text-red-700 touch-manipulation"
            onClick={onRemove}
            aria-label="Remover item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 sm:ml-4">
          <span className="text-xs sm:text-sm text-gray-600">
            {item.quantity}x
          </span>
          <span className="text-sm sm:text-base font-semibold text-gray-900 min-w-[4rem] sm:min-w-[5rem] text-right">
            {subtotal.toLocaleString("pt-BR", { 
              style: "currency", 
              currency: "BRL" 
            })}
          </span>
        </div>
      )}
    </div>
  );
}
