# Kitchen Printing Design

## Overview

This feature implements automatic and manual printing capabilities for kitchen receipts and administrative reports. The solution uses `react-to-print` library to handle browser-based printing, with specialized components for thermal (80mm) and standard (A4/Letter) paper formats.

## Architecture

### Print Library Selection

**react-to-print** is chosen for the following reasons:
- Pure React solution with no external dependencies
- Renders hidden React components for print-only content
- Supports custom CSS for different paper sizes
- Works with browser's native print dialog
- Compatible with thermal and standard printers

### Component Structure

```
src/
├── components/
│   ├── printable/
│   │   ├── OrderReceipt.tsx          # 80mm thermal receipt
│   │   └── ReportPrintView.tsx       # A4/Letter report
│   ├── PrintButton.tsx                # Reusable print trigger
│   └── AutoPrintToggle.tsx            # Kitchen auto-print control
├── hooks/
│   ├── usePrintOrder.ts               # Manual order printing
│   ├── usePrintReport.ts              # Report printing
│   └── useAutoPrint.ts                # Auto-print logic
└── lib/
    └── printUtils.ts                  # Print configuration helpers
```

## Components and Interfaces

### 1. OrderReceipt Component

**Purpose**: Renders a print-optimized order receipt for 80mm thermal printers

**Props**:
```typescript
interface OrderReceiptProps {
  order: Order;
  items: OrderItem[];
  showLogo?: boolean;
}
```

**Layout Structure**:
- Header: Shop name/logo (optional)
- Order metadata: Order #, Date/Time, Customer name
- Items table: Quantity, Item name, Price
- Notes section: Order notes (if present)
- Footer: Total amount, thank you message

**Styling**:
- Width: 80mm (302px)
- Font: Monospace for alignment, 12-14px
- High contrast: Black text on white background
- No margins/padding on body
- Line breaks for sections

### 2. ReportPrintView Component

**Purpose**: Renders a print-optimized daily/period report for standard printers

**Props**:
```typescript
interface ReportPrintViewProps {
  dateRange: { from: Date; to: Date };
  stats: OrderStats;
  dailyStats: DailyStats[];
  waiterName?: string;
}
```

**Layout Structure**:
- Header: Report title, date range, waiter name (if individual)
- Summary cards: Total orders, revenue, average ticket, completed
- Daily breakdown table: Date, Orders, Revenue
- Footer: Totals, generation timestamp

**Styling**:
- Width: A4/Letter (210mm/8.5in)
- Font: Sans-serif, 10-12px
- Tables with borders
- Page breaks for long reports
- Print-friendly colors (no gradients)

### 3. usePrintOrder Hook

**Purpose**: Provides manual printing functionality for orders

```typescript
interface UsePrintOrderReturn {
  printOrder: (orderId: string) => void;
  isPrinting: boolean;
}

function usePrintOrder(): UsePrintOrderReturn
```

**Implementation**:
- Fetches order and items data
- Uses `useReactToPrint` hook
- Renders OrderReceipt component
- Triggers browser print dialog

### 4. useAutoPrint Hook

**Purpose**: Manages automatic printing when orders reach "in_preparation" status

```typescript
interface UseAutoPrintOptions {
  enabled: boolean;
  onPrint?: (orderId: string) => void;
}

function useAutoPrint(options: UseAutoPrintOptions): {
  isAutoPrintEnabled: boolean;
  toggleAutoPrint: () => void;
}
```

**Implementation**:
- Reads auto-print state from localStorage (`kitchen_auto_print`)
- Listens to order status changes via existing `useKitchenOrders` hook
- Detects transition to `in_preparation` status
- Automatically triggers print if enabled
- Persists toggle state across sessions

### 5. AutoPrintToggle Component

**Purpose**: UI control for enabling/disabling auto-print mode in Kitchen view

**Props**:
```typescript
interface AutoPrintToggleProps {
  enabled: boolean;
  onToggle: () => void;
}
```

**UI Design**:
- Toggle switch with label "Estação de Impressão Automática"
- Icon: Printer icon
- Position: Kitchen page header, next to title
- Visual feedback when enabled (highlighted state)

### 6. PrintButton Component

**Purpose**: Reusable button component for manual printing

**Props**:
```typescript
interface PrintButtonProps {
  orderId?: string;
  reportData?: ReportData;
  variant?: 'order' | 'report';
  size?: 'sm' | 'md' | 'lg';
}
```

## Data Models

### Order Print Data

```typescript
interface OrderPrintData {
  order: {
    id: string;
    order_number: number;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    order_notes?: string;
    created_at: string;
    waiter_id?: string;
  };
  items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    price: number;
  }>;
  waiterName?: string;
}
```

### Report Print Data

```typescript
interface ReportPrintData {
  dateRange: {
    from: Date;
    to: Date;
  };
  stats: {
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  waiterName?: string;
  generatedAt: Date;
}
```

## CSS Strategy

### Print Media Queries

