# Implementation Plan

- [x] 1. Install dependencies and create utility functions
  - Install `react-to-print` package via npm
  - Create `src/lib/printUtils.ts` with print configuration helpers
  - _Requirements: 1, 2, 3_

- [ ] 2. Create OrderReceipt print component
  - Create `src/components/printable/OrderReceipt.tsx` component
  - Implement 80mm thermal paper layout with header, items, notes, and footer sections
  - Add print-specific CSS styles for thermal receipt formatting
  - Add `@media print` styles to `src/index.css` for 80mm paper size
  - _Requirements: 1.4, 1.5_

- [ ] 3. Create ReportPrintView component
  - Create `src/components/printable/ReportPrintView.tsx` component
  - Implement A4/Letter paper layout with report header, stats summary, and daily breakdown table
  - Add print-specific CSS styles for standard paper formatting
  - _Requirements: 3.2_

- [ ] 4. Implement usePrintOrder hook for manual printing
  - Create `src/hooks/usePrintOrder.ts` hook
  - Integrate `useReactToPrint` from react-to-print library
  - Implement order data fetching and OrderReceipt rendering
  - Handle print dialog triggering and error states
  - _Requirements: 2.1, 2.2_

- [ ] 5. Implement useAutoPrint hook for automatic printing
  - Create `src/hooks/useAutoPrint.ts` hook
  - Implement localStorage persistence for auto-print toggle state (key: `kitchen_auto_print`)
  - Integrate with existing `useKitchenOrders` realtime hook to detect status changes
  - Implement logic to trigger print when order status changes to `in_preparation`
  - _Requirements: 1.1, 1.3_

- [ ] 6. Create AutoPrintToggle component
  - Create `src/components/AutoPrintToggle.tsx` component
  - Implement toggle switch UI with printer icon and label
  - Connect to useAutoPrint hook for state management
  - _Requirements: 1.2_

- [ ] 7. Integrate auto-print into Kitchen page
  - Update `src/pages/staff/Kitchen.tsx` to add AutoPrintToggle to header
  - Integrate useAutoPrint hook into Kitchen component
  - Connect auto-print trigger to order status change handler
  - Test automatic printing when orders reach `in_preparation` status
  - _Requirements: 1.1, 1.2_

- [ ] 8. Add manual print button to OrderCardInfo component
  - Update `src/components/OrderCardInfo.tsx` to add print button
  - Integrate usePrintOrder hook
  - Render hidden OrderReceipt component for printing
  - _Requirements: 2.1, 2.2_

- [ ] 9. Add manual print button to CompactOrderCard component
  - Update `src/components/CompactOrderCard.tsx` to add print button in action buttons section
  - Integrate usePrintOrder hook
  - Render hidden OrderReceipt component for printing
  - _Requirements: 2.1, 2.2_

- [ ] 10. Implement usePrintReport hook
  - Create `src/hooks/usePrintReport.ts` hook
  - Integrate `useReactToPrint` for report printing
  - Implement ReportPrintView rendering with current report data
  - _Requirements: 3.1, 3.2_

- [ ] 11. Integrate report printing into Reports page
  - Update `src/pages/admin/Reports.tsx` to add "Print Report" button
  - Integrate usePrintReport hook
  - Render hidden ReportPrintView component with current stats and date range
  - Position button next to existing "Export CSV" button
  - _Requirements: 3.1, 3.2_

- [ ] 12. Add print styles to global CSS
  - Update `src/index.css` with comprehensive `@media print` rules
  - Hide non-printable elements (navigation, buttons, backgrounds)
  - Ensure print content displays correctly
  - Remove shadows, gradients, and decorative elements for print
  - _Requirements: 1.4, 1.5, 3.2_
