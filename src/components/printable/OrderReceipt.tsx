import { forwardRef } from "react";

interface OrderReceiptProps {
  order: {
    id: string;
    order_number: number;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    order_notes?: string | null;
    created_at: string;
    waiter_id?: string | null;
  };
  items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
  }>;
  waiterName?: string | null;
  showLogo?: boolean;
}

/**
 * OrderReceipt Component
 * 
 * Thermal receipt component optimized for 80mm paper width.
 * Designed to be printed via react-to-print library.
 * Uses monospace font for proper alignment and high contrast for readability.
 */
export const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ order, items, waiterName, showLogo = true }, ref) => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    };

    return (
      <div ref={ref} className="receipt-container">
        <div className="receipt">
          {/* Header */}
          <div className="receipt-header">
            {showLogo && (
              <div className="receipt-logo">
                <h1>COCO LOKO</h1>
                <p>Açaiteria</p>
              </div>
            )}
            <div className="receipt-divider">================================</div>
          </div>

          {/* Order Info */}
          <div className="receipt-order-info">
            <div className="receipt-row">
              <span className="receipt-label">Pedido:</span>
              <span className="receipt-value">#{order.order_number}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Data:</span>
              <span className="receipt-value">{formatDate(order.created_at)}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Cliente:</span>
              <span className="receipt-value">{order.customer_name}</span>
            </div>
            {waiterName && waiterName !== 'Cliente' && (
              <div className="receipt-row">
                <span className="receipt-label">Garçom:</span>
                <span className="receipt-value">{waiterName}</span>
              </div>
            )}
            <div className="receipt-divider">================================</div>
          </div>

          {/* Items */}
          <div className="receipt-items">
            <div className="receipt-items-header">
              <span>QTD</span>
              <span>ITEM</span>
              <span>VALOR</span>
            </div>
            <div className="receipt-divider">--------------------------------</div>
            {items.map((item) => (
              <div key={item.id} className="receipt-item">
                <div className="receipt-item-row">
                  <span className="receipt-item-qty">{item.quantity}x</span>
                  <span className="receipt-item-name">{item.item_name}</span>
                  <span className="receipt-item-price">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
            <div className="receipt-divider">--------------------------------</div>
          </div>

          {/* Notes */}
          {order.order_notes && (
            <div className="receipt-notes">
              <div className="receipt-notes-label">OBSERVAÇÕES:</div>
              <div className="receipt-notes-text">{order.order_notes}</div>
              <div className="receipt-divider">================================</div>
            </div>
          )}

          {/* Total */}
          <div className="receipt-total">
            <div className="receipt-total-row">
              <span className="receipt-total-label">TOTAL:</span>
              <span className="receipt-total-value">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <div className="receipt-divider">================================</div>
            <p className="receipt-thanks">Obrigado pela preferência!</p>
            <p className="receipt-contact">Tel: {order.customer_phone}</p>
          </div>
        </div>
      </div>
    );
  }
);

OrderReceipt.displayName = "OrderReceipt";
