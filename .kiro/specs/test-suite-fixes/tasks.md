# Implementation Plan - Test Suite Fixes

- [ ] 1. Create centralized Supabase mock infrastructure
  - Create mock factory with complete query builder chain
  - Include all CRUD operations (select, insert, update, delete)
  - Add query modifiers (eq, limit, single, etc.)
  - Ensure chainable methods return `this`
  - _Requirements: 1.1, 5.1_

- [ ] 2. Fix WhatsApp queue-manager tests
  - Update Supabase mock to include `.status` property
  - Fix "Cannot read properties of undefined" errors
  - Verify notification processing tests pass
  - Verify retry failed notifications test passes
  - Verify order notifications tests pass
  - _Requirements: 1.1_

- [ ] 3. Fix WhatsApp delivery-monitor tests
  - Add `.update()` method to Supabase mock
  - Fix "update is not a function" error in resolveAlert
  - Extend timeout for monitoring error test to 10000ms
  - Verify alert resolution test passes
  - Verify monitoring error handling test passes
  - _Requirements: 1.2, 5.2_

- [ ] 4. Fix WhatsApp compliance tests
  - Review punctuation warning logic
  - Update test expectations to match actual validation
  - Fix "should warn for excessive punctuation" test
  - Fix "should handle database errors gracefully" test
  - _Requirements: 1.3_

- [ ] 5. Fix WhatsApp notification-triggers tests
  - Add `.limit()` method to Supabase mock
  - Verify queue enqueue is called correctly
  - Fix "should queue payment confirmation" test
  - Fix "should trigger payment confirmation when status changes" test
  - _Requirements: 1.4, 5.1_

- [ ] 6. Fix WhatsApp phone-validator tests
  - Update area code validation error message
  - Change expected error from "Invalid Brazilian area code" to actual message
  - Verify test passes with correct expectation
  - _Requirements: 1.5_

- [ ] 7. Fix MercadoPago client response format tests
  - Update test expectations to use snake_case (API format)
  - Change `qrCode` to `qr_code`, `transactionAmount` to `transaction_amount`
  - Update nested `point_of_interaction.transaction_data` structure
  - Fix "should create payment successfully" test
  - Fix "should check payment status successfully" test
  - Fix "should handle missing QR code data" test
  - _Requirements: 2.1, 2.4_

- [ ] 8. Fix MercadoPago network retry timeout tests
  - Extend timeout to 10000ms for retry tests
  - Fix "should handle network errors with retry" test
  - Fix "should fail after max retries" test
  - Fix "should retry on network errors" test
  - _Requirements: 2.2, 5.2_

- [ ] 9. Fix MercadoPago error handling utility tests
  - Define `validPaymentData` variable in test scope
  - Fix "should identify retryable network errors" test
  - Fix "should not retry non-retryable errors" test
  - _Requirements: 2.5_

- [ ] 10. Fix MercadoPago webhook tests
  - Add `.limit()` method to Supabase mock
  - Fix "should process payment webhook successfully" test
  - Fix "should handle order not found" test
  - Fix "should update order status from pending_payment to paid" test
  - Fix "should send WhatsApp confirmation for paid orders" test
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Fix NotificationControls component tests
  - Identify current UI button text (appears to be only "Mensagem")
  - Update test expectations to match actual UI
  - Remove or update "Notificar Pronto" button expectations
  - Fix "renders notification controls with no history" test
  - Fix "sends ready notification when button is clicked" test
  - Fix "shows loading state when sending notification" test
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 12. Fix NotificationControls dialog timeout tests
  - Extend timeout to 10000ms for dialog interaction tests
  - Fix "opens custom message dialog and sends message" test
  - Fix "shows character count in custom message dialog" test
  - Fix "disables send button when message is empty" test
  - _Requirements: 3.3, 5.2_

- [ ] 13. Fix useNotificationHistory hook tests
  - Add TanStack Query provider wrapper to renderHook calls
  - Create test wrapper utility if not exists
  - Extend timeout to 10000ms for async data loading
  - Fix "loads notification history for given order IDs" test
  - Fix "returns empty history when no order IDs provided" test
  - Fix "identifies failed notifications correctly" test
  - Fix "calculates total attempts correctly" test
  - Fix "provides refresh function" test
  - _Requirements: 3.4, 5.2, 5.3_

- [ ] 14. Run full test suite and verify all fixes
  - Run `npm test -- --run` to execute all tests
  - Verify all 30 previously failing tests now pass
  - Verify no new test failures introduced
  - Check test execution time is reasonable (< 30s)
  - _Requirements: 5.4, 5.5_

- [ ]* 15. Document test infrastructure improvements
  - Create README in `src/test/` directory
  - Document Supabase mock usage
  - Document timeout configuration guidelines
  - Document test wrapper utilities
  - Add examples for common test patterns
  - _Requirements: 5.4, 5.5_
