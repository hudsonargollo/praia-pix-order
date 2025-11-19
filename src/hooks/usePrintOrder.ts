import { useCallback, useState } from 'react';
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
 * Fetches order data and opens print dialog with formatted receipt.
 * 
 * Requirements: 2.1, 2.2
 */
export function usePrintOrder() {
  const [isPrinting, setIsPrinting] = useState(false);

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

  // Generate HTML for receipt
  const generateReceiptHTML = (data: PrintOrderData): string => {
    const formatCurrency = (value: number) => {
      // Format as "R$ 123.45" using simple string formatting
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Pedido #${data.order.order_number}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: #fff;
            width: 80mm;
            padding: 8px;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
          }
          .logo h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 4px 0;
            letter-spacing: 2px;
          }
          .logo p {
            font-size: 14px;
            margin: 0 0 8px 0;
          }
          .divider {
            font-size: 10px;
            margin: 4px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 11px;
          }
          .label {
            font-weight: bold;
          }
          .items {
            margin: 8px 0;
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 4px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .item-qty {
            width: 15%;
            font-weight: bold;
          }
          .item-name {
            width: 55%;
          }
          .item-price {
            width: 30%;
            text-align: right;
            font-weight: bold;
          }
          .notes {
            margin: 8px 0;
            padding: 4px 0;
          }
          .notes-label {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .notes-text {
            font-size: 11px;
            white-space: pre-wrap;
          }
          .total {
            margin: 8px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: bold;
            padding: 4px 0;
          }
          .total-value {
            font-size: 18px;
          }
          .footer {
            text-align: center;
            margin-top: 8px;
          }
          .thanks {
            font-size: 12px;
            font-weight: bold;
            margin: 8px 0 4px 0;
          }
          .contact {
            font-size: 10px;
          }
          @media print {
            body {
              width: 80mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <h1>COCO LOKO</h1>
            <p>Acaiteria</p>
          </div>
          <div class="divider">================================</div>
        </div>

        <div class="order-info">
          <div class="row">
            <span class="label">Pedido:</span>
            <span>#${data.order.order_number}</span>
          </div>
          <div class="row">
            <span class="label">Data:</span>
            <span>${formatDate(data.order.created_at)}</span>
          </div>
          <div class="row">
            <span class="label">Cliente:</span>
            <span>${data.order.customer_name}</span>
          </div>
          ${data.waiterName && data.waiterName !== 'Cliente' ? `
          <div class="row">
            <span class="label">Garcom:</span>
            <span>${data.waiterName}</span>
          </div>
          ` : ''}
          <div class="divider">================================</div>
        </div>

        <div class="items">
          <div class="items-header">
            <span>QTD</span>
            <span>ITEM</span>
            <span>VALOR</span>
          </div>
          <div class="divider">--------------------------------</div>
          ${data.items.map(item => `
          <div class="item">
            <span class="item-qty">${item.quantity}x</span>
            <span class="item-name">${item.item_name}</span>
            <span class="item-price">${formatCurrency(item.unit_price * item.quantity)}</span>
          </div>
          `).join('')}
          <div class="divider">--------------------------------</div>
        </div>

        ${data.order.order_notes ? `
        <div class="notes">
          <div class="notes-label">OBSERVACOES:</div>
          <div class="notes-text">${data.order.order_notes}</div>
          <div class="divider">================================</div>
        </div>
        ` : ''}

        <div class="total">
          <div class="total-row">
            <span>TOTAL:</span>
            <span class="total-value">${formatCurrency(data.order.total_amount)}</span>
          </div>
        </div>

        <div class="footer">
          <div class="divider">================================</div>
          <p class="thanks">Obrigado pela preferencia!</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;
  };

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

      // Generate HTML and open print window
      const html = generateReceiptHTML(data);
      const printWindow = window.open('', '_blank', 'width=302,height=600');
      
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        toast.error('Não foi possível abrir janela de impressão');
      }
      
      setIsPrinting(false);
    } catch (error) {
      console.error('Error preparing print:', error);
      toast.error('Erro ao preparar impressão');
      setIsPrinting(false);
    }
  }, [isPrinting, fetchOrderData, generateReceiptHTML]);

  return {
    printOrder,
    isPrinting,
  };
}
