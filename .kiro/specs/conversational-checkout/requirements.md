# Requirements Document

## Introduction

This feature replaces the existing checkout page with a conversational, multi-step checkout flow that guides customers through providing their information in a friendly, animated interface. The system will capture customer data (name and WhatsApp number) and persist it to the database for future marketing campaigns while maintaining the legacy checkout flow as a fallback option.

## Glossary

- **Checkout System**: The web application component responsible for collecting customer information and order confirmation before payment
- **Customer Database**: The Supabase PostgreSQL database table storing customer contact information
- **E.164 Format**: International telephone numbering standard (e.g., +5571987654321)
- **Legacy Checkout**: The existing checkout page component preserved at /checkout2 route
- **Conversational Flow**: The new multi-step checkout interface at /checkout route
- **Step Transition**: The animated change between different stages of the checkout process
- **Upsert Operation**: Database operation that inserts a new record or updates an existing one

## Requirements

### Requirement 1

**User Story:** As a customer, I want to be guided step-by-step when providing my information so the checkout process feels easy and fast.

#### Acceptance Criteria

1. THE Checkout System SHALL display exactly four sequential steps: Name input, WhatsApp input, Confirmation message, and Order review
2. WHEN the customer completes the Name input step, THE Checkout System SHALL advance to the WhatsApp input step
3. WHEN the customer completes the WhatsApp input step, THE Checkout System SHALL advance to the Confirmation message step
4. WHEN the Confirmation message step displays for 1.5 seconds, THE Checkout System SHALL automatically advance to the Order review step
5. THE Checkout System SHALL use conversational language in all prompts and messages

### Requirement 2

**User Story:** As a customer, I want to see smooth animations between steps so the experience feels modern and polished.

#### Acceptance Criteria

1. WHEN transitioning between any two steps, THE Checkout System SHALL display a fade and slide animation with a duration between 200 and 400 milliseconds
2. THE Checkout System SHALL use the framer-motion library for all step transition animations
3. THE Checkout System SHALL ensure animations complete before accepting new user input

### Requirement 3

**User Story:** As a customer, I want to see a clear summary of my order after providing my details so I can verify everything is correct before payment.

#### Acceptance Criteria

1. WHEN the Order review step displays, THE Checkout System SHALL show all cart items with their names, quantities, and individual prices
2. WHEN the Order review step displays, THE Checkout System SHALL show the total order amount
3. WHEN the Order review step displays, THE Checkout System SHALL display the customer name collected in step one
4. THE Checkout System SHALL provide an "Edit Order" button that navigates to the /menu route
5. THE Checkout System SHALL provide a "Proceed to Payment" button that initiates the payment flow

### Requirement 4

**User Story:** As the business owner, I want customer contact information saved to the database so I can use it for future marketing campaigns via WhatsApp.

#### Acceptance Criteria

1. WHEN the customer clicks "Proceed to Payment" in the Order review step, THE Checkout System SHALL normalize the WhatsApp number to E.164 format
2. WHEN the WhatsApp number normalization succeeds, THE Checkout System SHALL execute an upsert operation on the Customer Database using the normalized phone number as the primary key
3. WHEN executing the upsert operation, THE Checkout System SHALL store the customer name, normalized phone number, and current timestamp
4. IF the WhatsApp number normalization fails, THEN THE Checkout System SHALL display an error message and prevent navigation to payment
5. IF the database upsert operation fails, THEN THE Checkout System SHALL display an error message and prevent navigation to payment
6. WHEN the database upsert operation succeeds, THE Checkout System SHALL navigate to the /payment route

### Requirement 5

**User Story:** As a developer, I want the old checkout preserved at a different route so I don't break existing functionality during development.

#### Acceptance Criteria

1. THE Checkout System SHALL preserve the existing checkout component by renaming it to CheckoutLegacy
2. THE Checkout System SHALL make the Legacy Checkout accessible at the /checkout2 route
3. THE Checkout System SHALL make the Conversational Flow accessible at the /checkout route
4. THE Checkout System SHALL ensure the Legacy Checkout at /checkout2 functions identically to the original /checkout implementation

### Requirement 6

**User Story:** As a customer, I want clear validation feedback if I enter invalid information so I know what to correct.

#### Acceptance Criteria

1. WHEN the customer enters a name with fewer than 2 characters, THE Checkout System SHALL display a validation error message and prevent advancement to the next step
2. WHEN the customer enters a WhatsApp number that cannot be normalized to E.164 format, THE Checkout System SHALL display a validation error message and prevent advancement to the next step
3. THE Checkout System SHALL display validation error messages for a minimum of 3 seconds
4. THE Checkout System SHALL use red color styling for validation error messages
