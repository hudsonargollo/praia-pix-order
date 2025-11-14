# Implementation Plan

- [x] 1. Create utility functions for formatting
  - Create `src/lib/phoneUtils.ts` with phone formatting function
  - Create `src/lib/orderUtils.ts` with order number formatting function
  - Implement formatPhoneNumber to handle (XX) 00000-0000 format
  - Implement formatOrderNumber to use order_number or fallback to UUID
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.1 Write unit tests for utility functions
  - Test phone formatting with valid/invalid inputs
  - Test order number formatting with various scenarios
  - Test edge cases (null, undefined, malformed data)
  - _Requirements: 7.1, 7.2, 6.1, 6.2_

- [x] 2. Update WaiterDashboard layout for desktop
  - Modify `src/pages/waiter/WaiterDashboard.tsx` header section
  - Improve header text and styling to match other sections
  - Add waiter name and context information to header
  - Implement side-by-side layout for "Place Order" and "Total Sales" cards on desktop (lg breakpoint)
  - Ensure responsive stacking on mobile
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Enhance commission display section
  - Update CommissionToggle component title from "Comissões" to "Suas Comissões do Período"
  - Add date range indicator to commission section
  - Improve visual hierarchy with icons and better typography
  - Add breakdown display for confirmed vs estimated commissions
  - Enhance card styling with gradients and better spacing
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Improve mobile popup components
  - Update `src/components/OrderEditModal.tsx` for better mobile responsiveness
  - Ensure modal fits viewport without horizontal scrolling on mobile
  - Implement minimum 44px touch targets for all interactive elements
  - Add proper scrollable content area when exceeding viewport height
  - Position action buttons accessibly on mobile (sticky footer)
  - Use appropriate font sizes and spacing for mobile readability
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Implement phone number formatting across application
  - Update WaiterDashboard to use formatPhoneNumber utility
  - Update OrderEditModal to display formatted phone numbers
  - Update MobileOrderCard to show formatted phone numbers
  - Update all order list views to use consistent phone formatting
  - Ensure formatting is applied in order details and reports
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. Implement order number display updates
  - Update WaiterDashboard order table to show formatted order numbers
  - Update OrderEditModal header to display order number instead of UUID
  - Update MobileOrderCard to show order number
  - Implement formatOrderNumber utility across all order views
  - Add fallback to short UUID for legacy orders without order_number
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Enable waiter editing of unpaid orders
  - Update OrderEditModal editability logic to allow editing of pending/in_preparation orders
  - Implement clear visual indicators for editable vs non-editable orders
  - Add permission checks based on order status
  - Update order list to show which orders can be edited
  - Ensure edit button is disabled/hidden for locked orders
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8. Update database RLS policies for order editing
  - Create migration `supabase/migrations/YYYYMMDDHHMMSS_update_waiter_edit_permissions.sql`
  - Update RLS policy to allow waiters to edit orders with status pending/pending_payment/in_preparation
  - Ensure waiters can only edit their own orders
  - Add audit logging for order modifications
  - Test policy with various order statuses and user roles
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9. Test responsive behavior across devices
  - Test desktop layout with side-by-side cards at various screen sizes
  - Test mobile modal behavior on different mobile devices
  - Verify touch targets meet 44px minimum on mobile
  - Test scroll behavior in modals on mobile
  - Verify all formatting displays correctly on mobile and desktop
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 10. Verify commission display and calculations
  - Test commission display with updated title and styling
  - Verify confirmed vs estimated commission breakdown
  - Test commission recalculation when orders are edited
  - Verify real-time updates to commission display
  - Test commission display on mobile and desktop
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
