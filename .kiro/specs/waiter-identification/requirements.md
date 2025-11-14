# Requirements Document

## Introduction

The Waiter Identification System enables unique, human-readable identification of waiters within the order management system. This feature ensures that all orders are properly attributed to the waiter who created them using a unique display name, providing clear accountability and performance tracking across the application.

## Glossary

- **Waiter_Auth_System**: The authentication and authorization system that manages waiter login and session management
- **Profile_Management_System**: The system that manages user profiles including display names and identification
- **Order_Attribution_System**: The system that links orders to the waiter who created them
- **Display_Name_Registry**: The database constraint and validation system that ensures display name uniqueness
- **First_Login_Flow**: The onboarding process that prompts new waiters to set their unique display name
- **Admin_Display_System**: The system that shows waiter identification in admin interfaces

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want orders to be linked to the waiter who created them, so that I can track performance and accountability.

#### Acceptance Criteria

1. THE Order_Attribution_System SHALL store a waiter_id reference for each order created by a waiter
2. WHEN a waiter creates an order, THE Order_Attribution_System SHALL automatically populate the waiter_id field with the authenticated user's ID
3. THE Order_Attribution_System SHALL maintain referential integrity between orders and waiter profiles
4. WHEN a waiter profile is deleted, THE Order_Attribution_System SHALL preserve historical order data by setting waiter_id to NULL
5. THE Order_Attribution_System SHALL create a database index on waiter_id for efficient query performance

### Requirement 2

**User Story:** As a waiter logging in for the first time, I want to be required to create a unique Display Name so that I can be identified in the system.

#### Acceptance Criteria

1. WHEN a waiter user logs in for the first time, THE Waiter_Auth_System SHALL detect that has_set_display_name is false
2. WHEN the first login condition is detected, THE Waiter_Auth_System SHALL redirect the waiter to the display name setup screen
3. WHEN a waiter is on the setup screen, THE Waiter_Auth_System SHALL prevent access to other waiter routes until setup is complete
4. THE First_Login_Flow SHALL display clear instructions explaining the purpose of the display name
5. THE First_Login_Flow SHALL require the waiter to complete setup before accessing the dashboard

### Requirement 3

**User Story:** As a waiter creating my Display Name, I want the system to validate uniqueness so that I can choose a name that isn't already taken.

#### Acceptance Criteria

1. WHEN a waiter submits a display name, THE Display_Name_Registry SHALL check for existing names in the database
2. IF the display name already exists, THEN THE Profile_Management_System SHALL return a unique constraint violation error
3. WHEN a uniqueness error occurs, THE First_Login_Flow SHALL display the message "Esse nome já está em uso. Por favor, escolha outro."
4. WHEN a waiter enters an empty or whitespace-only name, THE Profile_Management_System SHALL reject the submission with an appropriate error
5. THE Display_Name_Registry SHALL enforce uniqueness at the database level using a unique constraint

### Requirement 4

**User Story:** As a waiter, when I place a new order, I want the order to be automatically tagged with my ID so that my display name can be shown on it.

#### Acceptance Criteria

1. WHEN a waiter creates an order, THE Order_Attribution_System SHALL retrieve the authenticated user's ID from the session
2. WHEN inserting the order record, THE Order_Attribution_System SHALL include the waiter_id in the database insert operation
3. THE Order_Attribution_System SHALL validate that the waiter_id corresponds to a valid waiter profile
4. WHEN an order is created without authentication, THE Order_Attribution_System SHALL allow waiter_id to be NULL for customer self-service orders
5. THE Order_Attribution_System SHALL maintain the waiter_id association throughout the order lifecycle

### Requirement 5

**User Story:** As a waiter who has already set my Display Name, I want to log in and go directly to my dashboard without repeating the setup process.

#### Acceptance Criteria

1. WHEN a waiter with has_set_display_name set to true logs in, THE Waiter_Auth_System SHALL redirect directly to the waiter dashboard
2. THE Waiter_Auth_System SHALL query the profiles table to check the has_set_display_name flag during authentication
3. WHEN the setup check passes, THE Waiter_Auth_System SHALL skip the setup screen entirely
4. THE Waiter_Auth_System SHALL cache the setup status to avoid repeated database queries during the session
5. WHEN a waiter attempts to access the setup screen after completing setup, THE Waiter_Auth_System SHALL redirect to the dashboard

### Requirement 6

**User Story:** As an admin viewing orders, I want to see the waiter's display name associated with each order, so that I can identify who created it without seeing their email.

#### Acceptance Criteria

1. WHEN an admin queries orders, THE Admin_Display_System SHALL join the orders table with the profiles table using waiter_id
2. WHEN displaying order information, THE Admin_Display_System SHALL show the waiter's display_name field
3. WHERE an order has no waiter_id, THE Admin_Display_System SHALL display "Customer Order" or similar indicator
4. THE Admin_Display_System SHALL display the waiter name in all relevant interfaces including order lists, details, and reports
5. WHEN filtering or searching orders, THE Admin_Display_System SHALL allow filtering by waiter display name

### Requirement 7

**User Story:** As a kitchen staff member, I want to see which waiter created each order so that I can coordinate with them if there are questions.

#### Acceptance Criteria

1. WHEN the kitchen interface displays orders, THE Admin_Display_System SHALL include the waiter's display_name for waiter-created orders
2. THE Admin_Display_System SHALL clearly distinguish between waiter-created orders and customer self-service orders
3. WHEN displaying order details in the kitchen view, THE Admin_Display_System SHALL show the waiter name prominently
4. THE Admin_Display_System SHALL maintain consistent waiter name display across all order views
5. WHERE an order has notes from a waiter, THE Admin_Display_System SHALL show both the notes and the waiter's name

### Requirement 8

**User Story:** As a system administrator, I want the display name setup to be secure and validated, so that only authenticated waiters can set their names.

#### Acceptance Criteria

1. THE Profile_Management_System SHALL implement the set_waiter_display_name function with SECURITY DEFINER privileges
2. WHEN the function is called, THE Profile_Management_System SHALL verify the caller is authenticated using auth.uid()
3. WHEN updating the profile, THE Profile_Management_System SHALL verify the user's role is 'waiter'
4. THE Profile_Management_System SHALL trim whitespace from display names before storage
5. THE Profile_Management_System SHALL update the updated_at timestamp when setting the display name
