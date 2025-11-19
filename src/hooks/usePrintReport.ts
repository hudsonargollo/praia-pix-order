import { useRef, useCallback, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
}

interface ReportPrintData {
  dateRange: { from: Date; to: Date };
  stats: OrderStats;
  dailyStats: DailyStats[];
  waiterName?: string;
  reportType?: "geral" | "individual";
}

/**
 * Hook for report printing
 * 
 * Provides functionality to print administrative reports on demand.
 * Renders ReportPrintView component and triggers browser print dialog.
 * 
 * Requirements: 3.1, 3.2
 */
export function usePrintReport() {
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [reportData, setReportData] = useState<ReportPrintData | null>(null);

  // Handle print completion
  const handleAfterPrint = useCallback(() => {
    setIsPrinting(false);
    console.log('Report print completed');
  }, []);

  // Handle print error
  const handlePrintError = useCallback((errorLocation: 'onBeforePrint' | 'print', error: Error) => {
    console.error(`Report print error at ${errorLocation}:`, error);
    setIsPrinting(false);
  }, []);

  // Configure react-to-print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Relatorio-${reportData?.reportType || 'geral'}-${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: handleAfterPrint,
    onPrintError: handlePrintError,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  // Main print function
  const printReport = useCallback((data: ReportPrintData) => {
    if (isPrinting) {
      console.log('Print already in progress');
      return;
    }

    setIsPrinting(true);

    try {
      // Set report data for rendering
      setReportData(data);

      // Wait for next tick to ensure component is rendered
      setTimeout(() => {
        handlePrint();
      }, 100);
    } catch (error) {
      console.error('Error preparing report print:', error);
      setIsPrinting(false);
    }
  }, [isPrinting, handlePrint]);

  return {
    printReport,
    isPrinting,
    reportData,
    printRef,
  };
}
