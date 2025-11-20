# Design Document

## Overview

The WhatsApp Conversational UI feature adds two-way chat capabilities to the existing order management system. It enables staff to view incoming customer messages and respond directly from the Order Details view, creating a seamless support experience without leaving the order context.

The design leverages the existing Evolution API integration and Supabase real-time infrastructure to provide instant message delivery and updates. The solution introduces a new database table for chat messages while preserving the existing `whatsapp_notifications` table for automated system messages.

## Architecture

### High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Customer   │◄───────►│ Evolution API│◄───────►│  Cloudflare │
│  WhatsApp   │         │   (External) │         │   Function  │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Supabase   │
                                                  │  Database   │
                                                  └──────┬──────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │   Admin     │
                                                  │  Frontend   │
                                                  └─────────────┘
```

### Data Flow

**Inbound Messages (Customer → Staff):**
1. Customer sends WhatsApp message
2. Evolution API receives message and triggers webhook
3. Cloudflare Function (`/api/whatsapp/webhook`) processes payload
4. Function queries Supabase to find matching active order by phone
5. Function inserts message into `whatsapp_chat_messages` table
6. Supabase broadcasts real-time event to subscribed clients
7. Admin frontend receives event and updates UI

**Outbound Messages (Staff → Customer):**
1. Staff types message in Order Details chat panel
2. Frontend calls Evolution API via existing `evolutionClient.sendTextMessage()`
3. Frontend inserts outbound message into `whatsapp_chat_messages` table
4. Evolution API delivers message to customer's WhatsApp
5. UI updates immediately with sent message

## Components and Interfaces

### 1. Database Layer

#### New Table: `whatsapp_chat_messages`

```sql
CREATE TABLE whatsapp_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  direction message_direction NOT NULL,  -- 'inbound' | 'outbound'
  content TEXT NOT NULL,
  status message_status DEFAULT 'sent',  -- 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  evolution_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_phone ON whatsapp_chat_messages(phone_number);
CREATE INDEX idx_chat_order ON whatsapp_chat_messages(order_id);
CREATE INDEX idx_chat_created_at ON whatsapp_chat_messages(created_at);
```

#### Row Level Security Policies

- **Staff read access**: Authenticated users can read all chat messages
- **Staff send access**: Authenticated users can insert outbound messages
- **Service role access**: Full access for backend operations
- **Webhook access**: Anonymous inserts allowed (validated by webhook logic)

### 2. Backend Layer

#### Cloudflare Function: `/api/whatsapp/webhook`

**Location:** `functions/api/whatsapp/webhook.ts`

**Purpose:** Receives incoming WhatsApp messages from Evolution API and associates them with orders

**Key Logic:**
```typescript
interface WebhookPayload {
  type: string;
  data: {
    key: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
  };
}

