# Requirements Document

## Introduction

The Waiter Payment Workflow feature separates order status from payment status for waiter-created orders. This allows waiters to create orders that go directly into preparation while payment remains pending until the waiter generates a PIX QR code and the customer completes payment through MercadoPago.

## Glossary

- **Order_Management_System**: The system that manages order lifecycle and status transitions
- **Payment_Management_System**: The system that tracks payment status independently from order status
- **Waiter_Order_System**: The system that handles orders created by waiters
- **PIX_Generation_System**: The system that generates PIX QR codes for payment
- **Status_Display_System**: The system that displays both order status and payment status
- **MercadoPago_Integration**: The payment gateway integration that confirms payments via webhook
- **Kitchen_Display_System**: The system that shows orders to kitchen staff

## Requirements

### Requirement 1

**User Story:** As a waiter, I want to create orders that go directly into preparation without requiring immediate payment, so that customers can start receiving their food while payment is processed separately.

#### Acceptance Criteria

1. WHEN a waiter creates an order, THE Order_Management_System SHALL set the order status to 'in_preparation'
2. WHEN a waiter creates an order, THE Payment_Management_System SHALL set the payment status to 'pending'
3. THE Order_Management_System SHALL NOT automatically generate PIX QR codes for waiter-created orders
4. THE Order_Management_System SHALL mark the order with created_by_waiter flag as true
5. THE Kitchen_Display_System SHALL display waiter-created orders immediately upon creation

### Requirement 1.1

**User Story:** As a waiter, I want to add items to orders that are already in preparation, so that I can accommodate customer requests for additional items.

#### Acceptance Criteria

1. WHEN an order has status 'in_preparation', THE Order_Management_System SHALL allow the waiter to add new items
2. WHEN items are added to an order in preparation, THE Order_Management_System SHALL recalculate the total amount
3. WHEN items are added to an order in preparation, THE Payment_Management_System SHALL update the commission amount
4. THE Order_Management_System SHALL allow adding items only if payment status is 'pending'
5. THE Kitchen_Display_System SHALL display newly added items in real-time

### Requirement 2

**User Story:** As a waiter, I want to manually generate PIX payment for orders when the customer is ready to pay, so that I can control the payment timing.

#### Acceptance Criteria

1. WHEN a waiter views an unpaid order, THE Status_Display_System SHALL display a "Gerar PIX" button
2. WHEN a waiter clicks "Gerar PIX", THE PIX_Generation_System SHALL create a MercadoPago payment request
3. THE PIX_Generation_System SHALL display a QR code for the customer to scan
4. THE PIX_Generation_System SHALL include order details and amount in the payment request
5. THE Payment_Management_System SHALL maintain payment status as 'pending' until webhook confirmation

### Requirement 3

**User Story:** As a system, I want to display both order status and payment status independently, so that staff can see preparation progress and payment status separately.

#### Acceptance Criteria

1. THE Status_Display_System SHALL display order status with appropriate color coding
2. THE Status_Display_System SHALL display payment status as "Aguardando Pagamento" with orange background and dark orange text when payment is pending
3. THE Status_Display_System SHALL display payment status as "Pagamento Confirmado" with blue background when payment is confirmed
4. THE Status_Display_System SHALL show both status badges simultaneously for waiter-created orders
5. THE Status_Display_System SHALL use existing status badge styling for order status (Em Preparo, Pronto, etc.)

### Requirement 4

**User Story:** As a system, I want to confirm payment via MercadoPago webhook, so that payment status updates automatically when customers complete payment.

#### Acceptance Criteria

1. WHEN MercadoPago webhook receives payment confirmation, THE Payment_Management_System SHALL update payment status to 'confirmed'
2. WHEN payment is confirmed, THE Payment_Management_System SHALL record payment_confirmed_at timestamp
3. WHEN payment is confirmed, THE Payment_Management_System SHALL store mercadopago_payment_id
4. THE MercadoPago_Integration SHALL validate webhook authenticity before updating payment status
5. THE Payment_Management_System SHALL trigger commission calculation upon payment confirmation

### Requirement 5

**User Story:** As a waiter, I want to see which orders have pending payments, so that I can follow up with customers for payment.

#### Acceptance Criteria

1. THE Status_Display_System SHALL highlight orders with pending payment status
2. THE Waiter_Order_System SHALL display "Gerar PIX" button for orders with pending payment
3. THE Waiter_Order_System SHALL show payment status prominently in order cards
4. THE Waiter_Order_System SHALL allow filtering orders by payment status
5. THE Status_Display_System SHALL use visual indicators (icons, colors) to distinguish payment status

### Requirement 6

**User Story:** As kitchen staff, I want to see orders in preparation regardless of payment status, so that I can start preparing food immediately.

#### Acceptance Criteria

