# Implementation Plan

- [x] 1. Create database schema and migration
  - Create migration file with `whatsapp_chat_messages` table
  - Define `message_direction` enum ('inbound', 'outbound')
  - Define `message_status` enum ('pending', 'sent', 'delivered', 'read', 'failed')
  - Create indexes for phone_number, order_id, and created_at
  - Set up Row Level Security policies for staff, service role, and webhook access
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Implement webhook endpoint for incoming messages
  - Create Cloudflare Function at `functions/api/whatsapp/webhook.ts`
  - Parse Evolution API webhook payload structure
  - Extract phone number from remoteJid and normalize (remove non-digits)
  - Extract message content from conversation or extendedTextMessage
  - Implement intelligent order association logic
  - Query active orders by normalized phone number
  - Select most recently created order if multiple matches
  - Only insert message if active order is found (ignore messages without active orders)
  - Handle errors gracefully with appropriate HTTP status codes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.6_

- [x] 3. Create useOrderChat hook for message management
  - Create hook file at `src/hooks/useOrderChat.ts`
  - Define UnifiedMessage interface for merged message display
  - Fetch whatsapp_notifications for the order and map to unified format
  - Fetch whatsapp_chat_messages for the order and map to unified format
  - Merge and sort messages chronologically by timestamp
  - Set up Supabase real-time subscription for new chat messages
  - Implement cleanup on unmount to unsubscribe from channel
  - Create sendMessage function that calls evolutionClient.sendTextMessage() and inserts to database
  - Handle loading and error states
  - Track unread message count for badge display
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.3_

- [x] 4. Build OrderChatPanel UI component
  - xCreate component file at `src/components/OrderChatPanel.tsx`
  - Implement message list with visual distinction for message types
  - Style system messages (centered, gray, italicized)
  - Style customer messages (left-aligned, white background)
  - Style staff messages (right-aligned, purple background)
  - Display timestamps for each message
  - Show message status indicators (sent, delivered, read, failed)
  - Implement auto-scroll to bottom on new messages
  - Add audio notification sound file to assets
  - Play audio notification when new inbound message arrives
  - Create text input field with send button
  - Handle message submission with loading state
  - Display error states with retry options
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.4, 4.1, 4.2, 4.4_

- [x] 5. Integrate chat panel into OrderEditDialog
  - Modify `src/components/OrderEditDialog.tsx` to include OrderChatPanel
  - Add chat section below order items section
  - Pass orderId and customerPhone props to OrderChatPanel
  - Ensure dialog layout accommodates chat interface with proper scrolling
  - Test chat panel visibility and functionality within order context
  - _Requirements: 1.1, 4.1_

- [x] 6. Add unread message indicator to order cards
  - Modify `src/components/CompactOrderCard.tsx` to show badge
  - Query for unread inbound messages for each order
  - Display visual indicator (badge/icon) when unread messages exist
  - Update indicator in real-time when new messages arrive
  - Clear indicator when order is opened and messages viewed
  - _Requirements: 3.3_

- [x] 7. Configure Evolution API webhook URL
  - Document webhook URL format in deployment guide
  - Add instructions for configuring webhook in Evolution API settings
  - Test webhook delivery from Evolution API to Cloudflare Function
  - Verify payload structure matches expected format
  - _Requirements: 5.1, 8.1, 8.2, 8.3_

- [x] 8. End-to-end testing and validation
  - Test inbound message flow: Customer sends → Appears in admin UI with audio notification
  - Test outbound message flow: Staff sends → Customer receives on WhatsApp
  - Test order association with various phone number formats
  - Test multiple active orders scenario (most recent selected)
  - Test no active orders scenario (message ignored, not stored)
  - Test completed order scenario (message ignored after order completion)
  - Test real-time updates across multiple browser tabs
  - Verify audio notification plays only for inbound messages
  - Verify message status updates (sent, delivered, read)
  - Test error handling for failed message sends
  - _Requirements: All requirements_
