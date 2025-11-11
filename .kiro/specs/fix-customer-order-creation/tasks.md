# Implementation Plan

- [x] 1. Create database migration for RLS policies
  - Create new migration file with timestamp
  - Drop all existing restrictive policies on orders and order_items tables
  - Create permissive INSERT policies for public and authenticated users
  - Create restrictive UPDATE policies for staff only
  - Create restrictive DELETE policies for admin only
  - Add verification queries to confirm policies are applied
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [x] 2. Apply migration to local database
  - Run migration in local Supabase instance
  - Verify policies using SQL queries
  - Test INSERT operations as anonymous user
  - Test INSERT operations as authenticated user
  - Test UPDATE operations (should fail for non-staff)
  - Test DELETE operations (should fail for non-admin)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Enhance Checkout component error handling
  - Add comprehensive error logging with user auth status
  - Add detailed error object logging (message, details, hint, code)
  - Add cart state logging on errors
  - Improve user-facing error messages
  - Ensure cart preservation on failure
  - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Test customer order creation flow
  - Test as anonymous user (no login)
  - Add items to cart
  - Fill customer info form with valid data
  - Submit order and verify success
  - Verify redirect to payment page
  - Verify order created in database with correct data
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 5. Test waiter-assisted order creation flow
  - Login as waiter user
  - Add items to cart
  - Fill customer info form
  - Submit order and verify success
  - Verify waiter_id is set correctly
  - Verify created_by_waiter flag is true
  - Verify status is "pending" not "pending_payment"
  - Verify redirect to menu page
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Test error scenarios
  - Test with invalid customer data (should show validation errors)
  - Test with empty cart (should show error message)
  - Test with network disconnected (should show connectivity error)
  - Verify cart is preserved in all error scenarios
  - Verify error logs contain all required information
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Deploy to production
  - Apply migration to production database via Supabase dashboard
  - Verify policies are applied correctly
  - Monitor error logs for any RLS policy errors
  - Test customer order creation in production
  - Test waiter order creation in production
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 8. Verify security restrictions
  - Attempt to UPDATE order as anonymous user (should fail)
  - Attempt to DELETE order as anonymous user (should fail)
  - Attempt to UPDATE order as authenticated non-staff user (should fail)
  - Verify admin can UPDATE orders
  - Verify admin can DELETE orders
  - Verify staff (cashier, kitchen) can UPDATE orders
  - _Requirements: 2.3, 2.4, 2.5_
