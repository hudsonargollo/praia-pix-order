# Requirements Document

## Introduction

The Waiter Dashboard Improvements feature enhances the usability and functionality of the waiter interface with better layout, improved mobile popups, sequential order numbering, standardized phone formatting, and the ability for waiters to add items to unpaid orders.

## Glossary

- **Waiter_Dashboard_System**: The waiter interface that displays sales, commissions, and order management
- **Order_Display_System**: The system that shows order information including order numbers and customer details
- **Order_Edit_System**: The system that allows modification of existing orders
- **Phone_Format_System**: The system that formats and displays phone numbers consistently
- **Commission_Display_System**: The system that shows commission information to waiters
- **Layout_System**: The responsive layout system that adapts to desktop and mobile views
- **Order_Number_Generator**: The system that assigns sequential numeric IDs to orders

## Requirements

### Requirement 1

**User Story:** As a waiter using a desktop device, I want to see the "Place Order" box side by side with the "Total Sales" box, so that I can view both sections simultaneously without scrolling.

#### Acceptance Criteria

1. WHEN a waiter accesses the dashboard on a desktop viewport, THE Layout_System SHALL display the "Place Order" box and "Total Sales" box in a two-column layout
2. WHEN the viewport width is greater than 1024 pixels, THE Layout_System SHALL arrange the boxes horizontally with equal or proportional widths
3. WHEN the viewport width is less than 1024 pixels, THE Layout_System SHALL stack the boxes vertically
4. THE Layout_System SHALL maintain responsive spacing and padding between the boxes
5. THE Layout_System SHALL ensure both boxes are visible without horizontal scrolling on desktop

### Requirement 2

**User Story:** As a waiter, I want to see an improved header with better text similar to other sections, so that the dashboard looks professional and consistent.

#### Acceptance Criteria

1. THE Waiter_Dashboard_System SHALL display a header with clear, descriptive text matching the style of other dashboard sections
2. THE Waiter_Dashboard_System SHALL include the waiter's name or identifier in the header
3. THE Waiter_Dashboard_System SHALL use consistent typography, colors, and spacing with other headers in the application
4. THE Waiter_Dashboard_System SHALL display relevant context information (e.g., current date, shift information) in the header
5. THE Waiter_Dashboard_System SHALL ensure the header is responsive and readable on all device sizes

### Requirement 3

**User Story:** As a waiter, I want to see "Comissões" with a better title and presentation, so that I can quickly understand my commission earnings.

#### Acceptance Criteria

1. THE Commission_Display_System SHALL display a clear, descriptive title for the commission section (e.g., "Suas Comissões" or "Comissões do Período")
2. THE Commission_Display_System SHALL show commission amounts with proper currency formatting
3. THE Commission_Display_System SHALL display the commission calculation period or date range
4. THE Commission_Display_System SHALL use visual hierarchy to emphasize the total commission amount
5. THE Commission_Display_System SHALL provide a breakdown of commissions by order or time period

### Requirement 4

**User Story:** As a waiter using a mobile device, I want improved popups overall, so that I can interact with them easily without layout issues.

#### Acceptance Criteria

1. WHEN a popup is displayed on mobile, THE Order_Display_System SHALL ensure the popup fits within the viewport without requiring horizontal scrolling
2. WHEN a popup is displayed on mobile, THE Order_Display_System SHALL provide adequate touch targets (minimum 44x44 pixels) for all interactive elements
3. THE Order_Display_System SHALL ensure popup content is scrollable when it exceeds viewport height
4. THE Order_Display_System SHALL position action buttons (Save, Cancel) in easily accessible locations on mobile
5. THE Order_Display_System SHALL use appropriate font sizes and spacing for mobile readability

### Requirement 5

**User Story:** As a waiter editing an order on mobile, I want an improved order editing popup, so that I can modify orders efficiently on my phone.

#### Acceptance Criteria

