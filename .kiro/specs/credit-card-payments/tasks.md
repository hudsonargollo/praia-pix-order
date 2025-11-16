# Implementation Plan: Credit Card Payments with MercadoPago

## Overview

This implementation plan breaks down the credit card payment integration into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring a smooth development process from backend infrastructure to frontend user interface.

## Tasks

- [x] 1. Set up MercadoPago Payment Brick infrastructure
  - Create Payment Brick service module to handle SDK initialization and tokenization
  - Add MercadoPago SDK script loading logic (dynamic or in index.html)
  - Create TypeScript interfaces for Payment Brick configuration and responses
  - Add environment variable for MercadoPago public key
  - _Requirements: 2.5, 3.2_

- [x] 2. Create backend edge function for card payments
  - [x] 2.1 Create new Supabase edge function `mercadopago-card-payment`
    - Set up function structure with CORS headers
    - Define request/response TypeScript interfaces
    - Implement request validation (orderId, token, amount, payer info)
    - _Requirements: 4.1, 4.2_

  - [x] 2.2 Implement MercadoPago API integration
    - Make POST request to MercadoPago `/v1/payments` endpoint with card token
    - Include all required parameters (transaction_amount, token, payment_method_id, payer, installments: 1)
    - Handle MercadoPago API responses (approved, rejected, in_process)
    - Map MercadoPago status codes to user-friendly error messages
    - _Requirements: 4.3, 4.4_

  - [x] 2.3 Update order status in database
    - Update orders table with payment status from MercadoPago
    - Store mercadopago_payment_id and payment_confirmed_at timestamp
    - Return clear JSON response with payment status to frontend
    - _Requirements: 4.5, 4.6_

  - [x] 2.4 Add error handling and retry logic
    - Implement exponential backoff for transient API failures
    - Add comprehensive error logging
    - Return user-friendly error messages in Portuguese
    - _Requirements: 5.3_

- [x] 3. Enhance MercadoPago client integration layer
  - [x] 3.1 Add card payment types to types.ts
    - Define CardPaymentRequest interface
    - Define CardPaymentResponse interface
    - Add PaymentMethod type ('pix' | 'credit_card')
    - Export new types from index.ts
    - _Requirements: 3.5, 4.2_

  - [x] 3.2 Add createCardPayment method to client.ts
    - Implement method to call backend edge function
    - Use existing retry logic with exponential backoff
    - Add request validation before API call
    - Handle and format error responses
    - _Requirements: 3.5, 4.2_

- [x] 4. Create Payment Brick service module
  - [x] 4.1 Create payment-brick.ts service file
    - Initialize MercadoPago SDK with public key
    - Create Payment Brick instance with configuration (no installments, pt-BR locale)
    - Implement mount method to render brick in container
    - Implement getCardToken method to tokenize card data
    - Implement unmount method for cleanup
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 3.2_

  - [x] 4.2 Add error handling for Payment Brick
    - Handle SDK initialization failures
    - Handle tokenization errors with specific messages
    - Return user-friendly error messages in Portuguese
    - _Requirements: 3.4_

- [x] 5. Create PaymentMethodSelector component
  - Create new component in src/components/PaymentMethodSelector.tsx
  - Implement radio button or tab-style selector for PIX and Cartão de Crédito
  - Add visual indicators for selected method
  - Implement disabled state during payment processing
  - Add accessible keyboard navigation and ARIA labels
  - Style with Tailwind CSS matching existing design system
  - _Requirements: 1.1, 1.2_

- [x] 6. Create CreditCardPayment component
  - [x] 6.1 Create component structure
    - Create new component in src/components/CreditCardPayment.tsx
    - Define component props (orderId, amount, callbacks)
    - Set up state management (processing, error, paymentStatus)
    - Add container div for Payment Brick mounting
    - _Requirements: 2.1, 2.2_

  - [x] 6.2 Implement Payment Brick lifecycle
    - Initialize Payment Brick on component mount
    - Configure brick with no installments option
    - Unmount brick on component unmount
    - Handle re-initialization on retry
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 6.3 Implement payment submission flow
    - Add "Pagar com Cartão" button
    - Call getCardToken on button click
    - Show loading state and disable button during processing
    - Call backend API with card token and order details
    - Handle payment response (success, error, pending)
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 6.4 Add error handling and user feedback
    - Display tokenization errors from Payment Brick
    - Display payment processing errors with user-friendly messages
    - Show success message on approved payment
    - Enable retry on rejection with re-enabled button
    - _Requirements: 3.4, 5.3_

