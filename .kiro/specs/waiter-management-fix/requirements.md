# Requirements Document

## Introduction

The Waiter Management Fix feature ensures that admin users can reliably create, list, and delete waiter accounts through a unified backend approach. Currently, the system has duplicate implementations using both Cloudflare Functions and Supabase Edge Functions, which creates confusion and potential inconsistencies. This spec will consolidate the implementation to use Supabase Edge Functions exclusively for better integration with Supabase Auth and proper admin authentication.

## Glossary

- **Admin_System**: The administrative interface for managing waiter accounts
- **Waiter_Management_API**: The backend API endpoints for waiter CRUD operations
- **Supabase_Edge_Functions**: Deno-based serverless functions running on Supabase infrastructure
- **Cloudflare_Functions**: JavaScript-based serverless functions running on Cloudflare Pages
- **Auth_System**: Supabase authentication system managing user accounts and roles
- **Frontend_Client**: React application making API calls to manage waiters

## Requirements

### Requirement 1

**User Story:** As an admin, I want to create new waiter accounts so that I can onboard staff members to the system.

#### Acceptance Criteria

1. WHEN an admin submits the create waiter form, THE Waiter_Management_API SHALL validate admin authentication
2. WHEN creating a waiter, THE Waiter_Management_API SHALL require email, password, and full_name fields
3. WHEN a waiter is created, THE Auth_System SHALL set both user_metadata.role and app_metadata.role to "waiter"
4. WHEN a waiter is created, THE Auth_System SHALL automatically confirm the email address
5. THE Waiter_Management_API SHALL return the new user ID upon successful creation

### Requirement 2

**User Story:** As an admin, I want to view a list of all waiter accounts so that I can see who has access to the waiter panel.

#### Acceptance Criteria

1. WHEN an admin accesses the waiter management page, THE Waiter_Management_API SHALL validate admin authentication
2. WHEN listing waiters, THE Waiter_Management_API SHALL retrieve all users with waiter role from Auth_System
3. WHEN displaying waiters, THE Frontend_Client SHALL show email, full name, and creation date
4. THE Waiter_Management_API SHALL filter users to only include those with role "waiter"
5. THE Frontend_Client SHALL display the total count of waiter accounts

### Requirement 3

**User Story:** As an admin, I want to delete waiter accounts so that I can remove staff members who no longer work at the restaurant.

#### Acceptance Criteria

1. WHEN an admin clicks delete, THE Frontend_Client SHALL prompt for confirmation
2. WHEN deletion is confirmed, THE Waiter_Management_API SHALL validate admin authentication
3. WHEN deleting a waiter, THE Auth_System SHALL permanently remove the user account
4. WHEN a waiter is deleted, THE Waiter_Management_API SHALL return success confirmation
5. THE Frontend_Client SHALL refresh the waiter list after successful deletion

### Requirement 4

**User Story:** As a developer, I want a single unified backend implementation so that the system is maintainable and consistent.

#### Acceptance Criteria

1. THE Admin_System SHALL use Supabase Edge Functions exclusively for waiter management
2. THE Waiter_Management_API SHALL NOT use Cloudflare Functions for waiter operations
3. WHEN making API calls, THE Frontend_Client SHALL use Supabase function invocation
4. THE Supabase_Edge_Functions SHALL use proper authentication with service role key
5. THE system SHALL have no duplicate or conflicting API endpoints

### Requirement 5

**User Story:** As an admin, I want proper error handling so that I understand what went wrong when operations fail.

#### Acceptance Criteria

1. WHEN authentication fails, THE Waiter_Management_API SHALL return a 401 Unauthorized error
2. WHEN a non-admin user attempts operations, THE Waiter_Management_API SHALL return a 403 Forbidden error
3. WHEN required fields are missing, THE Waiter_Management_API SHALL return a 400 Bad Request error with details
4. WHEN a duplicate email is used, THE Waiter_Management_API SHALL return a clear error message
5. THE Frontend_Client SHALL display user-friendly error messages for all error scenarios

### Requirement 6

**User Story:** As an admin, I want the waiter management interface to work reliably so that I can manage staff without technical issues.

#### Acceptance Criteria

1. WHEN the page loads, THE Frontend_Client SHALL display a loading state while fetching waiters
2. WHEN operations complete, THE Frontend_Client SHALL show success toast notifications
3. WHEN operations fail, THE Frontend_Client SHALL show error toast notifications with details
4. THE Frontend_Client SHALL disable action buttons during API operations to prevent duplicate requests
5. THE Frontend_Client SHALL automatically refresh the waiter list after create or delete operations
