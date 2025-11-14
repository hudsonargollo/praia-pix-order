# Implementation Plan

- [x] 1. Create commission calculation utilities
  - Create `src/lib/commissionUtils.ts` with centralized commission logic
  - Define ORDER_STATUS_CATEGORIES constant with PAID, PENDING, and EXCLUDED arrays
  - Implement calculateConfirmedCommissions() function for paid orders
  - Implement calculateEstimatedCommissions() function for pending orders
  - Implement getCommissionStatus() function returning display configuration
  - Implement getOrdersByCategory() helper function
  - Define COMMISSION_RATE constant (0.1 for 10%)
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.5_

- [x] 1.1 Write unit tests for commission utilities
  - Test calculateConfirmedCommissions with various order statuses
  - Test calculateEstimatedCommissions with pending orders
  - Test getCommissionStatus for all status categories
  - Test edge cases (empty arrays, zero amounts, unknown statuses)
  - Verify precision to 2 decimal places
  - _Requirements: 1.1, 1.2, 5.5_

- [x] 2. Create reusable commission display components
  - Create `src/components/CommissionDisplay.tsx` for individual commission display
  - Add props for amount, status, showIcon, and size
  - Implement icon rendering based on commission status
  - Add tooltip support for commission status explanation
  - Apply appropriate styling classes based on status (green/yellow/gray)
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 3. Create commission cards component
  - Create `src/components/CommissionCards.tsx` for dual card display
  - Implement confirmed commissions card with green theme
  - Implement estimated commissions card with yellow theme
  - Display order counts for each category
  - Add descriptive text explaining each commission type
  - Use CheckCircle icon for confirmed, Clock icon for estimated
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Update WaiterDashboard commission display
- [x] 4.1 Replace single commission card with CommissionCards component
  - Import CommissionCards and commission utilities
  - Remove existing single commission card code
  - Add CommissionCards component to stats section
  - Pass orders array to CommissionCards
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3_

- [x] 4.2 Update order table commission column
  - Import getCommissionStatus from commissionUtils
  - Update commission TableCell to use getCommissionStatus()
  - Add icon indicator next to commission amount
  - Apply status-based className for color coding
  - Add Tooltip component with commission status explanation
  - Update styling for pending orders (yellow) vs paid orders (green)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4.3 Update dashboard statistics calculations
  - Replace totalCommissions calculation with calculateConfirmedCommissions()
  - Add estimatedCommissions calculation using calculateEstimatedCommissions()
  - Update validOrders filter to use ORDER_STATUS_CATEGORIES.PAID
  - Ensure totalSales only includes paid orders
  - _Requirements: 1.1, 1.2, 1.3, 5.1_

- [x] 5. Update AdminWaiterReports commission display
- [x] 5.1 Add commission breakdown to stats cards
  - Import commission utilities
  - Split totalCommission stat into confirmed and estimated
  - Update stats calculation to use calculateConfirmedCommissions()
  - Add estimatedCommission calculation
  - Update stats interface to include both commission types
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5.2 Update admin stats cards UI
  - Replace single commission card with two separate cards
  - Add confirmed commissions card with green styling
  - Add estimated commissions card with yellow styling
  - Display order counts for paid vs pending orders
  - Add explanatory text for each commission type
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5.3 Update admin order table commission column
  - Import getCommissionStatus from commissionUtils
  - Update commission TableCell to use status-based styling
  - Add icon indicator for commission status
  - Apply color coding (green for paid, yellow for pending, gray for cancelled)
  - Add tooltip explaining commission status
  - _Requirements: 4.1, 4.2, 5.1_

- [x] 5.4 Enhance CSV export with commission breakdown
  - Add "Commission Status" column to CSV headers
  - Add "Confirmed Commission" column
  - Add "Estimated Commission" column
  - Update row data to include commission status
  - Separate confirmed and estimated amounts in export
  - _Requirements: 4.5_

- [x] 6. Add TypeScript interfaces and types
  - Create `src/types/commission.ts` for commission-related types
  - Define CommissionDisplayConfig interface
  - Define CommissionStats interface
  - Export Order interface extension if needed
  - Add JSDoc comments for all interfaces
  - _Requirements: 5.1, 5.2_

- [x] 7. Update existing tests to use new commission logic
  - Update WaiterDashboard tests to verify dual commission cards
  - Update AdminWaiterReports tests for new calculation logic
  - Modify test assertions to check confirmed vs estimated commissions
  - Update mock data to include various order statuses
  - Verify commission status indicators render correctly
  - _Requirements: 5.1, 5.4_

- [x] 8. Add real-time commission updates
  - Ensure fetchWaiterData() in WaiterDashboard refreshes on order status changes
  - Verify loadWaiterData() in AdminWaiterReports recalculates on data refresh
  - Test commission transition from estimated to confirmed when payment completes
  - Verify UI updates immediately when order status changes
  - _Requirements: 2.5, 5.3, 5.4_

- [x] 9. Verify cross-component consistency
  - Compare commission calculations between WaiterDashboard and AdminWaiterReports
  - Verify identical styling and visual indicators in both interfaces
  - Test that status changes propagate correctly to both views
  - Ensure ORDER_STATUS_CATEGORIES is used consistently
  - Validate commission amounts match across all displays
  - _Requirements: 5.1, 5.2, 5.3_

## Phase 2: UX Improvements (Mobile & Desktop)

- [x] 10. Remove Performance card from WaiterDashboard
  - Remove the "Performance" stats card showing average order value
  - Adjust grid layout to accommodate remaining cards
  - Verify responsive layout works correctly without Performance card
  - _Requirements: 6.1_

