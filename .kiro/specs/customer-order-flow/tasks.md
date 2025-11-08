one then two# Implementation Plan

- [x] 1. Set up QR code routing and table context
  - Create dynamic route for QR code landing (`/:tableId`)
  - Implement table ID validation and context management
  - Add redirect logic from QR scan to welcome page
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement welcome page and navigation flow
  - Create Welcome page component with table number display
  - Add restaurant branding and "Start Ordering" CTA
  - Implement navigation to menu with table context preservation
  - _Requirements: 1.4_

- [x] 3. Enhance menu component with cart functionality
- [x] 3.1 Update menu page to accept table ID parameter
  - Modify existing Menu component to handle table context
  - Update route to `/menu/:tableId`
  - _Requirements: 2.1_

- [x] 3.2 Implement cart state management
  - Create cart context with add/remove/update item functionality
  - Add quantity controls and running total calculation
  - Implement cart persistence in localStorage
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 3.3 Add checkout navigation
  - Create "Proceed to Checkout" button with cart validation
  - Implement navigation to customer information form
  - _Requirements: 2.5_

- [x] 4. Create customer information form
- [x] 4.1 Build checkout form component
  - Create form with name and WhatsApp number fields
  - Implement form validation using react-hook-form and zod
  - Add Brazilian phone number format validation
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4.2 Integrate order creation
  - Create order submission logic with customer info and cart items
  - Generate order in Supabase with "pending_payment" status
  - Navigate to payment page with order ID
  - _Requirements: 3.4_

- [x] 5. Implement MercadoPago payment integration
- [x] 5.1 Set up MercadoPago service
  - Create MercadoPago API service with payment creation
  - Implement QR code and Pix copy/paste generation
  - Add environment variables for MercadoPago credentials
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 5.2 Create payment display component
  - Build payment page with QR code display
  - Add copy/paste functionality for Pix code
  - Implement payment status polling mechanism
  - _Requirements: 4.4_

- [x] 5.3 Implement payment webhook handling
  - Create webhook endpoint for MercadoPago payment confirmations
  - Add webhook signature validation
  - Update order status from "pending_payment" to "paid"
  - _Requirements: 4.3, 4.4, 8.1, 8.2_

- [x] 5.4 Add payment status fallback polling
  - Implement fallback polling for payment status checking
  - Add timeout handling for expired payments
  - _Requirements: 8.5_

- [x] 6. Enhance database schema for payment tracking
- [x] 6.1 Update orders table with payment fields
  - Add MercadoPago payment ID, QR code data, and expiration fields
  - Create database migration for new columns
  - _Requirements: 4.1, 4.2_

- [x] 6.2 Create payment webhooks tracking table
  - Add table for webhook processing audit trail
  - Implement webhook deduplication logic
  - _Requirements: 8.1, 8.2_

- [x] 7. Implement WhatsApp notification system
- [x] 7.1 Set up WhatsApp service integration
  - Create WhatsApp API service for message sending
  - Add environment variables for WhatsApp credentials
  - Implement message templates for order confirmation and pickup
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7.2 Create notification database tracking
  - Add WhatsApp notifications table for delivery tracking
  - Implement notification status management
  - _Requirements: 7.1, 7.3_

- [x] 7.3 Integrate notifications with order flow
  - Trigger confirmation message on payment webhook
  - Send pickup notification when order marked ready
  - _Requirements: 7.1, 7.3, 8.4_

- [-] 8. Enhance kitchen panel for order management
- [x] 8.1 Update kitchen panel to show only paid orders
  - Filter orders by "paid" status in kitchen view
  - Add real-time subscription for new paid orders
  - _Requirements: 6.2, 6.3, 8.3_

- [x] 8.2 Add order status management to kitchen panel
  - Implement status update buttons (in preparation, ready)
  - Add order completion workflow
  - _Requirements: 6.4_

- [x] 8.3 Add audio/visual notifications for new orders
  - Implement sound alerts for new paid orders
  - Add visual indicators for order status changes
  - _Requirements: 6.2_

- [x] 9. Enhance cashier panel for payment monitoring
- [x] 9.1 Update cashier panel with payment status display
  - Show orders with payment status and timestamps
  - Add real-time updates for payment confirmations
  - _Requirements: 5.2, 5.3, 8.2_

- [x] 9.2 Add manual order status management
  - Implement manual status update controls
  - Add customer notification triggers from cashier panel
  - Create order completion workflow
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 10. Implement real-time order updates
- [x] 10.1 Set up Supabase real-time subscriptions
  - Create real-time service for order status changes
  - Implement subscription management for kitchen and cashier panels
  - _Requirements: 6.2, 5.2, 8.3_

- [x] 10.2 Add real-time notifications across panels
  - Sync order status changes between kitchen and cashier
  - Implement automatic UI updates for status changes
  - _Requirements: 8.3, 9.1_

- [x] 11. Add error handling and recovery mechanisms
- [x] 11.1 Implement payment error handling
  - Add retry logic for MercadoPago API failures
  - Create user-friendly error messages for payment issues
  - Implement payment timeout handling
  - _Requirements: 4.3, 8.5_

- [x] 11.2 Add WhatsApp delivery error handling
  - Implement retry mechanism for failed message delivery
  - Add fallback notification methods
  - _Requirements: 7.1, 7.3_

- [x] 12. Add order status tracking for customers
- [x] 12.1 Create order status page
  - Build customer-facing order status display
  - Show current order status and estimated completion time
  - Add real-time updates for order progress
  - _Requirements: 7.2_

- [x] 12.2 Implement order lookup functionality
  - Add order number or phone-based order lookup
  - Create secure access to order status without authentication
  - _Requirements: 7.2_

- [x] 13. Add comprehensive testing
- [-] 13.1 Write unit tests for payment service
  - Test MercadoPago API integration with mocked responses
  - Test payment webhook processing logic
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 13.2 Write unit tests for WhatsApp service
  - Test message sending functionality with mocked API
  - Test notification template generation
  - _Requirements: 7.1, 7.3_

- [ ]* 13.3 Write integration tests for order flow
  - Test complete customer journey from QR scan to payment
  - Test kitchen and cashier panel workflows
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ]* 13.4 Add end-to-end testing
  - Test real payment flow with MercadoPago sandbox
  - Test WhatsApp message delivery in staging environment
  - _Requirements: 4.4, 7.1_