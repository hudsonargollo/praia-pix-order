# Design Document

## Overview

The Waiter Dashboard Improvements feature enhances the usability, layout, and functionality of the waiter interface. This design addresses mobile responsiveness issues, implements sequential order numbering, standardizes phone formatting, improves the commission display, and enables waiters to edit unpaid orders. The design builds upon the existing React/TypeScript frontend with Supabase backend.

## Architecture

### Frontend Architecture
- **Responsive Layout System**: CSS Grid/Flexbox for desktop side-by-side layout
- **Mobile-Optimized Modals**: Enhanced Dialog components with mobile-first design
- **Phone Formatting Utility**: Centralized formatting function for consistent display
- **Order Number Display**: Client-side formatting of sequential order numbers
- **Enhanced Header Component**: Improved styling and information hierarchy

### Backend Architecture
- **Sequential Order Numbers**: Database-generated sequence using IDENTITY column (already exists)
- **Order Edit Permissions**: RLS policy updates to allow waiter edits on unpaid orders
- **Phone Number Storage**: Store raw digits, format on display

## Components and Interfaces

### 1. Enhanced Waiter Dashboard Layout (`WaiterDashboard.tsx`)

**Purpose**: Improve desktop layout with side-by-side cards and better header

**Key Changes**:
- Desktop grid layout for "Place Order" and "Total Sales" cards
- Enhanced header with better typography and waiter identification
- Improved "Comissões" section title and presentation

**Layout Structure**:
```typescript
// Desktop: 2-column grid for action cards
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card>Place Order Section</Card>
  <Card>Total Sales Section</Card>
</div>
```


### 2. Phone Formatting Utility (`lib/phoneUtils.ts`)

**Purpose**: Centralized phone number formatting for consistent display

**Key Features**:
- Format 11-digit Brazilian phone numbers as (XX) 00000-0000
- Handle edge cases (invalid formats, missing data)
- Reusable across all components

**Interface**:
```typescript
/**
 * Formats a Brazilian phone number to (XX) 00000-0000 format
 * @param phone - Raw phone number (digits only or with formatting)
 * @returns Formatted phone string or original if invalid
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Must be 11 digits (DDD + 9 + 8 digits)
  if (digits.length !== 11) return phone;
  
  // Format as (XX) 00000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
```

### 3. Order Number Display Utility (`lib/orderUtils.ts`)

**Purpose**: Format order numbers consistently across the application

**Key Features**:
- Use existing `order_number` column (IDENTITY sequence)
- Display as "Pedido #123" or just "#123" depending on context
- Fallback to short UUID if order_number is missing (legacy orders)

**Interface**:
```typescript
/**
 * Formats order number for display
 * @param order - Order object with order_number or id
 * @param includeLabel - Whether to include "Pedido" label
 * @returns Formatted order number string
 */
export function formatOrderNumber(
  order: { order_number?: number; id: string }, 
  includeLabel: boolean = true
): string {
  const number = order.order_number || `#${order.id.substring(0, 8)}`;
  return includeLabel ? `Pedido #${number}` : `#${number}`;
}
```


### 4. Enhanced OrderEditModal Component

**Purpose**: Improve mobile usability and allow editing of unpaid orders

**Key Improvements**:
- Mobile-optimized layout with better spacing and touch targets
- Responsive dialog sizing (max-w-2xl on desktop, full-width on mobile)
- Sticky footer with action buttons on mobile
- Better visual feedback for editable vs non-editable states
- Permission check based on order status

**Mobile Optimizations**:
```typescript
// Mobile-specific styles
<DialogContent className="
  max-w-2xl 
  max-h-[90vh] 
  overflow-y-auto 
  p-4 sm:p-6
  w-full sm:w-auto
