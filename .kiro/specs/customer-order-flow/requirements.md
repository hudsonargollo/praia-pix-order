# Requirements Document

## Introduction

This document defines the requirements for the customer order flow system in praia-pix-order, a beachside kiosk ordering application. The system enables customers to scan QR codes at tables, place orders through a digital menu, pay via MercadoPago, and receive WhatsApp notifications throughout the order lifecycle. The system also provides authenticated panels for kitchen and cashier staff to manage orders.

## Glossary

- **Customer**: A beach-goer who scans a QR code to place an order
- **Cashier_Panel**: Web interface for cashier staff to manage payments and order status
- **Kitchen_Panel**: Web interface for kitchen staff to view and prepare orders
- **Order_System**: The complete praia-pix-order application
- **QR_Code**: Table-specific code that directs customers to the ordering interface
- **MercadoPago_API**: Payment service provider API for processing Pix payments
- **WhatsApp_Service**: Service for sending order notifications to customers

## Requirements

### Requirement 1

**User Story:** As a customer, I want to scan a QR code at my table and be directed to a welcome page, so that I can start the ordering process without downloading an app.

#### Acceptance Criteria

1. WHEN a customer scans a table QR code, THE Order_System SHALL redirect them to a welcome page specific to that table
2. THE Order_System SHALL display the welcome page without requiring any app installation
3. THE Order_System SHALL identify the table number from the QR code for order tracking
4. THE Order_System SHALL provide clear navigation from the welcome page to the menu

### Requirement 2

**User Story:** As a customer, I want to browse the menu and add items to my order, so that I can select the food and drinks I want.

#### Acceptance Criteria

1. WHEN a customer navigates from the welcome page, THE Order_System SHALL display the complete menu with items and prices
2. WHEN a customer selects menu items, THE Order_System SHALL add them to their order cart
3. THE Order_System SHALL display the running total of the customer's order
4. THE Order_System SHALL allow customers to modify quantities or remove items from their cart
5. WHEN the customer is ready to checkout, THE Order_System SHALL proceed to the customer information form

### Requirement 3

**User Story:** As a customer, I want to provide my name and WhatsApp number, so that I can receive order updates and the restaurant can contact me.

#### Acceptance Criteria

1. WHEN a customer proceeds to checkout, THE Order_System SHALL display a form requesting name and WhatsApp number
2. THE Order_System SHALL validate that the WhatsApp number is in a valid format
3. THE Order_System SHALL require both name and WhatsApp number before allowing payment
4. WHEN customer information is complete, THE Order_System SHALL generate a MercadoPago payment QR code

### Requirement 4

**User Story:** As a customer, I want to pay for my order using a QR code, so that I can complete my purchase quickly and securely.

#### Acceptance Criteria

1. WHEN customer information is submitted, THE Order_System SHALL call MercadoPago_API to generate a payment QR code
2. THE Order_System SHALL display the payment QR code and order total to the customer
3. THE Order_System SHALL register the order in the Cashier_Panel with "awaiting payment" status
4. THE Order_System SHALL provide a "copy and paste" Pix code option alongside the QR code

### Requirement 5

**User Story:** As a cashier, I want to access a password-protected panel to view pending orders, so that I can track payments and order status.

#### Acceptance Criteria

1. WHEN a cashier accesses the cashier panel URL, THE Order_System SHALL require password authentication
2. WHEN authentication is successful, THE Order_System SHALL display all orders with their current status
3. THE Order_System SHALL show orders awaiting payment with customer details and order contents
4. WHEN payment is confirmed via MercadoPago_API, THE Order_System SHALL automatically update order status to "paid"

### Requirement 6

**User Story:** As a kitchen staff member, I want to access a password-protected panel to view paid orders, so that I can prepare the food and drinks.

#### Acceptance Criteria

1. WHEN kitchen staff accesses the kitchen panel URL, THE Order_System SHALL require password authentication
2. WHEN authentication is successful, THE Order_System SHALL display only paid orders ready for preparation
3. THE Order_System SHALL show order details including items, quantities, and table number
4. THE Order_System SHALL allow kitchen staff to mark orders as "in preparation" and "ready for pickup"

### Requirement 7

**User Story:** As a customer, I want to receive WhatsApp notifications about my order status, so that I know when my order is confirmed and ready for pickup.

#### Acceptance Criteria

1. WHEN payment is confirmed via MercadoPago_API, THE Order_System SHALL send a WhatsApp message to the customer confirming the order
2. THE Order_System SHALL include order details and estimated preparation time in the confirmation message
3. WHEN the kitchen marks an order as ready, THE Order_System SHALL send a WhatsApp pickup notification to the customer
4. THE Order_System SHALL include the table number and pickup instructions in the notification

### Requirement 8

**User Story:** As the system, I want to automatically detect payment confirmation from MercadoPago, so that orders can be processed without manual intervention.

#### Acceptance Criteria

1. THE Order_System SHALL register webhook endpoints with MercadoPago_API to receive payment notifications
2. WHEN MercadoPago_API sends a payment confirmation webhook, THE Order_System SHALL update the order status from "awaiting payment" to "paid"
3. WHEN order status changes to "paid", THE Order_System SHALL automatically send the order to the Kitchen_Panel
4. THE Order_System SHALL send the customer confirmation WhatsApp message when payment is detected
5. IF webhook delivery fails, THE Order_System SHALL implement a fallback polling mechanism to check payment status

### Requirement 9

**User Story:** As a cashier, I want to manually update order status and notify customers, so that I can manage the complete order lifecycle.

#### Acceptance Criteria

1. WHEN an order is ready for pickup, THE Cashier_Panel SHALL allow manual status updates
2. WHEN cashier updates status to "ready for pickup", THE Order_System SHALL trigger WhatsApp_Service to send pickup notification
3. THE Order_System SHALL allow cashiers to mark orders as "completed" when picked up
4. THE Cashier_Panel SHALL maintain a log of all status changes with timestamps