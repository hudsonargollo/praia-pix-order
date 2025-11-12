# Mobile UX Fixes - Quick Reference

## Issues Found

### 1. Duplicate Phone Numbers
**Location**: Cashier page, all tabs
**Issue**: Phone shows twice:
```
Hudson Argollo • +555599714541
+555599714541  ← Duplicate
```

**Fix**: Remove the duplicate line (line 442, 587, 676 in Cashier.tsx)

### 2. Mobile Layout Issues
- Cards too wide on mobile
- Buttons too small for touch
- Text too small
- Poor spacing

## Quick Fixes

### Remove Duplicate Phone (Cashier.tsx)
Find and remove these lines (appears 3 times):
```typescript
<p className="text-xs text-muted-foreground">{order.customer_phone}</p>
```

Keep only:
```typescript
<p className="text-sm text-muted-foreground">
  {order.customer_name} • {order.customer_phone}
</p>
```

### Improve Mobile Layout
Add responsive classes:
```typescript
// Card container
<Card className="p-4 sm:p-6 shadow-soft">

// Buttons
<Button className="w-full min-h-[44px] text-base">

// Text
<h3 className="font-bold text-lg sm:text-xl">
<p className="text-sm sm:text-base">

// Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Touch-Friendly Buttons
```typescript
// Minimum 44px height for touch targets
className="min-h-[44px] px-4 py-3 text-base"
```

### Better Spacing
```typescript
// Card spacing
className="space-y-4 sm:space-y-6"

// Section spacing
className="mb-4 sm:mb-6"
```

## Implementation

Due to token limits, I recommend:

1. **Quick Fix**: Remove duplicate phone lines manually
2. **Full Fix**: I can create an improved Cashier.tsx with all mobile optimizations

Would you like me to create the full improved version?
