# Implementation Plan

- [x] 1. Enhance database schema for waiter order management
  - Add order_notes column to orders table for special instructions
  - Add created_by_waiter boolean flag to distinguish waiter orders
  - Create waiter_performance view for admin reporting
  - Update RLS policies for waiter order access
  - _Requirements: 3.2, 3.4, 4.2, 6.2_

- [x] 2. Create customer information collection components
  - [x] 2.1 Build CustomerInfoForm component with validation
    - Implement name input with required validation
    - Create WhatsApp number input with 11-digit format validation
    - Add real-time validation feedback and error messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Create OrderNotesInput component
    - Implement multi-line text input with 500 character limit
    - Add character count display and validation
    - Create optional field with clear labeling
    - _Requirements: 3.1, 3.4_

- [x] 3. Enhance waiter order placement interface
  - [x] 3.1 Modify existing Checkout component for waiter workflow
    - Integrate CustomerInfoForm for waiter-assisted orders
    - Add OrderNotesInput to order creation flow
    - Update order creation logic to set waiter_id and created_by_waiter flag
    - _Requirements: 1.4, 1.5, 2.5, 3.2_

  - [x] 3.2 Update order creation API calls
    - Modify order creation to include order_notes field
    - Set initial status to "pending" for waiter orders instead of "pending_payment"
    - Ensure waiter attribution is properly stored
    - _Requirements: 4.1, 4.2, 4.5_

- [x] 4. Implement PIX QR code generation for waiter orders
  - [x] 4.1 Create PIXQRGenerator component
    - Build optional PIX QR code generation interface
    - Integrate with existing MercadoPago PIX system
    - Add payment status monitoring for generated QR codes
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.2 Add PIX generation to waiter dashboard
    - Create "Generate PIX" button for existing orders
    - Display QR code modal when PIX is requested
    - Update order status when payment is received
    - _Requirements: 5.4, 5.5_

- [x] 5. Enhance admin reporting for waiter performance
  - [x] 5.1 Create AdminWaiterReports component
    - Build waiter selection dropdown interface
    - Implement order filtering by selected waiter
    - Display filtered orders with customer information and totals
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 5.2 Implement waiter sales reporting
    - Create sales totals calculation by waiter
    - Add date range filtering for sales data
    - Display order count and revenue per waiter
    - Calculate and show commission amounts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 5.3 Integrate waiter reports into existing Admin page
    - Add waiter reporting tab to Admin interface
    - Connect AdminWaiterReports component to admin navigation
    - Ensure proper role-based access control
    - _Requirements: 6.4, 6.5_

- [x] 6. Update kitchen interface to display waiter order information
  - [x] 6.1 Modify Kitchen component to show order notes
    - Display order notes in kitchen order cards
    - Add waiter name attribution to order display
    - Ensure notes are visible and properly formatted
    - _Requirements: 3.3, 3.5_

  - [x] 6.2 Update order status management for waiter orders
    - Ensure waiter orders flow through kitchen workflow
    - Maintain existing order status transitions
    - Update order completion logic for waiter-created orders
    - _Requirements: 4.3, 4.4_

- [x] 7. Add comprehensive testing for waiter functionality
  - [x] 7.1 Write unit tests for customer info validation
    - Test phone number format validation (11 digits)
    - Test required field validation for customer name
    - Test order notes character limit enforcement
    - _Requirements: 2.3, 2.4, 3.4_

  - [x] 7.2 Write integration tests for waiter order flow
    - Test end-to-end waiter order placement
    - Test order creation with waiter attribution
    - Test PIX QR code generation and payment flow
    - _Requirements: 1.1, 1.4, 5.2, 5.4_

  - [x] 7.3 Write tests for admin reporting functionality
    - Test waiter filtering and sales calculations
    - Test commission calculation accuracy
    - Test date range filtering for reports
    - _Requirements: 6.2, 7.1, 7.4_