// Intelligent Context Association Algorithm:
// 1. Extract phone number from remoteJid (e.g., "5573999988888@s.whatsapp.net")
// 2. Normalize by removing non-digits
// 3. Query orders table for active orders with matching customer_phone
// 4. If multiple matches, select most recently created order
// 5. If no match, ignore message (do not store)
// 6. Only store messages that have an associated active order
```

**Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Frontend Layer

#### Hook: `useOrderChat`

**Location:** `src/hooks/useOrderChat.ts`

**Purpose:** Manages chat state, fetches messages, and handles real-time updates

**Interface:**
```typescript
interface UnifiedMessage {
  id: string;
  type: 'system' | 'chat';
  direction: 'inbound' | 'outbound' | 'system';
  content: string;
  timestamp: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface UseOrderChatReturn {
  messages: UnifiedMessage[];
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  hasUnreadMessages: boolean;
}

function useOrderChat(orderId: string): UseOrderChatReturn;
```

**Implementation Details:**
- Fetches `whatsapp_notifications` and maps to unified format
- Fetches `whatsapp_chat_messages` and maps to unified format
- Merges arrays and sorts by timestamp
- Subscribes to Supabase real-time channel for `whatsapp_chat_messages` inserts
- Provides `sendMessage` function that:
  1. Calls `evolutionClient.sendTextMessage()`
  2. Inserts record into `whatsapp_chat_messages`
  3. Updates local state optimistically

#### Component: `OrderChatPanel`

**Location:** `src/components/OrderChatPanel.tsx`

**Purpose:** Renders the chat interface within Order Details view

**Visual Design:**
```
┌─────────────────────────────────────┐
│  💬 Conversa com Cliente            │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────┐            │  ← System notification
│  │ Pedido Aceito ✓     │            │    (centered, gray)
│  └─────────────────────┘            │
│                                     │
│  ┌──────────────────┐               │  ← Customer message
│  │ Quanto tempo?    │               │    (left, white bg)
│  └──────────────────┘               │
│  10:23                              │
│                                     │
│               ┌──────────────────┐  │  ← Staff reply
│               │ 15 minutos! 😊   │  │    (right, purple bg)
│               └──────────────────┘  │
│               10:24                 │
│                                     │
├─────────────────────────────────────┤
│  [Digite sua mensagem...    ] [📤] │  ← Input + Send button
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface OrderChatPanelProps {
  orderId: string;
  customerPhone: string;
}
```

**Features:**
- Auto-scroll to bottom on new messages
- Visual distinction between message types
- Timestamp display
- Message status indicators (sent, delivered, read)
- Audio notification on new inbound messages
- Loading states
- Error handling

#### Integration Point: `OrderEditDialog`

**Modification:** Add `OrderChatPanel` component to existing dialog

**Location:** Update `src/components/OrderEditDialog.tsx`

**Approach:** Add a new tab or section within the dialog to display chat alongside order details

### 4. Evolution API Integration

**Existing Client:** `src/integrations/whatsapp/evolution-client.ts`

**Reuse Strategy:**
- Use existing `EvolutionAPIClient` class
- Leverage `sendTextMessage()` method for outbound messages
- Use existing environment variables:
  - `VITE_EVOLUTION_API_URL`
  - `VITE_EVOLUTION_API_KEY`
  - `VITE_EVOLUTION_INSTANCE_NAME`

**No Changes Required:** The existing client already provides all necessary functionality

## Data Models

### Unified Message Model

The frontend uses a unified message model to display both system notifications and chat messages in a single timeline:

```typescript
interface UnifiedMessage {
  id: string;
  type: 'system' | 'chat';
  direction: 'inbound' | 'outbound' | 'system';
  content: string;
  timestamp: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  notificationType?: string;  // For system messages
}
```

### Mapping Logic

**From `whatsapp_notifications`:**
```typescript
{
  id: notification.id,
  type: 'system',
  direction: 'system',
  content: notification.message_body,
  timestamp: notification.created_at,
  notificationType: notification.notification_type
}
```

**From `whatsapp_chat_messages`:**
```typescript
{
  id: message.id,
  type: 'chat',
  direction: message.direction,
  content: message.content,
  timestamp: message.created_at,
  status: message.status
}
```

## Error Handling

### Webhook Errors

**Scenarios:**
- Invalid payload structure
- Missing phone number
- Database connection failure
- Order lookup failure
- No active order found for phone number

**Strategy:**
- Return 200 OK for ignorable events (outbound messages, non-message events, no active order)
- Return 400 Bad Request for invalid payloads
- Return 500 Internal Server Error for system failures
- Log all events for debugging
- Do not store messages if no active order is found (only listen to customers with active orders)

### Frontend Errors

**Scenarios:**
- Failed to send message via Evolution API
- Failed to insert message into database
- Real-time subscription disconnection
- Failed to load message history

**Strategy:**
- Display toast notifications for user-facing errors
- Retry logic for transient failures (network issues)
- Fallback to polling if real-time subscription fails
- Show error states in UI with retry buttons
- Optimistic UI updates with rollback on failure

### Evolution API Errors

**Scenarios:**
- API unavailable
- Invalid phone number
- Message delivery failure
- Rate limiting

**Strategy:**
- Use existing error handling from `evolution-client.ts`
- Display user-friendly error messages
- Mark messages as 'failed' status
- Provide retry option for failed messages

## Testing Strategy

### Unit Tests

**Components to Test:**
- `useOrderChat` hook
  - Message fetching and merging
  - Real-time subscription handling
  - Send message functionality
- `OrderChatPanel` component
  - Message rendering
  - User interactions
  - Error states

**Tools:** Vitest, React Testing Library

### Integration Tests

**Scenarios to Test:**
- Webhook receives message → Database insert → Frontend update
- Staff sends message → Evolution API call → Database insert → UI update
- Order association logic with various phone formats
- Real-time subscription lifecycle

**Tools:** Vitest, Supabase local instance

### Manual Testing

**Test Cases:**
1. Send message from customer WhatsApp with active order → Verify appears in admin UI with audio notification
2. Send reply from admin UI → Verify customer receives on WhatsApp
3. Multiple active orders for same phone → Verify associates with most recent
4. No active orders for phone → Verify message is ignored (not stored)
5. Order completed → Send message from customer → Verify message is ignored
6. Real-time updates → Open order on multiple devices, verify sync
7. Unread message indicator → Verify badge appears on order card
8. Message status updates → Verify delivery/read receipts
9. Audio notification → Verify sound plays only for inbound messages on active orders

### Performance Testing

**Metrics to Monitor:**
- Webhook response time (target: < 500ms)
- Message load time (target: < 1s for 100 messages)
- Real-time latency (target: < 2s from send to receive)
- Database query performance with indexes

## Security Considerations

### Webhook Security

**Threats:**
- Unauthorized webhook calls
- Malicious payload injection
- Data exposure

**Mitigations:**
- Validate payload structure before processing
- Use service role key (not exposed to client)
- Sanitize phone numbers and message content
- Rate limiting on webhook endpoint (Cloudflare)
- Log suspicious activity

### Data Access Control

**RLS Policies:**
- Only authenticated staff can read chat messages
- Only authenticated staff can send messages
- Service role has full access for backend operations
- Anonymous role limited to webhook inserts only

### Phone Number Privacy

**Considerations:**
- Phone numbers stored in normalized format (digits only)
- Display formatted phone numbers in UI
- No phone numbers exposed in client-side logs
- Comply with data retention policies

## Performance Optimizations

### Database Indexes

- `idx_chat_phone`: Fast lookup by phone number for order association
- `idx_chat_order`: Fast retrieval of messages for specific order
- `idx_chat_created_at`: Efficient chronological sorting

### Real-Time Subscriptions

- Subscribe only to messages for currently open order
- Unsubscribe when order dialog closes
- Use Supabase channel filters to reduce bandwidth

### Message Loading

- Limit initial load to recent messages (e.g., last 50)
- Implement pagination for older messages if needed
- Cache messages in React Query for instant navigation

### UI Optimizations

- Virtual scrolling for large message lists (if needed)
- Debounce typing indicators
- Lazy load images/media in messages
- Optimize re-renders with React.memo

## Deployment Considerations

### Environment Variables

**Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_EVOLUTION_API_URL`
- `VITE_EVOLUTION_API_KEY`
- `VITE_EVOLUTION_INSTANCE_NAME`

### Migration Steps

1. Run database migration to create `whatsapp_chat_messages` table
2. Deploy Cloudflare Function webhook endpoint
3. Configure Evolution API webhook URL to point to new endpoint
4. Deploy frontend changes
5. Test end-to-end flow
6. Monitor logs for errors

### Rollback Plan

- Database table can remain (no breaking changes)
- Disable webhook in Evolution API settings
- Revert frontend to hide chat panel
- No data loss (messages preserved in database)

## Future Enhancements

### Phase 2 Features

- **Media Support**: Handle images, videos, audio messages
- **Typing Indicators**: Show when customer is typing
- **Read Receipts**: Track when customer reads staff messages
- **Message Templates**: Quick replies for common questions
- **Chat History Search**: Search through past conversations
- **Unlinked Messages Inbox**: View messages not associated with orders
- **Multi-Agent Support**: Track which staff member sent each message
- **Customer Chat History**: View all conversations with a customer across orders

### Technical Improvements

- **Message Queuing**: Queue outbound messages for retry on failure
- **Webhook Signature Verification**: Cryptographic verification of webhook origin
- **Analytics**: Track response times, message volume, customer satisfaction
- **Internationalization**: Support multiple languages in chat interface
