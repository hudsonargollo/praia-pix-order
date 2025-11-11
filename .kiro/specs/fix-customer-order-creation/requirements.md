# Requirements Document

## Introduction

Customers are unable to create orders through the menu/checkout flow. This appears to be a database RLS (Row Level Security) policy issue preventing anonymous or authenticated non-staff users from inserting orders and order items into the database. The system needs to allow customers to create orders while maintaining security for other operations.

## Glossary

- **Customer**: An anonymous or authenticated user who is not a waiter, cashier, or admin
- **Order System**: The database tables (orders, order_items) and their RLS policies
- **RLS Policy**: Row Level Security policy that controls database access
- **Checkout Flow**: The process from Menu → Checkout → Payment where customers create orders

## Requirements

### Requirement 1: Customer Order Creation

**User Story:** As a customer, I want to create orders through the menu, so that I can purchase items from the açaí shop

#### Acceptance Criteria

1. WHEN a customer completes the checkout form with valid data, THE Order System SHALL create a new order record in the database
2. WHEN a customer's order is created, THE Order System SHALL create corresponding order_items records for each cart item
3. WHEN a customer attempts to create an order, THE Order System SHALL NOT require authentication or specific user roles
4. WHEN an order creation fails due to RLS policies, THE Order System SHALL log detailed error information for debugging
5. WHEN order creation succeeds, THE Order System SHALL redirect the customer to the payment page

### Requirement 2: Database Security

**User Story:** As a system administrator, I want to maintain security on order operations, so that only authorized actions are permitted

#### Acceptance Criteria

1. THE Order System SHALL allow INSERT operations on orders table for all users (authenticated and anonymous)
2. THE Order System SHALL allow INSERT operations on order_items table for all users (authenticated and anonymous)
3. THE Order System SHALL restrict UPDATE operations on orders to staff members (admin, cashier, kitchen) only
4. THE Order System SHALL restrict DELETE operations on orders to admin users only
5. THE Order System SHALL allow SELECT operations on orders for customers to view their own orders by phone number

### Requirement 3: Waiter-Assisted Orders

**User Story:** As a waiter, I want to create orders on behalf of customers, so that I can assist customers who prefer in-person ordering

#### Acceptance Criteria

1. WHEN a waiter creates an order, THE Order System SHALL set the waiter_id field to the waiter's user ID
2. WHEN a waiter creates an order, THE Order System SHALL set the initial status to "pending" instead of "pending_payment"
3. WHEN a waiter creates an order, THE Order System SHALL set the created_by_waiter flag to true
4. WHEN a waiter completes order creation, THE Order System SHALL redirect to the menu for the next order

### Requirement 4: Error Handling and Diagnostics

**User Story:** As a developer, I want detailed error logging for order creation failures, so that I can quickly diagnose and fix issues

#### Acceptance Criteria

1. WHEN an order creation fails, THE Order System SHALL log the complete error object to the console
2. WHEN an RLS policy blocks an operation, THE Order System SHALL display a user-friendly error message
3. WHEN database operations fail, THE Order System SHALL preserve the cart contents so customers can retry
4. THE Order System SHALL include the user's authentication status in error logs
5. THE Order System SHALL include the attempted operation details in error logs
