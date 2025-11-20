import { forwardRef } from "react";

interface OrderReceiptProps {
  plainText: string;
  type?: 'kitchen' | 'customer';
}

/**
 * OrderReceipt Component
 * 
 * Thermal receipt component optimized for 80mm paper width.
 * Designed to be printed via react-to-print library.
 * Uses plain text in a pre tag for maximum thermal printer compatibility.
 * Supports both kitchen and customer receipt formats.
 */
export const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ plainText, type = 'customer' }, ref) => {
    return (
      <div ref={ref} className="receipt-container">
        <pre className="receipt-text">{plainText}</pre>
      </div>
    );
  }
);

OrderReceipt.displayName = "OrderReceipt";
