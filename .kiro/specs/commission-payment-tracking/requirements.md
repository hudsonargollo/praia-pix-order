# Requirements Document

## Introduction

This feature improves the waiter commission tracking system to accurately reflect only confirmed payments while providing visibility into potential future earnings from pending orders. Currently, the system counts commissions for orders that haven't been paid yet, which creates inaccurate financial reporting. The improved system will distinguish between confirmed commissions (from paid orders) and estimated commissions (from pending orders awaiting payment).

## Glossary

- **Commission System**: The component that calculates and displays waiter earnings based on order values
- **Confirmed Commission**: Commission earned from orders with verified payment status
- **Estimated Commission**: Potential commission from orders awaiting payment confirmation
- **Payment Status**: The verification state of an order's payment (paid, pending, cancelled, etc.)
- **Waiter Dashboard**: The interface where waiters view their sales performance and earnings
- **Admin Reports**: The management interface for viewing waiter performance metrics

## Requirements

### Requirement 1

**User Story:** As a waiter, I want to see only confirmed commissions from paid orders in my total earnings, so that I have an accurate view of my actual income

#### Acceptance Criteria

1. WHEN THE Commission System calculates total commissions, THE Commission System SHALL include only orders with status "paid" or "completed"
2. WHEN an order has status "pending", "pending_payment", "in_preparation", or "ready", THE Commission System SHALL exclude the order from confirmed commission totals
3. WHEN an order has status "cancelled" or "expired", THE Commission System SHALL exclude the order from all commission calculations
4. THE Commission System SHALL display confirmed commissions with a clear label indicating they are from paid orders
5. THE Commission System SHALL calculate commission as 10% of the order total amount for all included orders

### Requirement 2

**User Story:** As a waiter, I want to see estimated potential commissions from pending orders, so that I can understand my future earnings if payments are completed

#### Acceptance Criteria

1. WHEN THE Commission System displays commission information, THE Commission System SHALL show a separate "Estimated Commissions" metric
2. WHEN calculating estimated commissions, THE Commission System SHALL include orders with status "pending", "pending_payment", "in_preparation", or "ready"
3. THE Commission System SHALL display estimated commissions with visual distinction from confirmed commissions (different color or styling)
4. THE Commission System SHALL include a tooltip or description explaining that estimated commissions are pending payment confirmation
5. WHEN an order transitions from pending to paid status, THE Commission System SHALL move the commission from estimated to confirmed totals

### Requirement 3

**User Story:** As a waiter, I want to see commission status for each order in my order history, so that I can track which orders have contributed to my earnings

#### Acceptance Criteria

1. WHEN THE Waiter Dashboard displays the order history table, THE Waiter Dashboard SHALL show commission amount for each order
2. WHEN an order has status "paid" or "completed", THE Waiter Dashboard SHALL display the commission in green color with full opacity
3. WHEN an order has status "pending", "pending_payment", "in_preparation", or "ready", THE Waiter Dashboard SHALL display the commission in yellow/orange color with a "pending" indicator
4. WHEN an order has status "cancelled" or "expired", THE Waiter Dashboard SHALL display "R$ 0,00" with strikethrough styling
5. THE Waiter Dashboard SHALL include a visual indicator (icon or badge) next to pending commissions

### Requirement 4

**User Story:** As a manager, I want to see accurate commission reports that separate confirmed and estimated earnings, so that I can properly manage payroll and financial planning

#### Acceptance Criteria

1. WHEN THE Admin Reports displays waiter performance metrics, THE Admin Reports SHALL show both confirmed and estimated commission totals
2. THE Admin Reports SHALL calculate confirmed commissions using only orders with status "paid" or "completed"
3. THE Admin Reports SHALL calculate estimated commissions using orders with status "pending", "pending_payment", "in_preparation", or "ready"
4. THE Admin Reports SHALL display a breakdown showing the number of paid orders versus pending orders
5. WHEN exporting waiter reports, THE Admin Reports SHALL include separate columns for confirmed commissions and estimated commissions