1. THE Kitchen_Display_System SHALL display all orders with status 'in_preparation'
2. THE Kitchen_Display_System SHALL show payment status indicator on each order
3. THE Kitchen_Display_System SHALL allow marking orders as 'ready' regardless of payment status
4. THE Kitchen_Display_System SHALL display waiter name for waiter-created orders
5. THE Kitchen_Display_System SHALL maintain real-time updates for both order and payment status

### Requirement 7

**User Story:** As a cashier, I want to see payment status separately from order status, so that I can track which orders need payment follow-up.

#### Acceptance Criteria

1. THE Status_Display_System SHALL display payment status badge on cashier dashboard
2. THE Status_Display_System SHALL allow filtering orders by payment status on cashier dashboard
3. THE Status_Display_System SHALL show "Aguardando Pagamento" for unpaid orders
4. THE Status_Display_System SHALL show "Pagamento Confirmado" for paid orders
5. THE Status_Display_System SHALL maintain existing order status display alongside payment status

### Requirement 8

**User Story:** As a system administrator, I want payment status tracked separately from order status in the database, so that the system can handle various payment and preparation workflows.

#### Acceptance Criteria

1. THE Payment_Management_System SHALL store payment_status as a separate field in the orders table
2. THE Payment_Management_System SHALL support payment_status values: 'pending', 'confirmed', 'failed', 'refunded'
3. THE Order_Management_System SHALL support order status values independently: 'pending', 'in_preparation', 'ready', 'completed', 'cancelled'
4. THE Payment_Management_System SHALL allow orders to be in_preparation while payment is pending
5. THE Payment_Management_System SHALL prevent commission calculation until payment is confirmed

### Requirement 9

**User Story:** As a waiter, I want my commissions calculated only when payment is confirmed, so that I receive accurate commission tracking.

#### Acceptance Criteria

1. THE Payment_Management_System SHALL calculate commission only when payment_status is 'confirmed'
2. THE Status_Display_System SHALL show estimated commission for orders with pending payment
3. THE Status_Display_System SHALL show confirmed commission for orders with confirmed payment
4. THE Payment_Management_System SHALL update commission_amount when payment is confirmed
5. THE Payment_Management_System SHALL exclude unpaid orders from confirmed commission totals

### Requirement 10

**User Story:** As a customer, I want to pay for my order via PIX when the waiter generates the QR code, so that I can complete payment conveniently.

#### Acceptance Criteria

1. WHEN a waiter generates PIX, THE PIX_Generation_System SHALL display a QR code to the customer
2. THE PIX_Generation_System SHALL include order number and amount in the payment
3. THE PIX_Generation_System SHALL set payment expiration time appropriately
4. WHEN customer scans QR code, THE MercadoPago_Integration SHALL process the payment
5. WHEN payment is complete, THE Payment_Management_System SHALL update payment status via webhook

### Requirement 11

**User Story:** As a user viewing the orders page, I want clear messaging when no orders exist, so that I understand the current state without confusion.

#### Acceptance Criteria

1. WHEN no orders exist for the current filter, THE Status_Display_System SHALL display "Nenhum pedido em preparo" message
2. THE Status_Display_System SHALL NOT reference waiter selection in the empty state message
3. THE Status_Display_System SHALL display the empty state message centered on the page
4. THE Status_Display_System SHALL use consistent styling for empty state messages across all pages
5. THE Status_Display_System SHALL update the empty state message in real-time when orders are added or removed

### Requirement 12

**User Story:** As a user viewing the cashier page, I want the online status indicator to be visually consistent with success states, so that I can quickly identify system connectivity.

#### Acceptance Criteria

1. THE Status_Display_System SHALL display the online status pill with green background
2. THE Status_Display_System SHALL display the online status pill with dark green text
3. THE Status_Display_System SHALL position the gear icon close to the WhatsApp button
4. THE Status_Display_System SHALL apply the same background box styling to the gear icon as other header items
5. THE Status_Display_System SHALL maintain consistent spacing between header action items

### Requirement 13

**User Story:** As a user on the reports page, I want consistent header navigation, so that I can easily return to the admin dashboard.

#### Acceptance Criteria

1. THE Status_Display_System SHALL display the logo on the left side of the reports page header
2. THE Status_Display_System SHALL link the logo to /admin route
3. THE Status_Display_System SHALL maintain the same header layout and style as other admin pages
4. THE Status_Display_System SHALL remove the "Voltar ao Caixa" button from the reports page
5. THE Status_Display_System SHALL ensure responsive design for mobile devices

### Requirement 14

**User Story:** As a user filtering orders by date period, I want a streamlined date selection experience, so that I can quickly view orders for specific time periods.

#### Acceptance Criteria

1. THE Status_Display_System SHALL default to "Hoje" (today) when loading any page with date filtering
2. THE Status_Display_System SHALL remove the period label text above the date selector
3. THE Status_Display_System SHALL center the date period selector on mobile devices
4. THE Status_Display_System SHALL maintain consistent date selector styling across all pages
5. THE Status_Display_System SHALL persist the selected date period when navigating between filtered views