- [x] 7. Enhance Payment page with credit card support
  - [x] 7.1 Add payment method state management
    - Add selectedPaymentMethod state ('pix' | 'credit_card')
    - Set default to 'pix' on page load
    - Add handler for payment method changes
    - _Requirements: 1.3, 1.4_

  - [x] 7.2 Integrate PaymentMethodSelector component
    - Import and render PaymentMethodSelector component
    - Position below header and above payment interface
    - Connect to payment method state
    - Disable during payment processing
    - _Requirements: 1.1, 1.2_

  - [x] 7.3 Implement conditional rendering for payment methods
    - Show PIX interface when 'pix' is selected
    - Show CreditCardPayment component when 'credit_card' is selected
    - Hide inactive payment interface
    - Keep "Resumo do Pedido" visible for both methods
    - _Requirements: 1.4, 1.5, 1.6, 1.7_

  - [x] 7.4 Integrate CreditCardPayment component
    - Import and render CreditCardPayment component
    - Pass orderId, amount, and order details as props
    - Implement onPaymentSuccess callback to update status badge
    - Implement onPaymentError callback to show error messages
    - Implement onPaymentPending callback for in_process status
    - _Requirements: 2.2, 3.1, 5.1_

  - [x] 7.5 Update payment status handling
    - Update status badge based on card payment responses
    - Show success state with disabled form on approval
    - Show error state with retry option on rejection
    - Show pending state with review message for in_process
    - Display toast notifications for payment events
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Add MercadoPago SDK script loading
  - Add MercadoPago SDK script tag to index.html or implement dynamic loading
  - Ensure script loads before Payment Brick initialization
  - Add error handling for script load failures
  - _Requirements: 2.5_

- [x] 9. Environment configuration and deployment preparation
  - Add VITE_MERCADOPAGO_PUBLIC_KEY to .env file
  - Add MERCADOPAGO_ACCESS_TOKEN to Supabase edge function secrets
  - Update .env.example with new environment variables
  - Document environment setup in README or deployment docs
  - _Requirements: 2.5, 4.1_
 - [x] 10. Integration testing and validation
  - [x] 10.1 Test payment method switching
    - Verify switching from PIX to credit card shows card form
    - Verify switching back to PIX hides card form
    - Verify order summary remains visible during switches
    - _Requirements: 1.4, 1.5, 1.6, 1.7_

  - [x] 10.2 Test successful card payment flow
    - Use MercadoPago test card for approved payment
    - Verify Payment Brick renders correctly
    - Verify tokenization succeeds
    - Verify backend processes payment successfully
    - Verify order status updates to 'paid'
    - Verify success message displays
    - _Requirements: 3.2, 3.3, 3.5, 4.3, 4.5, 5.2_

  - [x] 10.3 Test rejected card payment flow
    - Use MercadoPago test card for rejected payment
    - Verify error message displays with rejection reason
    - Verify retry button is enabled
    - Verify order status remains 'pending_payment'
    - _Requirements: 5.3_

  - [x] 10.4 Test error scenarios
    - Test with invalid card data (tokenization error)
    - Test with network errors (backend unavailable)
    - Test with expired tokens
    - Verify user-friendly error messages display
    - _Requirements: 3.4, 5.3_

  - [x] 10.5 Test mobile responsiveness
    - Verify Payment Brick renders correctly on mobile devices
    - Verify payment method selector is usable on small screens
    - Verify buttons meet minimum touch target size (44px)
    - Verify form fields are accessible on mobile keyboards
    - _Requirements: 1.1, 2.2, 3.1_

- [x] 11. Documentation and code cleanup
  - Add JSDoc comments to new components and services
  - Update README with credit card payment feature
  - Document Payment Brick integration approach
  - Add troubleshooting guide for common issues
  - Remove any console.log statements used during development
    