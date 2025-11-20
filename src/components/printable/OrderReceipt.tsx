import { forwardRef } from "react";

interface OrderReceiptProps {
  plainText: string;
}

/**
 * OrderReceipt Component
 * 
 * Thermal receipt component optimized for 80mm paper width.
 * Designed to be printed via react-to-print library.
 * Uses plain text in a pre tag for maximum thermal printer compatibility.
 */
export const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ plainText }, ref) => {
    return (
      <div ref={ref} className="receipt-container">
        <pre className="receipt-text">{plainText}</pre>
      </div>
    );
  }
);

OrderReceipt.displayName = "OrderReceipt";
