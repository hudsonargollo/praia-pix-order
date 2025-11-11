# Implementation Plan

- [ ] 1. Audit and enhance Supabase Edge Functions
  - [x] 1.1 Review and test create-waiter Edge Function
    - Verify authentication and admin role checking logic
    - Ensure proper error handling for duplicate emails
    - Add detailed console logging for debugging
    - Test locally with Supabase CLI
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.3, 5.4_

  - [x] 1.2 Review and test list-waiters Edge Function
    - Verify authentication and admin role checking logic
    - Ensure proper filtering of waiter role users
    - Confirm response format matches frontend expectations
    - Test locally with Supabase CLI
    - _Requirements: 2.1, 2.2, 2.4, 5.1, 5.2_

  - [x] 1.3 Review and test delete-waiter Edge Function
    - Verify authentication and admin role checking logic
    - Ensure proper error handling for invalid waiter IDs
    - Add confirmation that user is deleted from Auth system
    - Test locally with Supabase CLI
    - _Requirements: 3.2, 3.3, 3.4, 5.1, 5.2_

- [x] 2. Update AdminWaiters frontend component
  - [x] 2.1 Replace Cloudflare Function calls with Supabase client
    - Import Supabase client and get current session
    - Replace fetch('/api/admin/create-waiter') with supabase.functions.invoke('create-waiter')
    - Replace fetch('/api/admin/list-waiters') with supabase.functions.invoke('list-waiters')
    - Replace fetch('/api/admin/delete-waiter') with supabase.functions.invoke('delete-waiter')
    - Pass Authorization header with session token in all function calls
    - _Requirements: 4.1, 4.3, 6.1_

  - [x] 2.2 Update error handling for Supabase function responses
    - Handle 401 Unauthorized errors with redirect to login
    - Handle 403 Forbidden errors with appropriate user message
    - Handle 400 Bad Request errors with field-specific messages
    - Handle 500 Internal Server errors with generic error message
    - Update toast notifications to show user-friendly Portuguese messages
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.3_

  - [x] 2.3 Improve loading and success states
    - Ensure loading state displays while fetching waiters
    - Disable form submit button during create operation
    - Disable delete buttons during delete operation
    - Show success toast after successful create
    - Show success toast after successful delete
    - Automatically refresh waiter list after create or delete
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 3. Deploy Supabase Edge Functions
  - [x] 3.1 Deploy Edge Functions to Supabase project
    - Deploy create-waiter function using Supabase CLI
    - Deploy list-waiters function using Supabase CLI
    - Deploy delete-waiter function using Supabase CLI
    - Verify functions are accessible in Supabase dashboard
    - _Requirements: 4.1, 4.4_

  - [x] 3.2 Test deployed Edge Functions
    - Test create-waiter with valid admin session
    - Test list-waiters with valid admin session
    - Test delete-waiter with valid admin session
    - Verify authentication errors for non-admin users
    - Verify error handling for invalid inputs
    - _Requirements: 1.1, 2.1, 3.2, 5.1, 5.2, 5.3_

- [x] 4. Remove Cloudflare Functions implementation
  - [x] 4.1 Delete Cloudflare Function files
    - Delete functions/api/admin/create-waiter.js
    - Delete functions/api/admin/list-waiters.js
    - Delete functions/api/admin/delete-waiter.js
    - Delete functions/api/admin/test-env.js if no longer needed
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 4.2 Verify no remaining references to Cloudflare Functions
    - Search codebase for '/api/admin/create-waiter' references
    - Search codebase for '/api/admin/list-waiters' references
    - Search codebase for '/api/admin/delete-waiter' references
    - Remove any documentation referencing Cloudflare Functions for waiter management
    - _Requirements: 4.2, 4.5_

- [x] 5. Build and deploy frontend changes
  - [x] 5.1 Test frontend locally with updated code
    - Start local development server
    - Test create waiter flow with valid data
    - Test create waiter flow with duplicate email
    - Test list waiters display
    - Test delete waiter flow
    - Verify all error messages display correctly
    - _Requirements: 1.1, 2.1, 3.1, 5.5, 6.1, 6.2, 6.3_

  - [x] 5.2 Build and deploy to production
    - Run production build command
    - Verify build completes without errors
    - Deploy to Cloudflare Pages
    - Test production deployment with real admin account
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. End-to-end testing and validation
  - [x] 6.1 Test complete waiter management workflow
    - Login as admin user
    - Navigate to waiter management page
    - Create a new waiter account
    - Verify waiter appears in list
    - Delete the test waiter account
    - Verify waiter is removed from list
    - _Requirements: 1.1, 1.5, 2.1, 2.3, 2.5, 3.1, 3.4, 3.5, 6.5_

  - [x] 6.2 Test error scenarios
    - Attempt to create waiter with duplicate email
    - Attempt to create waiter with invalid email format
    - Attempt to create waiter with missing fields
    - Verify appropriate error messages display
    - _Requirements: 5.3, 5.4, 5.5, 6.3_

  - [x] 6.3 Test authentication and authorization
    - Verify non-admin users cannot access waiter management
    - Test with expired session token
    - Verify proper redirect to login when unauthorized
    - _Requirements: 5.1, 5.2_
