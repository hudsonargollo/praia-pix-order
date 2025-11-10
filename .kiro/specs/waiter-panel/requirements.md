# Requirements Document

## Introduction

The Waiter Panel feature enables waiters to take customer orders directly through the system, manage customer information, add order notes, and optionally generate PIX QR codes for payment. This feature extends the existing waiter functionality to provide a complete order management solution for table service.

## Glossary

- **Waiter_System**: The waiter panel interface and backend functionality
- **Order_Management_System**: The system that handles order creation, tracking, and status updates
- **Customer_Data_System**: The system that manages customer information (name and WhatsApp)
- **Payment_System**: The PIX payment integration system
- **Admin_Reporting_System**: The system that provides order filtering and sales reporting by waiter
- **QR_Generator**: The component that generates PIX QR codes for payments

## Requirements

### Requirement 1

**User Story:** As a waiter, I want to place orders for customers so that I can provide table service without requiring customers to use their phones.

#### Acceptance Criteria

1. WHEN a waiter accesses the order placement interface, THE Waiter_System SHALL display the complete menu with all available items
2. WHEN a waiter selects menu items and quantities, THE Waiter_System SHALL add items to a cart interface
3. WHEN a waiter modifies cart contents, THE Waiter_System SHALL update the total amount in real-time
4. WHEN a waiter confirms an order, THE Order_Management_System SHALL create the order with waiter attribution
5. THE Order_Management_System SHALL assign the waiter's ID to all orders they create

### Requirement 2

**User Story:** As a waiter, I want to collect customer information (name and WhatsApp) so that the restaurant can contact customers about their orders.

#### Acceptance Criteria

1. WHEN a waiter creates an order, THE Customer_Data_System SHALL require customer name input
2. WHEN a waiter creates an order, THE Customer_Data_System SHALL require customer WhatsApp number input
3. WHEN a waiter enters a WhatsApp number, THE Customer_Data_System SHALL validate the number format (11 digits with DDD)
4. WHEN customer information is incomplete, THE Waiter_System SHALL prevent order creation
5. THE Customer_Data_System SHALL store customer information with the order record

### Requirement 3

**User Story:** As a waiter, I want to add notes to orders so that I can communicate special requests or modifications to the kitchen.

#### Acceptance Criteria

1. WHEN a waiter creates an order, THE Waiter_System SHALL provide a notes input field
2. WHEN a waiter enters order notes, THE Order_Management_System SHALL store the notes with the order
3. WHEN order notes exist, THE Order_Management_System SHALL display notes in the kitchen interface
4. THE Order_Management_System SHALL allow notes up to 500 characters in length
5. WHERE notes are provided, THE Order_Management_System SHALL include notes in order notifications

### Requirement 4

**User Story:** As a waiter, I want orders to be processed without requiring payment so that I can serve customers who prefer to pay at the counter or with cash.

#### Acceptance Criteria

1. WHEN a waiter creates an order, THE Order_Management_System SHALL set the initial status to "pending" instead of "pending_payment"
2. WHEN a waiter-created order is submitted, THE Order_Management_System SHALL make the order immediately visible to kitchen staff
3. THE Order_Management_System SHALL not require payment confirmation for waiter-created orders
4. WHEN a waiter-created order is completed, THE Order_Management_System SHALL update the order status to "completed"
5. THE Order_Management_System SHALL track waiter-created orders separately from customer self-service orders

### Requirement 5

**User Story:** As a waiter, I want to optionally generate PIX QR codes for orders so that customers can pay digitally if they prefer.

#### Acceptance Criteria

1. WHEN a waiter views an order, THE Payment_System SHALL provide an option to generate a PIX QR code
2. WHEN a waiter requests PIX generation, THE QR_Generator SHALL create a payment QR code for the order total
3. WHEN a PIX QR code is generated, THE Payment_System SHALL display the QR code for customer scanning
4. WHEN payment is received via PIX, THE Payment_System SHALL update the order status to "paid"
5. WHERE PIX payment is not used, THE Order_Management_System SHALL maintain the order as "pending" status

### Requirement 6

**User Story:** As an admin, I want to filter orders by waiter so that I can track individual waiter performance and sales.

#### Acceptance Criteria

1. WHEN an admin accesses the reporting interface, THE Admin_Reporting_System SHALL display a waiter filter option
2. WHEN an admin selects a waiter filter, THE Admin_Reporting_System SHALL show only orders created by that waiter
3. WHEN displaying filtered orders, THE Admin_Reporting_System SHALL show order details including customer information and totals
4. THE Admin_Reporting_System SHALL calculate total sales amount for the selected waiter
5. THE Admin_Reporting_System SHALL display the number of orders placed by each waiter

### Requirement 7

**User Story:** As an admin, I want to view gross sales by waiter so that I can calculate commissions and track performance metrics.

#### Acceptance Criteria

1. WHEN an admin accesses sales reporting, THE Admin_Reporting_System SHALL display gross sales totals by waiter
2. WHEN calculating waiter sales, THE Admin_Reporting_System SHALL include all completed orders attributed to each waiter
3. WHEN displaying sales data, THE Admin_Reporting_System SHALL show both order count and total revenue per waiter
4. THE Admin_Reporting_System SHALL allow filtering sales data by date range
5. THE Admin_Reporting_System SHALL calculate and display commission amounts based on waiter sales