">
  {/* Scrollable content area */}
  <div className="space-y-3 sm:space-y-4">
    {/* Order items with touch-friendly controls */}
  </div>
  
  {/* Sticky footer on mobile */}
  <DialogFooter className="
    sticky bottom-0 
    bg-white 
    pt-4 
    border-t
    flex-col sm:flex-row 
    gap-2
  ">
    <Button className="w-full sm:w-auto min-h-[44px]">
      Save
    </Button>
  </DialogFooter>
</DialogContent>
```

**Editability Logic**:
```typescript
// Determine if order can be edited
const canEdit = (order: Order): boolean => {
  // Allow editing for pending and in-preparation orders
  const editableStatuses = ['pending', 'pending_payment', 'in_preparation'];
  return editableStatuses.includes(order.status.toLowerCase());
};
```


### 5. Commission Display Component Enhancement

**Purpose**: Improve the "Comissões" section with better title and presentation

**Key Changes**:
- Update title from "Comissões" to "Suas Comissões do Período"
- Add date range indicator
- Improve visual hierarchy with icons and colors
- Show breakdown of confirmed vs estimated commissions

**Component Structure**:
```typescript
<Card className="bg-gradient-to-br from-green-50 to-emerald-50">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <TrendingUp className="w-5 h-5 text-green-600" />
      Suas Comissões do Período
    </CardTitle>
    <p className="text-sm text-gray-600">
      {formatDateRange(startDate, endDate)}
    </p>
  </CardHeader>
  <CardContent>
    {/* Commission breakdown */}
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Confirmadas</span>
        <span className="text-lg font-bold text-green-600">
          {formatCurrency(confirmedCommissions)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Estimadas</span>
        <span className="text-lg font-semibold text-gray-600">
          {formatCurrency(estimatedCommissions)}
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

## Data Models

### Orders Table (Existing)

The orders table already has the necessary structure:
- `order_number`: INTEGER GENERATED ALWAYS AS IDENTITY (sequential numbering)
- `waiter_id`: UUID reference to auth.users
- `status`: TEXT (determines editability)
- `customer_phone`: TEXT (needs formatting on display)
- `total_amount`: DECIMAL
- `commission_amount`: DECIMAL

No schema changes required for this feature.


## Error Handling

### Frontend Error Handling

1. **Phone Formatting Errors**:
   - Gracefully handle invalid phone formats
   - Display original value if formatting fails
   - Log warnings for debugging

2. **Order Edit Permission Errors**:
   - Clear error messages when editing is not allowed
   - Visual indicators for non-editable orders
   - Prevent edit attempts on locked orders

3. **Mobile Layout Issues**:
   - Responsive breakpoints with fallbacks
   - Touch target size validation
   - Scroll behavior handling

### Backend Error Handling

1. **RLS Policy Violations**:
   - Return clear error messages for permission denials
   - Log unauthorized edit attempts
   - Maintain data integrity

2. **Order Update Conflicts**:
   - Handle concurrent edit scenarios
   - Optimistic UI updates with rollback
   - Real-time sync conflict resolution

## Testing Strategy

### Unit Testing

1. **Phone Formatting**:
   - Test valid 11-digit numbers
   - Test invalid formats (too short, too long, non-numeric)
   - Test null/undefined inputs
   - Test already-formatted inputs

2. **Order Number Formatting**:
   - Test with order_number present
   - Test fallback to UUID
   - Test with/without label

3. **Editability Logic**:
   - Test each order status
   - Test permission checks
   - Test edge cases (null status, missing fields)


### Integration Testing

1. **Desktop Layout**:
   - Verify side-by-side card layout on desktop viewports
   - Test responsive breakpoints
   - Verify card alignment and spacing

2. **Mobile Modal Behavior**:
   - Test modal opening/closing on mobile
   - Verify scroll behavior
   - Test touch interactions
   - Verify button accessibility

3. **Order Editing Flow**:
   - Test editing unpaid orders
   - Verify permission checks
   - Test real-time updates
   - Verify commission recalculation

4. **Phone Number Display**:
   - Verify formatting across all views
   - Test in order list, detail, and edit views
   - Verify consistency

### User Acceptance Testing

1. **Waiter Workflow**:
   - Desktop layout usability
   - Mobile modal usability
   - Order editing efficiency
   - Commission visibility

2. **Visual Design**:
   - Header improvements
   - Commission section clarity
   - Mobile popup usability
   - Overall consistency

## Performance Considerations

### Frontend Optimizations

1. **Formatting Functions**:
   - Memoize formatting results for repeated values
   - Avoid re-formatting on every render
   - Use useMemo for expensive calculations

2. **Responsive Layout**:
   - CSS-based responsive design (no JS media queries)
   - Efficient grid/flexbox layouts
   - Minimal re-renders on resize

3. **Modal Performance**:
   - Lazy load modal content
   - Virtualize long order item lists if needed
   - Optimize scroll performance


### Backend Optimizations

1. **Database Queries**:
   - Use existing indexes on order_number and waiter_id
   - Efficient order status filtering
   - Optimized RLS policy evaluation

2. **Real-time Updates**:
   - Efficient Supabase subscription filtering
   - Minimal payload sizes
   - Debounced UI updates

## Security Considerations

### Authorization

1. **Order Edit Permissions**:
   - RLS policies enforce waiter can only edit their own orders
   - Status-based edit restrictions at database level
   - Audit logging for all order modifications

2. **Data Access**:
   - Waiters can only view their own orders
   - Phone numbers visible only to authorized roles
   - Commission data protected by RLS

### Input Validation

1. **Phone Number Formatting**:
   - Client-side validation before display
   - No modification of stored data
   - XSS prevention in display

2. **Order Modifications**:
   - Server-side validation of all changes
   - Prevent negative quantities
   - Validate order totals

## Implementation Notes

### Existing Code Reuse

1. **Order Number Column**: The `order_number` column already exists as an IDENTITY sequence, so we only need to update display logic

2. **Commission Calculation**: The commission trigger already exists, no changes needed

3. **RLS Policies**: Existing waiter policies need minor updates to allow editing unpaid orders

4. **Mobile Responsiveness**: The codebase already uses Tailwind responsive classes, we'll enhance existing patterns


### Key Files to Modify

1. **Frontend Components**:
   - `src/pages/waiter/WaiterDashboard.tsx` - Layout and header improvements
   - `src/components/OrderEditModal.tsx` - Mobile optimizations and edit permissions
   - `src/components/MobileOrderCard.tsx` - Phone formatting and order number display
   - `src/components/CommissionToggle.tsx` - Title and presentation improvements

2. **New Utility Files**:
   - `src/lib/phoneUtils.ts` - Phone formatting utility
   - `src/lib/orderUtils.ts` - Order number formatting utility

3. **Backend**:
   - `supabase/migrations/YYYYMMDDHHMMSS_update_waiter_edit_permissions.sql` - RLS policy updates

### Migration Strategy

1. **Phase 1: Utilities**
   - Create phone and order formatting utilities
   - Add unit tests
   - No user-facing changes yet

2. **Phase 2: Display Updates**
   - Update all components to use new formatting utilities
   - Improve header and commission display
   - Update desktop layout

3. **Phase 3: Mobile Improvements**
   - Enhance OrderEditModal for mobile
   - Improve all popup components
   - Test on various mobile devices

4. **Phase 4: Edit Permissions**
   - Update RLS policies
   - Enable editing for unpaid orders
   - Add audit logging

## Responsive Breakpoints

The design uses Tailwind's default breakpoints:
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktops) - Primary breakpoint for side-by-side layout
- `xl`: 1280px (large desktops)

Key responsive behaviors:
- Mobile (< 1024px): Stacked layout, full-width modals, vertical cards
- Desktop (≥ 1024px): Side-by-side layout, constrained modals, horizontal cards