```css
@media print {
  /* Thermal Receipt (80mm) */
  @page {
    size: 80mm auto;
    margin: 0;
  }
  
  /* Standard Report (A4) */
  @page.report {
    size: A4 portrait;
    margin: 15mm;
  }
  
  /* Hide non-printable elements */
  body > *:not(.print-content) {
    display: none !important;
  }
  
  /* Show only print content */
  .print-content {
    display: block !important;
    width: 100%;
  }
  
  /* Remove shadows, gradients */
  * {
    box-shadow: none !important;
    background-image: none !important;
  }
  
  /* Ensure black text */
  body {
    color: #000 !important;
    background: #fff !important;
  }
}
```

### Component-Specific Styles

**OrderReceipt.module.css**:
```css
.receipt {
  width: 80mm;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 8px;
}

.header {
  text-align: center;
  border-bottom: 2px dashed #000;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.items {
  border-bottom: 1px solid #000;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.total {
  font-size: 16px;
  font-weight: bold;
  text-align: right;
  padding-top: 8px;
}
```

## Integration Points

### Kitchen Page Integration

**Location**: `src/pages/staff/Kitchen.tsx`

**Changes**:
1. Add AutoPrintToggle component to header
2. Integrate useAutoPrint hook
3. Connect to existing `useKitchenOrders` realtime subscription
4. Trigger print on status change to `in_preparation`

**Code Flow**:
```typescript
// In Kitchen.tsx
const { isAutoPrintEnabled, toggleAutoPrint } = useAutoPrint({
  enabled: true,
  onPrint: (orderId) => {
    console.log('Auto-printing order:', orderId);
  }
});

// Listen to status changes
const handleOrderStatusChange = useCallback((order: Order) => {
  // Existing logic...
  
  // Auto-print if enabled and status is in_preparation
  if (isAutoPrintEnabled && order.status === 'in_preparation') {
    printOrder(order.id);
  }
}, [isAutoPrintEnabled]);
```

### Admin Order Views Integration

**Locations**: 
- `src/components/OrderCardInfo.tsx`
- `src/components/CompactOrderCard.tsx`

**Changes**:
1. Add PrintButton component to order cards
2. Use usePrintOrder hook
3. Display print icon/button in card actions

### Reports Page Integration

**Location**: `src/pages/admin/Reports.tsx`

**Changes**:
1. Add "Print Report" button next to "Export CSV"
2. Use usePrintReport hook
3. Render ReportPrintView component (hidden)
4. Trigger print dialog on button click

## Error Handling

### Print Failures

**Scenarios**:
- User cancels print dialog
- Printer not available
- Browser blocks print

**Handling**:
- Silent failure for auto-print (log to console)
- Toast notification for manual print failures
- Retry option for manual prints

### Data Loading Errors

**Scenarios**:
- Order not found
- Items not loaded
- Network error

**Handling**:
- Show error toast
- Disable print button
- Log error details

## Testing Strategy

### Manual Testing

1. **Auto-Print Flow**:
   - Enable auto-print toggle in Kitchen
   - Create/accept an order
   - Verify print dialog appears automatically
   - Verify receipt format on thermal printer

2. **Manual Print Flow**:
   - Navigate to order list
   - Click print button on order card
   - Verify print dialog appears
   - Verify receipt format

3. **Report Print Flow**:
   - Navigate to Reports page
   - Select date range
   - Click "Print Report"
   - Verify report format on standard printer

4. **Browser Compatibility**:
   - Test on Chrome, Firefox, Safari
   - Test with different printer types
   - Test print preview

### Edge Cases

- Empty order items
- Very long order notes
- Special characters in names
- Multiple rapid prints
- Auto-print with multiple devices
- Offline printing

## Browser Configuration Guide

### Chrome Kiosk Mode (Recommended for Auto-Print)

**Purpose**: Bypass print dialog for automatic printing

**Setup**:
```bash
# Launch Chrome with kiosk printing
chrome --kiosk-printing --app=https://your-app-url.com
```

**Settings**:
1. Set default printer to thermal printer
2. Disable "Print headers and footers"
3. Set margins to "None"
4. Enable "Background graphics"

### Standard Browser Setup

**Chrome/Edge**:
1. Settings → Printers → Add printer
2. Set thermal printer as default for kitchen station
3. Print settings: Margins = None, Headers/Footers = Off

**Firefox**:
1. about:config → print.always_print_silent = true (optional)
2. Set default printer in system settings

**Safari**:
1. System Preferences → Printers & Scanners
2. Set default printer
3. Print settings: Scale = 100%, Margins = Minimum

## Performance Considerations

### Rendering Optimization

- Use React.memo for print components
- Lazy load print components
- Render print content only when needed
- Clean up print content after printing

### Network Optimization

- Cache order data for reprints
- Prefetch order items with order data
- Use existing realtime subscriptions
- Avoid redundant API calls

## Future Enhancements

1. **Print Queue**: Queue multiple prints for batch processing
2. **Print History**: Track printed orders and reprints
3. **Custom Templates**: Allow customization of receipt layout
4. **Network Printing**: Support for network/cloud printers
5. **Print Preview**: Show preview before printing
6. **Multi-Language**: Support for different languages on receipts
