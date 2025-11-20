# Implementation Plan

- [x] 1. Create database infrastructure for payment confirmation tracking
  - Create `payment_confirmation_log` table with indexes
  - Add `dedupe_key` column to `whatsapp_notifications` table
  - Add RLS policies for new table
  - _Requirements: 1.5, 3.3, 3.4_

- [x] 2. Implement Payment Confirmation Service
- [x] 2.1 Create PaymentConfirmationService class
  - Write service class with deduplication logic
  - Implement `confirmPayment()` main entry point
  - Implement `wasRecentlyNotified()` deduplication check
  - Implement `updateOrder()` database update method
  - Implement `notifyCustomer()` WhatsApp notification method
  - Implement `logEvent()` confirmation logging
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

- [x] 2.2 Add error handling and logging
  - Handle database update failures
  - Handle WhatsApp notification failures
  - Handle duplicate confirmation attempts
  - Log all events to appropriate tables
  - _Requirements: 1.4, 3.4_

- [x] 3. Create Supabase Edge Function for payment confirmation
  - Create `supabase/functions/confirm-payment/index.ts`
  - Implement request validation
  - Call PaymentConfirmationService
  - Return structured response
  - Add CORS headers
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Update Cashier panel to use centralized service
  - Modify `confirmPaymentManually()` to call edge function
  - Update error handling
  - Update success messages
  - Remove old direct database update code
  - _Requirements: 1.1, 1.3, 3.1_

- [x] 5. Update MercadoPago webhook to use centralized service
  - Modify webhook to call `confirm-payment` edge function
  - Pass payment method and payment ID
  - Update error handling
  - Remove direct database update code
  - _Requirements: 1.2, 3.1, 3.2_

- [x] 6. Enhance useAutoPrint hook for reliable printing
- [x] 6.1 Add initial order tracking on mount
  - Implement `initializeOrderTracking()` function
  - Fetch current kitchen orders on mount
  - Initialize `previousOrderStatusesRef` with current statuses
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

- [x] 6.2 Improve order insert and update handlers
  - Update `handleOrderInsert()` to print orders already in preparation
  - Update `handleOrderStatusChange()` to detect transitions
  - Add logging for debugging
  - _Requirements: 2.1, 2.2, 4.3, 4.4_

- [x] 6.3 Add error handling for print failures
  - Catch print errors without blocking workflow
  - Show user-friendly error messages
  - Log errors for debugging
  - _Requirements: 2.5_

- [x] 7. Update Kitchen page to use enhanced auto-print
  - Verify auto-print toggle integration
  - Test with real-time order updates
  - Verify print triggers on status changes
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8. Add comprehensive logging and monitoring
  - Log all payment confirmations to `payment_confirmation_log`
  - Log all WhatsApp notifications with dedupe keys
  - Log auto-print attempts and results
  - Add console logging for debugging
  - _Requirements: 3.4, 4.5_

- [x] 9. Verify and test the complete flow
  - Test manual payment confirmation from Cashier
  - Test webhook payment confirmation from MercadoPago
  - Test auto-print when Kitchen page is open
  - Test auto-print when Kitchen page loads after confirmation
  - Verify no duplicate WhatsApp notifications
  - Verify single notification in database
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 10. Update documentation
  - Document new payment confirmation flow
  - Document auto-print behavior
  - Update deployment guide if needed
  - Add troubleshooting section
  - _Requirements: All_
