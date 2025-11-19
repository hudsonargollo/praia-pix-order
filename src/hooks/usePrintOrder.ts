import { useRef, useCallback, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  order_notes?: string | null;
  created_at: string;
  waiter_id?: string | null;
}

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface PrintOrderData {
  order: OrderData;
  items: OrderItem[];
  waiterName?: string | null;
}

/**
 * Hook for manual order printing
 * 
 * Provides functionality to print order receipts on demand.
 * Fetches order data, renders OrderReceipt component, and triggers browser print dialog.
 * 
 * Requirements: 2.1, 2.2
 */
export function usePrintOrder() {
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [orderData, setOrderData] = useState<PrintOrderData | null>(null);

  // Fetch order data including items and waiter name
  const fetchOrderData = useCallback(async (orderId: string): Promise<PrintOrderData | null> => {
    try {
      // Fetch order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, total_amount, order_notes, created_at, waiter_id')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        toast.error('Erro ao buscar pedido');
        return null;
      }

      if (!order) {
        toast.error('Pedido não encontrado');
        return null;
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('id, item_name, quantity, unit_price')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        toast.error('Erro ao buscar itens do pedido');
        return null;
      }

      // Fetch waiter name if waiter_id exists
      let waiterName: string | null = null;
      if (order.waiter_id) {
        const { data: waiterData, error: waiterError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', order.waiter_id)
          .single();

        if (!waiterError && waiterData) {
          waiterName = waiterData.full_name;
        }
      }

      return {
        order: order as OrderData,
        items: (items || []) as OrderItem[],
        waiterName,
      };
    } catch (error) {
      console.error('Error fetching order data:', error);
      toast.error('Erro ao carregar dados do pedido');
      return null;
    }
  }, []);

  // Handle print completion
  const handleAfterPrint = useCallback(() => {
    setIsPrinting(false);
    console.log('Print completed');
  }, []);

  // Handle print error
  const handlePrintError = useCallback((errorLocation: 'onBeforePrint' | 'print', error: Error) => {
    console.error(`Print error at ${errorLocation}:`, error);
    setIsPrinting(false);
    toast.error('Erro ao imprimir');
  }, []);

  // Configure react-to-print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Pedido-${orderData?.order.order_number || 'N/A'}`,
    onAfterPrint: handleAfterPrint,
    onPrintError: handlePrintError,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          width: 80mm;
        }
      }
    `,
  });

  // Trigger print when orderData is set and we're in printing state
  useEffect(() => {
    if (orderData && isPrinting && printRef.current) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        handlePrint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orderData, isPrinting, handlePrint]);

  // Main print function
  const printOrder = useCallback(async (orderId: string) => {
    if (isPrinting) {
      console.log('Print already in progress');
      return;
    }

    setIsPrinting(true);

    try {
      // Fetch order data
      const data = await fetchOrderData(orderId);
      
      if (!data) {
        setIsPrinting(false);
        return;
      }

      // Set order data for rendering - useEffect will trigger print
      setOrderData(data);
    } catch (error) {
      console.error('Error preparing print:', error);
      toast.error('Erro ao preparar impressão');
      setIsPrinting(false);
    }
  }, [isPrinting, fetchOrderData]);

  return {
    printOrder,
    isPrinting,
    orderData,
    printRef,
  };
}