1. WHEN the order edit popup is displayed on mobile, THE Order_Edit_System SHALL optimize the layout for vertical scrolling
2. WHEN displaying order items in the edit popup, THE Order_Edit_System SHALL use a mobile-friendly list layout with clear item separation
3. THE Order_Edit_System SHALL position the "Add Item" button prominently and accessibly on mobile
4. THE Order_Edit_System SHALL display the order total and commission in a fixed or sticky footer on mobile
5. THE Order_Edit_System SHALL ensure all form inputs and controls are easily tappable and usable on mobile devices

### Requirement 6

**User Story:** As a waiter, I want orders to have sequential numeric IDs starting from 1 instead of hash IDs, so that I can easily reference and communicate about orders.

#### Acceptance Criteria

1. THE Order_Number_Generator SHALL assign sequential numeric IDs to new orders starting from 1
2. WHEN a new order is created, THE Order_Number_Generator SHALL increment the order number by 1 from the previous order
3. THE Order_Display_System SHALL display the numeric order ID prominently in all order views (list, detail, edit)
4. THE Order_Number_Generator SHALL ensure order numbers are unique and never reused
5. THE Order_Display_System SHALL format order numbers consistently (e.g., "Pedido #123" or "Order 123") across the application

### Requirement 7

**User Story:** As a user viewing phone numbers, I want them formatted consistently as (XX) 00000-0000, so that they are easy to read and recognize.

#### Acceptance Criteria

1. WHEN displaying a phone number, THE Phone_Format_System SHALL format it as (XX) 00000-0000 where XX is the area code
2. THE Phone_Format_System SHALL handle 11-digit phone numbers (with 9 in the mobile prefix)
3. THE Phone_Format_System SHALL apply formatting consistently in all views (order list, order detail, customer info, reports)
4. WHEN storing phone numbers, THE Phone_Format_System SHALL store only digits in the database
5. THE Phone_Format_System SHALL validate phone number format before display and show raw numbers if formatting fails

### Requirement 8

**User Story:** As a waiter, I want to add items to an order that hasn't been paid yet, so that I can accommodate customer requests for additional items.

#### Acceptance Criteria

1. WHEN a waiter views an order with status "pending" or "Em Preparo", THE Order_Edit_System SHALL allow adding new items to the order
2. WHEN a waiter adds items to an unpaid order, THE Order_Edit_System SHALL update the order total and commission amounts
3. THE Order_Edit_System SHALL prevent adding items to orders with status "paid" or "completed" without proper authorization
4. WHEN items are added to an order, THE Order_Edit_System SHALL update the kitchen display with the new items
5. THE Order_Edit_System SHALL log all modifications to orders for audit purposes

### Requirement 9

**User Story:** As a waiter, I want the order editing interface to clearly show which orders can be modified, so that I don't attempt to edit orders that are locked.

#### Acceptance Criteria

1. WHEN displaying orders, THE Order_Display_System SHALL visually indicate which orders are editable based on their status
2. WHEN an order cannot be edited, THE Order_Display_System SHALL disable or hide the edit button
3. IF a waiter attempts to edit a locked order, THEN THE Order_Edit_System SHALL display a clear message explaining why editing is not allowed
4. THE Order_Display_System SHALL show order status prominently to help waiters understand editability
5. THE Order_Edit_System SHALL provide appropriate permissions for different user roles (waiter, admin) regarding order editing

### Requirement 10

**User Story:** As a system administrator, I want order number generation to be reliable and consistent, so that there are no duplicate or missing order numbers.

#### Acceptance Criteria

1. THE Order_Number_Generator SHALL use a database sequence or atomic counter to ensure uniqueness
2. WHEN multiple orders are created simultaneously, THE Order_Number_Generator SHALL assign unique sequential numbers without conflicts
3. THE Order_Number_Generator SHALL handle database transaction rollbacks without creating gaps in critical sequences
4. THE Order_Number_Generator SHALL maintain order number continuity across system restarts
5. THE Order_Number_Generator SHALL provide a mechanism to query the next available order number
