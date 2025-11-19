/**
 * Print utility functions for kitchen printing feature
 * Provides configuration helpers for thermal and standard paper printing
 */

/**
 * Print configuration for 80mm thermal receipt printers
 */
export const thermalPrintConfig = {
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
  documentTitle: 'Order Receipt',
};

/**
 * Print configuration for standard A4/Letter paper reports
 */
export const standardPrintConfig = {
  pageStyle: `
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
  `,
  documentTitle: 'Report',
};

/**
 * Format currency for Brazilian Real (BRL)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

/**
 * Format date and time for receipts
 */
export const formatReceiptDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Format date for reports
 */
export const formatReportDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
};

/**
 * Get print-friendly order status label
 */
export const getOrderStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    in_preparation: 'Em Preparo',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };
  return statusLabels[status] || status;
};

/**
 * LocalStorage key for auto-print setting
 */
export const AUTO_PRINT_STORAGE_KEY = 'kitchen_auto_print';

/**
 * Get auto-print enabled state from localStorage
 */
export const getAutoPrintEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(AUTO_PRINT_STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
};

/**
 * Set auto-print enabled state in localStorage
 */
export const setAutoPrintEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(AUTO_PRINT_STORAGE_KEY, enabled.toString());
  } catch (error) {
    console.error('Failed to save auto-print setting:', error);
  }
};
