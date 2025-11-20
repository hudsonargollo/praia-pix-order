# Requirements Document

## Introduction

This spec addresses two critical bugs in the order payment and kitchen workflow:
1. Duplicate WhatsApp notifications being sent when payment is confirmed
2. Kitchen receipts not printing automatically when orders enter preparation status

## Glossary

- **System**: The Coco Loko Açaiteria order management application
- **Cashier Panel**: The staff interface for managing orders and payments
- **Kitchen Panel**: The staff interface for managing food preparation
- **Payment Confirmation**: The process of marking an order as paid and sending it to the kitchen
- **Auto-Print**: The automatic printing of kitchen receipts when orders enter preparation
- **WhatsApp Notification**: Automated messages sent to customers via WhatsApp
- **Real-time Subscription**: Live database updates pushed to the frontend via Supabase

## Requirements

### Requirement 1: Single WhatsApp Notification on Payment Confirmation

**User Story:** As a customer, I want to receive exactly one WhatsApp notification when my payment is confirmed, so that I am not confused by duplicate messages.

#### Acceptance Criteria

1. WHEN a payment is confirmed via the Cashier panel, THE System SHALL send exactly one WhatsApp notification to the customer
2. WHEN a payment is confirmed via MercadoPago webhook, THE System SHALL send exactly one WhatsApp notification to the customer
3. WHEN a payment is confirmed manually by staff, THE System SHALL send exactly one WhatsApp notification to the customer
4. IF a payment confirmation fails, THEN THE System SHALL log the error without sending duplicate retry notifications
5. THE System SHALL track notification history to prevent duplicate sends within a 5-minute window

### Requirement 2: Reliable Kitchen Receipt Auto-Printing

**User Story:** As a kitchen staff member, I want kitchen receipts to print automatically when orders enter preparation, so that I don't miss any orders.

#### Acceptance Criteria

1. WHEN an order status changes to 'in_preparation', THE System SHALL automatically print a kitchen receipt if auto-print is enabled
2. WHEN an order is created directly in 'in_preparation' status (waiter orders), THE System SHALL automatically print a kitchen receipt if auto-print is enabled
3. WHILE auto-print is disabled, THE System SHALL NOT automatically print kitchen receipts
4. WHEN auto-print is toggled on, THE System SHALL persist the setting across browser sessions
5. IF a print fails, THEN THE System SHALL show an error notification without blocking the order workflow

### Requirement 3: Payment Confirmation Notification Deduplication

**User Story:** As a system administrator, I want to ensure that payment confirmations trigger notifications through a single, reliable path, so that the system is maintainable and predictable.

#### Acceptance Criteria

1. THE System SHALL use application-layer notification triggers exclusively for payment confirmations
2. THE System SHALL NOT use database triggers for sending WhatsApp notifications
3. WHEN payment is confirmed, THE System SHALL update the order status and trigger notifications in a single transaction
4. THE System SHALL log all notification attempts with timestamps and status
5. WHERE multiple payment confirmation sources exist (webhook, manual), THE System SHALL coordinate to prevent duplicates

### Requirement 4: Kitchen Panel Real-time Order Tracking

**User Story:** As a kitchen staff member, I want the kitchen panel to accurately track order status changes in real-time, so that auto-print triggers reliably.

#### Acceptance Criteria

1. WHEN the Kitchen panel loads, THE System SHALL initialize order status tracking for all visible orders
2. WHEN an order status changes via real-time subscription, THE System SHALL detect the transition from previous status to new status
3. WHEN an order is inserted with 'in_preparation' status, THE System SHALL treat it as a new order requiring printing
4. THE System SHALL maintain order status history in memory for transition detection
5. IF real-time connection is lost, THEN THE System SHALL show a connection status indicator and attempt reconnection
