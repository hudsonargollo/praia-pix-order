# Requirements Document

## Introduction

This feature enables a two-way WhatsApp chat interface embedded directly within the Order Details view of the admin dashboard. It bridges the gap between automated system notifications and human customer support by allowing staff to view incoming customer messages and reply immediately without leaving the order context.

## Glossary

- **System**: The Coco Loko Açaiteria ordering and payment platform
- **Admin Dashboard**: The web interface used by staff to manage orders and customer interactions
- **Evolution API**: The third-party WhatsApp API service used for sending and receiving messages
- **Order Details View**: The modal/panel that displays comprehensive information about a specific order
- **Active Order**: An order with status that is NOT 'completed' or 'cancelled'
- **System Notification**: Automated messages sent by the system (e.g., "Order Accepted", "Ready for Pickup")
- **Chat Message**: Manual messages exchanged between staff and customers
- **Unified Timeline**: A chronological display combining both system notifications and chat messages
- **Context Association**: The process of linking incoming WhatsApp messages to specific orders

## Requirements

### Requirement 1

**User Story:** As a staff member, I want to see all communication with a customer in one place, so that I have complete context when responding to inquiries.

#### Acceptance Criteria

1. WHEN viewing an order in the Order Details View, THE System SHALL display a unified timeline containing both system notifications and chat messages
2. THE System SHALL sort all messages chronologically by creation timestamp
3. THE System SHALL visually distinguish system notifications from chat messages using centered, gray, italicized styling
4. THE System SHALL display customer messages aligned to the left side of the timeline
5. THE System SHALL display staff messages aligned to the right side of the timeline

### Requirement 2

**User Story:** As a staff member, I want incoming WhatsApp messages to automatically link to the correct order, so that I don't have to manually search for context.

#### Acceptance Criteria

1. WHEN a WhatsApp message arrives from a customer, THE System SHALL extract and normalize the phone number by removing all non-digit characters
2. THE System SHALL query the orders table for records where customer_phone matches the normalized sender phone number
3. THE System SHALL filter results to include only Active Orders
4. WHERE multiple orders match the phone number, THE System SHALL associate the message with the most recently created order
5. IF no active order matches, THEN THE System SHALL store the message with a null order_id for future reference

### Requirement 3

**User Story:** As a staff member, I want to see new messages appear instantly, so that I can respond to customers in real-time.

#### Acceptance Criteria

1. WHEN a new chat message is inserted into the database, THE System SHALL broadcast a real-time event to subscribed clients
2. THE System SHALL update the chat timeline immediately upon receiving a real-time event without requiring page refresh
3. WHEN an order has unread incoming messages, THE System SHALL display a visual indicator (badge or icon) on the Order Card in the dashboard
4. THE System SHALL maintain real-time subscription while the Order Details View is open
5. THE System SHALL clean up subscriptions when the Order Details View is closed

### Requirement 4

**User Story:** As a staff member, I want to send replies directly from the order view, so that I can quickly address customer questions.

#### Acceptance Criteria

1. THE System SHALL provide a text input field and send button within the Order Details View
2. WHEN staff submits a message, THE System SHALL send the message via the Evolution API to the customer's WhatsApp number
3. THE System SHALL insert the outbound message into the whatsapp_chat_messages table with direction 'outbound'
4. THE System SHALL display the sent message in the timeline immediately after submission
5. THE System SHALL indicate message delivery status (pending, sent, delivered, read, failed)

### Requirement 5

**User Story:** As a system administrator, I want incoming messages to be securely processed, so that only legitimate WhatsApp messages are stored.

#### Acceptance Criteria

1. THE System SHALL expose a webhook endpoint at /api/whatsapp/webhook for receiving Evolution API events
2. THE System SHALL validate that incoming webhook requests contain the expected payload structure
3. THE System SHALL ignore outbound messages (fromMe: true) to prevent duplicate entries
4. THE System SHALL filter webhook events to process only 'messages.upsert' type events
5. THE System SHALL handle webhook errors gracefully and return appropriate HTTP status codes

### Requirement 6

**User Story:** As a developer, I want chat messages stored separately from system notifications, so that the data model remains clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL store chat messages in a dedicated whatsapp_chat_messages table
2. THE System SHALL maintain the existing whatsapp_notifications table for automated system messages
3. THE System SHALL define message_direction enum with values 'inbound' and 'outbound'
4. THE System SHALL define message_status enum with values 'pending', 'sent', 'delivered', 'read', 'failed'
5. THE System SHALL create indexes on phone_number, order_id, and created_at columns for query performance

### Requirement 7

**User Story:** As a staff member, I want to access chat history for any order, so that I can review past conversations with customers.

#### Acceptance Criteria

1. THE System SHALL enforce Row Level Security (RLS) policies on the whatsapp_chat_messages table
2. THE System SHALL allow authenticated staff users to read all chat messages
3. THE System SHALL allow authenticated staff users to insert outbound messages
4. THE System SHALL allow the service role full access for webhook operations
5. THE System SHALL allow anonymous webhook inserts with proper validation

### Requirement 8

**User Story:** As a staff member, I want to reuse the existing WhatsApp integration, so that I don't need to configure additional services.

#### Acceptance Criteria

1. THE System SHALL use the existing Evolution API instance configured in evolution-client.ts
2. THE System SHALL use the existing Evolution API credentials from environment variables
3. THE System SHALL leverage the existing sendTextMessage function for outbound messages
4. THE System SHALL maintain compatibility with existing WhatsApp notification functionality
5. THE System SHALL not require additional Evolution API configuration or setup