### Requirement 5

**User Story:** As a system administrator, I want the commission calculations to be consistent across all interfaces, so that financial data is reliable and trustworthy

#### Acceptance Criteria

1. THE Commission System SHALL use identical logic for commission calculations in both Waiter Dashboard and Admin Reports
2. THE Commission System SHALL define payment status categories in a centralized configuration
3. WHEN an order status changes, THE Commission System SHALL immediately reflect the change in commission calculations
4. THE Commission System SHALL log commission calculation changes for audit purposes
5. THE Commission System SHALL validate that commission amounts match 10% of order totals with precision to two decimal places

### Requirement 6

**User Story:** As a waiter using a mobile device, I want a simplified commission view with better mobile layout, so that I can quickly check my earnings on the go

#### Acceptance Criteria

1. WHEN THE Waiter Dashboard displays on mobile devices, THE Waiter Dashboard SHALL remove the "Performance" card to reduce clutter
2. WHEN THE Waiter Dashboard displays commission cards, THE Waiter Dashboard SHALL replace "Comissões Confirmadas" and "Comissões Estimadas" with a toggle switch interface
3. THE Waiter Dashboard SHALL provide a toggle between "Comissões Recebidas" (received) and "A Receber" (to receive) views
4. THE Waiter Dashboard SHALL display an overall total that combines both received and to-receive commissions
5. WHEN THE Waiter Dashboard displays the order history table on mobile, THE Waiter Dashboard SHALL use a responsive card layout instead of table rows
6. THE Waiter Dashboard SHALL show essential order information (order number, customer, amount, commission) in a compact mobile-friendly format
7. THE Waiter Dashboard SHALL allow horizontal scrolling or collapsible sections for additional order details on mobile


### Requirement 7

**User Story:** As a waiter, I want to click on an order in my dashboard to view and edit order details, so that I can make corrections or add items before the order is completed

#### Acceptance Criteria

1. WHEN a waiter clicks on an order row in the order history table, THE Waiter Dashboard SHALL open an order details modal or navigate to an order edit page
2. THE Order Edit Interface SHALL display all order items with quantities and prices
3. THE Order Edit Interface SHALL allow adding new items to the order
4. THE Order Edit Interface SHALL allow removing items from the order
5. THE Order Edit Interface SHALL allow modifying item quantities
6. WHEN an order has status "paid" or "completed", THE Order Edit Interface SHALL prevent editing and show a read-only view
7. WHEN an order has status "cancelled", THE Order Edit Interface SHALL prevent editing
8. THE Order Edit Interface SHALL recalculate the order total and commission amount when items are modified
9. THE Order Edit Interface SHALL save changes to the database when the waiter confirms
10. WHEN order items are modified, THE Waiter Dashboard SHALL update the commission display to reflect the new order total


### Requirement 8

**User Story:** As an admin viewing the orders page (Cashier), I want to filter orders by waiter, so that I can see which orders belong to each waiter

#### Acceptance Criteria

1. WHEN THE Cashier page loads, THE Cashier page SHALL display all orders from all waiters by default
2. THE Cashier page SHALL provide a waiter filter dropdown in the header
3. WHEN a waiter is selected from the filter, THE Cashier page SHALL display only orders created by that waiter
4. THE Cashier page SHALL show the waiter's name on each order card/row
5. THE waiter filter SHALL include an "All Waiters" option to show all orders
6. WHEN filtering by waiter, THE Cashier page SHALL update the order counts in the summary cards
7. THE Cashier page SHALL persist the selected waiter filter when navigating between tabs
8. THE Cashier page SHALL display "No orders" message when selected waiter has no orders
9. THE Cashier page SHALL show waiter information in order details dialog
10. THE waiter filter SHALL be visible and accessible on both mobile and desktop views
