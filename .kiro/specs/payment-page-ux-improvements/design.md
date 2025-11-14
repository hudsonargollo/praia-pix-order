# Design Document

## Overview

This design comprehensively refactors the Payment page to prioritize PIX copy-paste over QR code scanning, reorganize content hierarchy for optimal mobile usage, and fix navigation issues. The solution inverts the current visual hierarchy by making the PIX code snippet the primary focus and demoting the QR code to a secondary option.

## Architecture

### Component Structure

The Payment page (`src/pages/customer/Payment.tsx`) will be restructured with:
- Updated header with new title and subtitle
- Reordered content sections (Status → PIX Code → QR Code → Order Summary)
- PIX code snippet display with truncation
- Phone number formatting utility
- Fixed back button navigation logic

### Layout Strategy

1. **Header Update**: Change title to "Detalhes do pagamento PIX" with optional subtitle
2. **Content Hierarchy**: PIX code section becomes primary, QR code becomes secondary
3. **Visual Emphasis**: Use larger cards, prominent buttons, and clear labels for PIX code
4. **Space Optimization**: Reduce QR code size and vertical spacing
5. **Navigation Fix**: Implement history.back() with fallback routing

## Components and Interfaces

### Modified Components

#### Payment Page Header
```typescript
// Updated header with new title and subtitle
<header className="bg-gradient-ocean text-white p-4 shadow-medium">
  <div className="flex items-center gap-3">
    <Button variant="ghost" size="icon" onClick={handleBack}>
      <ArrowLeft className="h-5 w-5" />
    </Button>
    <div className="flex-1">
      <h1 className="text-xl font-bold">Detalhes do pagamento PIX</h1>
      <p className="text-sm text-white/90">
        Use o código PIX abaixo para concluir o pagamento
      </p>
    </div>
  </div>
</header>
```

#### Primary PIX Code Section (New)
```typescript
// Primary PIX code section with snippet and copy button
<Card className="p-6 shadow-soft border-2 border-primary/20">
  <h3 className="font-bold text-lg mb-3">Código PIX</h3>
  
  {/* PIX Code Snippet */}
  <div className="bg-gray-50 p-4 rounded-lg mb-2">
    <p className="text-base font-mono text-center text-gray-700 select-all">
      {formatPixSnippet(paymentData.pixCopyPaste)}
    </p>
  </div>
  
  {/* Helper Text */}
  <p className="text-sm text-muted-foreground text-center mb-4">
    Clique em "Copiar Código PIX" para colar no app do seu banco
  </p>
  
  {/* Primary Copy Button */}
  <Button 
    onClick={copyPixCode} 
    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-lg"
    size="lg"
  >
    <Copy className="w-5 h-5 mr-2" />
    Copiar Código PIX
  </Button>
</Card>
```

#### Secondary QR Code Section (Modified)
```typescript
// Demoted QR code section with smaller size
<Card className="p-4 shadow-soft">
  <h3 className="font-semibold text-base mb-2">Pagar com QR Code (opcional)</h3>
  <p className="text-sm text-muted-foreground mb-3">
    Se preferir, aponte a câmera do app do seu banco para o QR Code
  </p>
  
  {/* Smaller QR Code */}
  <div className="flex justify-center">
    <img
      src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
      alt="QR Code para pagamento PIX"
      className="w-48 h-48 border rounded-lg"
      width="192"
      height="192"
    />
  </div>
</Card>
```

#### Order Summary with Formatted Phone
```typescript
// Order summary with formatted phone number
<Card className="p-4 shadow-soft">
  <h3 className="font-bold text-lg mb-4">Resumo do Pedido</h3>
  <div className="space-y-2">
    <div className="flex justify-between">
      <span>Cliente:</span>
      <span className="font-semibold">{order.customer_name}</span>
    </div>
    <div className="flex justify-between">
      <span>Telefone:</span>
      <span className="font-semibold">{formatPhoneNumber(order.customer_phone)}</span>
    </div>
    <div className="flex justify-between text-lg font-bold border-t pt-2">
      <span>Total:</span>
      <span className="text-primary">R$ {order.total_amount.toFixed(2)}</span>
    </div>
  </div>
</Card>
```

### Utility Functions

