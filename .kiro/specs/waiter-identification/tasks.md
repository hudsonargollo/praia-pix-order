# Implementation Tasks - Waiter Identification System

## Database Tasks

- [x] 1. Create database migration for display name fields
  - Add `display_name` TEXT column to profiles table
  - Add `has_set_display_name` BOOLEAN column (default false)
  - Create unique index on display_name for waiters
  - _Requirements: 1.1, 1.5, 3.5_

- [x] 2. Create database function for setting display name
  - Implement `set_waiter_display_name(p_display_name TEXT)` function
  - Add authentication and role validation
  - Add display name validation (trim, non-empty)
  - Set SECURITY DEFINER for proper permissions
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

## Component Tasks

- [x] 3. Create WaiterSetup page component
  - Build setup screen UI with instructions
  - Create display name input form
  - Add form validation (required, non-empty)
  - Implement submit handler with error handling
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 4. Create WaiterDisplayNameForm component
  - Build reusable form component (integrated into WaiterSetup)
  - Add real-time validation feedback
  - Handle uniqueness errors gracefully
  - Show loading state during submission
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Update WaiterDashboard with setup check
  - Check `has_set_display_name` on mount
  - Redirect to setup if false
  - Use display_name in header
  - Cache setup status in session
  - _Requirements: 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 5.5_

## Utility Tasks

- [x] 6. Update waiterUtils.ts for display names
  - Modify `getWaiterName()` to prefer display_name
  - Add fallback chain: display_name → full_name → email
  - Update type definitions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

## Integration Tasks

- [x] 7. Update routing for setup flow
  - Add `/waiter/setup` route
  - Add protected route wrapper
  - Prevent access to setup after completion
  - _Requirements: 2.2, 2.3, 5.5_

- [x] 8. Update Supabase types
  - Add display_name to Profile type
  - Add has_set_display_name to Profile type
  - Add set_waiter_display_name function type
  - _Requirements: 1.1_

## Testing Tasks

- [ ] 9. Write unit tests for display name validation
  - Test empty name rejection
  - Test whitespace trimming
  - Test uniqueness validation
  - Test error message display
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10. Write integration tests for setup flow
  - Test first login redirect to setup
  - Test setup completion and redirect
  - Test subsequent login skips setup
  - Test setup screen access prevention after completion
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Write integration tests for display name usage
  - Test display name shown in orders
  - Test display name in kitchen view
  - Test display name in cashier view
  - Test display name in admin reports
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

## Documentation Tasks

- [ ] 12. Update documentation
  - Add display name setup to waiter guide
  - Update database schema documentation
  - Add troubleshooting section
  - _Requirements: All_
