# Design Document

## Overview

This design optimizes the Payment page for mobile-first usage by reducing header height and adding a prominent "Copy PIX Code" button within the initial viewport. The solution focuses on vertical space efficiency while maintaining usability and visual hierarchy.

## Architecture

### Component Structure

The Payment page (`src/pages/customer/Payment.tsx`) will be modified with:
- Compact header layout with reduced padding
- Repositioned copy button for immediate visibility
- Responsive spacing adjustments based on viewport height

### Layout Strategy

1. **Header Optimization**: Reduce vertical padding from 24px (p-6) to 12px (p-3), combine order info into single line
2. **Button Placement**: Add floating or prominent copy button immediately after QR code
3. **Responsive Behavior**: Use CSS media queries to adjust spacing on small viewports (< 700px height)

## Components and Interfaces

### Modified Components

#### Payment Page Header
```typescript
// Compact header structure
<div className="bg-gradient-ocean text-white p-3 shadow-medium">
  <div className="flex items-center justify-between">
    <Button variant="ghost" size="icon" onClick={handleBack}>
      <ArrowLeft className="h-5 w-5" />
    </Button>
    <div className="flex-1 ml-3">
      <h1 className="text-xl font-bold">Pagamento</h1>
      <p className="text-sm text-white/90">
        Pedido #{order.order_number} - {order.customer_phone}
      </p>
    </div>
  </div>
</div>
```

#### Prominent Copy Button Component
```typescript
// New prominent copy button after QR code
<Button 
  onClick={copyPixCode} 
  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-lg"
  size="lg"
>
  <Copy className="w-5 h-5 mr-2" />
  Copiar Código Pix
</Button>
```

### State Management

No new state required. Existing `copyPixCode` function will be reused.

### Props and Interfaces

No interface changes needed. All modifications are layout and styling adjustments.

## Data Models

No data model changes required. This is a pure UI/UX enhancement.

## Error Handling

### Clipboard API Failures

- Maintain existing try-catch in `copyPixCode` function
- Display error toast if clipboard write fails
- Fallback: Show manual copy instruction if clipboard API unavailable

### Layout Constraints

- Ensure minimum touch target size (44x44px) maintained
- Prevent text truncation with ellipsis for long phone numbers
- Test on various viewport sizes (320px to 768px width)

## Testing Strategy

### Visual Regression Testing

1. Compare header height before/after on mobile viewports
2. Verify button visibility without scrolling on 667px height (iPhone SE)
3. Check layout on 844px height (iPhone 12/13)

### Functional Testing

1. Test copy button functionality on iOS Safari and Chrome Android
2. Verify toast notification appears after copy
3. Test back button navigation still works
4. Ensure button disabled/hidden when payment not pending

### Responsive Testing

Target devices:
- iPhone SE (375x667)
- iPhone 12/13 (390x844)
- Samsung Galaxy S21 (360x800)
- Small tablets (768x1024)

### Accessibility Testing

1. Verify button has sufficient color contrast (WCAG AA)
2. Test with screen reader (button label clear)
3. Ensure touch targets meet 44x44px minimum
4. Test keyboard navigation (tab order logical)


## Implementation Details

### CSS Changes

#### Compact Header Styles
- Change padding from `p-6` to `p-3` (24px → 12px)
- Change title from `text-2xl` to `text-xl` (24px → 20px)
- Change subtitle from `text-base` to `text-sm` (16px → 14px)
- Use flexbox for horizontal layout of back button and text

#### Responsive Spacing
```css
/* Add to index.css or component styles */
@media (max-height: 700px) {
  .payment-container {
    padding: 0.75rem; /* Reduce from 1rem */
  }
  
  .payment-card {
    margin-bottom: 0.75rem; /* Reduce from 1.5rem */
  }
}
```

#### Button Styling
- Use `py-6` for larger touch target (48px height)
- Use `text-lg` for better readability
- Maintain full width `w-full`
- Use primary color with hover state

### Component Modifications

#### Header Section
1. Replace vertical layout with horizontal flex layout
2. Move back button inline with title
3. Combine order number and phone in single line
4. Reduce all padding values

#### QR Code Section
1. Keep existing QR code card
2. Add prominent copy button immediately after QR image
3. Move detailed PIX code display below (existing card)

#### Button Placement Strategy
- **Option A**: Add button inside QR code card, below image
- **Option B**: Add button as separate element between QR card and PIX code card
- **Recommended**: Option A for better visual grouping

### Viewport Optimization

Target viewport heights:
- **< 600px**: Ultra-compact mode (reduce all spacing by 50%)
- **600-700px**: Compact mode (reduce spacing by 25%)
- **> 700px**: Standard mode (current spacing)

### Performance Considerations

- No additional API calls required
- No new dependencies needed
- Minimal re-render impact (layout changes only)
- Clipboard API is synchronous and fast