- [x] 11. Redesign commission cards with toggle interface
  - Replace separate "Comissões Confirmadas" and "Comissões Estimadas" cards
  - Create toggle switch component for "Comissões Recebidas" / "A Receber"
  - Implement state management for toggle selection
  - Display selected commission type prominently
  - Show overall total combining both commission types
  - Add smooth transition animation when toggling
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 12. Implement mobile-responsive order table
  - Create card-based layout for mobile devices (< 768px)
  - Display order number, customer name, and amount in card header
  - Show commission status with icon and amount in card body
  - Add order date and status badge to card footer
  - Implement collapsible sections for additional order details
  - Ensure touch-friendly tap targets (min 44px)
  - _Requirements: 6.5, 6.6, 6.7_

- [x] 13. Add responsive breakpoints and media queries
  - Define breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
  - Apply mobile card layout for order table on small screens
  - Stack commission cards vertically on mobile
  - Adjust font sizes and spacing for mobile readability
  - Test on various device sizes (iPhone, iPad, desktop)
  - _Requirements: 6.5, 6.6, 6.7_

- [x] 14. Test mobile UX improvements
  - Test toggle switch functionality on touch devices
  - Verify card layout renders correctly on mobile browsers
  - Test horizontal scrolling if implemented
  - Verify all interactive elements are touch-friendly
  - Test on iOS Safari and Android Chrome
  - _Requirements: 6.2, 6.3, 6.5, 6.6, 6.7_


## Phase 3: Order Editing Functionality

- [x] 15. Create order edit modal/page component
  - Create OrderEditModal or OrderEditPage component
  - Design modal/page layout with order details section
  - Add header showing order number, customer, and current status
  - Include close/cancel button
  - Add save/confirm button
  - _Requirements: 7.1_

- [x] 16. Implement order items display and editing
  - Display list of current order items with quantities and prices
  - Add "Add Item" button to include new items
  - Add remove button for each item
  - Add quantity increment/decrement controls
  - Show item subtotals
  - Display running order total
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 17. Add order status validation for editing
  - Check order status before allowing edits
  - Disable all editing controls for "paid" or "completed" orders
  - Disable all editing controls for "cancelled" orders
  - Show read-only view with message for non-editable orders
  - Display appropriate message explaining why order cannot be edited
  - _Requirements: 7.6, 7.7_

- [x] 18. Implement real-time total and commission calculation
  - Recalculate order total when items change
  - Recalculate commission (10%) based on new total
  - Display updated total prominently
  - Show updated commission amount
  - Highlight changes with visual feedback
  - _Requirements: 7.8, 7.10_

- [x] 19. Add order update functionality
  - Implement save handler to update order in database
  - Update order_items table with modified items
  - Update orders table with new total_amount
  - Update commission_amount in orders table
  - Show loading state during save
  - Show success/error toast notifications
  - _Requirements: 7.9_

- [x] 20. Connect order table rows to edit modal
  - Add onClick handler to order table rows
  - Pass order data to edit modal/page
  - Open modal when row is clicked
  - Ensure mobile-friendly tap targets
  - Add visual feedback on row hover/press
  - _Requirements: 7.1_

- [x] 21. Update WaiterDashboard to refresh after edits
  - Refresh order list after successful save
  - Update commission cards with new totals
  - Recalculate confirmed/estimated commissions
  - Show updated commission status in table
  - Ensure real-time updates work correctly
  - _Requirements: 7.10_

- [x] 22. Test order editing functionality
  - Test adding items to order
  - Test removing items from order
  - Test modifying quantities
  - Test editing prevention for paid orders
  - Test editing prevention for cancelled orders
  - Test commission recalculation
  - Test mobile interaction
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_


## Phase 4: Waiter Filtering in Admin Orders

- [x] 23. Add waiter filter dropdown to Cashier page header
  - Fetch list of all waiters from database
  - Create waiter selector dropdown component
  - Add "Todos os Garçons" (All Waiters) option
  - Position filter in header next to other action buttons
  - Make filter responsive for mobile
  - _Requirements: 8.2, 8.5, 8.10_

- [x] 24. Implement waiter filtering logic
  - Add selectedWaiterId state to Cashier component
  - Modify loadOrders to filter by waiter_id when selected
  - Update real-time subscriptions to filter by waiter
  - Ensure "All Waiters" option shows all orders
  - _Requirements: 8.1, 8.3_

- [x] 25. Display waiter information on orders
  - Add waiter name to order cards/rows
  - Fetch waiter details when loading orders
  - Show waiter badge or label on each order
  - Include waiter info in order details dialog
  - _Requirements: 8.4, 8.9_

- [x] 26. Update summary cards with filtered counts
  - Recalculate pending orders count based on filter
  - Recalculate in-progress orders count based on filter
  - Recalculate ready orders count based on filter
  - Recalculate completed orders count based on filter
  - Recalculate cancelled orders count based on filter
  - _Requirements: 8.6_

- [x] 27. Persist waiter filter selection
  - Maintain filter state when switching tabs
  - Keep filter active during real-time updates
  - Show empty state when waiter has no orders
  - Display appropriate message for empty results
  - _Requirements: 8.7, 8.8_

- [x] 28. Test waiter filtering functionality
  - Test filtering by specific waiter
  - Test "All Waiters" option
  - Test with waiters who have no orders
  - Test real-time updates with filter active
  - Test mobile responsiveness
  - Test filter persistence across tabs
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_