#### PIX Code Snippet Formatter
```typescript
const formatPixSnippet = (pixCode: string): string => {
  if (!pixCode || pixCode.length < 16) return pixCode;
  const first10 = pixCode.substring(0, 10);
  const last6 = pixCode.substring(pixCode.length - 6);
  return `${first10}...${last6}`;
};
```

#### Phone Number Formatter
```typescript
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Extract last 11 digits (DDD + 9 digits)
  const last11 = digits.slice(-11);
  
  if (last11.length !== 11) return phone; // Return original if invalid
  
  // Format as (DDD) 00000-0000
  const ddd = last11.substring(0, 2);
  const firstPart = last11.substring(2, 7);
  const secondPart = last11.substring(7, 11);
  
  return `(${ddd}) ${firstPart}-${secondPart}`;
};
```

#### Back Button Handler
```typescript
const handleBack = () => {
  // First attempt: use browser history
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // Fallback: navigate to menu or home
    navigate('/menu');
  }
};
```

### State Management

No new state required. All modifications use existing state and add utility functions.

### Props and Interfaces

No interface changes needed. All modifications are layout, styling, and utility function additions.

## Data Models

No data model changes required. This is a pure UI/UX enhancement.

## Error Handling

### Clipboard API Failures

- Maintain existing try-catch in `copyPixCode` function
- Display error toast if clipboard write fails
- Change success message to "Copiado!" for brevity

### Phone Number Formatting

- Handle invalid phone numbers gracefully by returning original value
- Support various input formats (+55, 55, or just digits)
- Ensure formatting doesn't break on edge cases

### Navigation Failures

- Use history.back() as primary method
- Fallback to /menu route if history is empty
- Never navigate to broken checkout-... routes

## Testing Strategy

### Visual Regression Testing

1. Verify new header title and subtitle display correctly
2. Confirm PIX code section is visually prominent (larger, higher on page)
3. Verify QR code is smaller and visually de-emphasized
4. Check phone number formatting in order summary
5. Test layout on various mobile viewports

### Functional Testing

1. Test PIX code snippet displays correctly (first 10 + last 6 chars)
2. Verify copy button copies full PIX code (not snippet)
3. Test "Copiado!" toast appears after successful copy
4. Verify phone number formatting works for various input formats
5. Test back button uses history.back() when available
6. Test back button fallback to /menu when history is empty
7. Ensure no navigation to broken checkout-... routes

### Responsive Testing

Target devices:
- iPhone SE (375x667)
- iPhone 12/13 (390x844)
- Samsung Galaxy S21 (360x800)
- Small tablets (768x1024)

### Accessibility Testing

1. Verify all buttons have sufficient color contrast (WCAG AA)
2. Test with screen reader (labels clear and descriptive)
3. Ensure touch targets meet 44x44px minimum
4. Test keyboard navigation (tab order logical)
5. Verify PIX snippet is selectable for manual copy

## Implementation Details

### Content Reordering

New section order (top to bottom):
1. Header (updated title/subtitle)
2. Status do pagamento (existing, unchanged)
3. Primary PIX Code Section (new, prominent)
4. Secondary QR Code Section (existing, demoted)
5. Resumo do Pedido (existing, with phone formatting)

### Visual Hierarchy Changes

#### Primary PIX Code Section
- Use `border-2 border-primary/20` for emphasis
- Larger padding: `p-6` instead of `p-4`
- Prominent button: `py-6 text-lg`
- Clear labels and helper text

#### Secondary QR Code Section
- Smaller QR code: `w-48 h-48` instead of `w-64 h-64`
- Less padding: `p-4` instead of `p-6`
- Smaller title: `text-base` instead of `text-lg`
- Label as "opcional" to indicate secondary nature

#### Removed Section
- Remove the old "Ou copie o código Pix" card that showed full PIX code
- This functionality is now in the primary PIX code section

### Spacing Optimization

- Maintain `space-y-6` between major sections
- Use `space-y-4` within cards
- Reduce QR code size to save vertical space
- Ensure mobile-first stacked layout

### Performance Considerations

- Utility functions are pure and fast (no async operations)
- No additional API calls required
- No new dependencies needed
- Minimal re-render impact (layout changes only)
- Clipboard API remains synchronous and fast
