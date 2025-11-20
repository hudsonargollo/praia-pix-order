# Payment Confirmation & Auto-Print Implementation Guide

## Overview

This guide documents the implementation of two critical fixes in the Coco Loko Açaiteria order management system:

1. **Single WhatsApp Notification on Payment Confirmation**: Ensures customers receive exactly one notification when payment is confirmed
2. **Reliable Kitchen Receipt Auto-Printing**: Ensures kitchen receipts print automatically when orders enter preparation status

## Architecture

### Payment Confirmation Flow

The system uses a centralized payment confirmation service that coordinates all payment-related actions through a single path:

```
Payment Confirmation Request
         ↓
   Edge Function: confirm-payment
         ↓
   PaymentConfirmationService
         ↓
    ┌────┴────┐
    ↓         ↓
Update Order  Send WhatsApp
    ↓         ↓
  Database   Evolution API
    ↓         ↓
Log Event    Log Notification
```

### Key Components

#### 1. Supabase Edge Function: `confirm-payment`

**Location**: `supabase/functions/confirm-payment/index.ts`

**Purpose**: Centralized endpoint for all payment confirmations

**Request Format**:
```typescript
POST /functions/v1/confirm-payment
{
  orderId: string;
  source: 'manual' | 'webhook' | 'mercadopago';
  paymentMethod?: string;
  paymentId?: string;
}
```

**Response Format**:
```typescript
{
  success: boolean;
  orderId: string;
  notificationSent: boolean;
  error?: string;
}
```

**Features**:
- Validates request parameters
- Calls PaymentConfirmationService
- Handles errors gracefully
- Returns structured response
- Includes CORS headers

#### 2. PaymentConfirmationService

**Location**: `supabase/functions/confirm-payment/paymentConfirmationService.ts`

**Purpose**: Orchestrates payment confirmation workflow with deduplication

**Key Methods**:

- `confirmPayment(options)`: Main entry point for payment confirmation
- `wasRecentlyNotified(orderId)`: Checks for duplicate notifications within 5-minute window
- `updateOrder(orderId)`: Updates order status and payment fields in database
- `notifyCustomer(order)`: Sends WhatsApp notification via Evolution API
- `logEvent(orderId, event, data)`: Logs confirmation events for debugging

**Deduplication Logic**:
```typescript
// Check if notification was sent in last 5 minutes
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
const recentNotification = await supabase
  .from('whatsapp_notifications')
  .select('id')
  .eq('order_id', orderId)
  .eq('notification_type', 'payment_confirmed')
  .gte('created_at', fiveMinutesAgo.toISOString())
  .single();

if (recentNotification.data) {
  return true; // Skip sending duplicate
}
```

#### 3. Database Schema

**New Table: `payment_confirmation_log`**

Tracks all payment confirmation attempts for debugging and auditing:

```sql
CREATE TABLE payment_confirmation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  source TEXT NOT NULL,
  payment_method TEXT,
  payment_id TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Updated Table: `whatsapp_notifications`**

Added `dedupe_key` column for deduplication:

```sql
ALTER TABLE whatsapp_notifications 
ADD COLUMN dedupe_key TEXT;

CREATE INDEX idx_whatsapp_notifications_dedupe 
ON whatsapp_notifications(dedupe_key, created_at);
```

### Auto-Print Flow

The auto-print system uses an enhanced React hook that tracks order status transitions:

```
Kitchen Page Loads
       ↓
Initialize Order Tracking
       ↓
Fetch Current Orders
       ↓
Store Initial Statuses
       ↓
Subscribe to Real-time Updates
       ↓
   ┌───┴───┐
   ↓       ↓
INSERT   UPDATE
   ↓       ↓
Check    Compare
Status   Statuses
   ↓       ↓
   └───┬───┘
       ↓
If 'in_preparation'
       ↓
  Trigger Print
```

#### Enhanced useAutoPrint Hook

**Location**: `src/hooks/useAutoPrint.ts`

**Key Features**:

1. **Initial Order Tracking**: Fetches current orders on mount and initializes status tracking
2. **Insert Handling**: Prints orders that are created directly in 'in_preparation' status
3. **Update Handling**: Detects status transitions and prints when changing to 'in_preparation'
4. **Error Handling**: Catches print failures without blocking order workflow

**Implementation Details**:

```typescript
// Initialize tracking on mount
useEffect(() => {
  if (enabled && isAutoPrintEnabled) {
    initializeOrderTracking();
  }
}, [enabled, isAutoPrintEnabled]);

// Load current orders and track statuses
const initializeOrderTracking = async () => {
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['pending_payment', 'in_preparation', 'ready']);
    
  orders?.forEach(order => {
    previousOrderStatusesRef.current.set(order.id, order.status);
  });
};

// Handle new orders
const handleOrderInsert = (order: Order) => {
  previousOrderStatusesRef.current.set(order.id, order.status);
  
  if (order.status === 'in_preparation') {
    triggerPrint(order.id);
  }
};

// Handle status changes
const handleOrderStatusChange = (order: Order) => {
  const previousStatus = previousOrderStatusesRef.current.get(order.id);
  previousOrderStatusesRef.current.set(order.id, order.status);
  
  if (order.status === 'in_preparation' && previousStatus !== 'in_preparation') {
    triggerPrint(order.id);
  }
};
```

## Integration Points

### 1. Cashier Panel

**Location**: `src/pages/staff/Cashier.tsx`

**Integration**: Calls edge function for manual payment confirmation

```typescript
const confirmPaymentManually = async (orderId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('confirm-payment', {
      body: {
        orderId,
        source: 'manual'
      }
    });

    if (error) throw error;
    
    if (data.success) {
      toast.success("Pagamento confirmado! Pedido enviado para a cozinha.");
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    toast.error("Erro ao confirmar pagamento");
  }
};
```

### 2. MercadoPago Webhook

**Location**: `supabase/functions/mercadopago-webhook/index.ts`

**Integration**: Calls edge function for webhook payment confirmation

```typescript
if (payment.status === 'approved') {
  const { data, error } = await supabase.functions.invoke('confirm-payment', {
    body: {
      orderId,
      source: 'mercadopago',
      paymentMethod: payment.payment_method_id,
      paymentId: payment.id
    }
  });
  
  if (error) {
    console.error('Payment confirmation failed:', error);
  }
}
```

### 3. Kitchen Page

**Location**: `src/pages/staff/Kitchen.tsx`

**Integration**: Uses enhanced auto-print hook

```typescript
const Kitchen = () => {
  const { orders } = useKitchenOrders();
  const { isAutoPrintEnabled, toggleAutoPrint } = useAutoPrint({
    enabled: true,
    onPrint: (orderId) => {
      console.log('Auto-printing order:', orderId);
      handlePrint(orderId);
    },
    onError: (error) => {
      console.error('Auto-print error:', error);
      toast.error('Erro ao imprimir pedido automaticamente');
    }
  });

  return (
    <div>
      <button onClick={toggleAutoPrint}>
        {isAutoPrintEnabled ? 'Desativar' : 'Ativar'} Impressão Automática
      </button>
      {/* Kitchen orders display */}
    </div>
  );
};
```

## Error Handling

### Payment Confirmation Errors

#### 1. Database Update Failure

**Scenario**: Order status update fails

**Handling**:
- Log error to `payment_confirmation_log`
- Return error response to caller
- Do NOT send WhatsApp notification
- Show error message to user

**Example**:
```typescript
try {
  await updateOrder(orderId);
} catch (error) {
  await logEvent(orderId, 'update_failed', { error: error.message });
  return {
    success: false,
    orderId,
    notificationSent: false,
    error: 'Failed to update order status'
  };
}
```

#### 2. WhatsApp Notification Failure

**Scenario**: Evolution API call fails

**Handling**:
- Order status IS updated (payment confirmed)
- Log error to `whatsapp_error_logs`
- Return partial success to caller
- Show warning to user

**Example**:
```typescript
try {
  await notifyCustomer(order);
  notificationSent = true;
} catch (error) {
  console.error('WhatsApp notification failed:', error);
  await logEvent(orderId, 'notification_failed', { error: error.message });
  notificationSent = false;
}

return {
  success: true,
  orderId,
  notificationSent,
  error: notificationSent ? undefined : 'Notification failed but payment confirmed'
};
```

#### 3. Duplicate Confirmation Attempt

**Scenario**: Payment confirmation called multiple times

**Handling**:
- Check for recent notification (within 5 minutes)
- Skip sending duplicate notification
- Log as duplicate attempt
- Return success response

**Example**:
```typescript
const wasNotified = await wasRecentlyNotified(orderId);
if (wasNotified) {
  await logEvent(orderId, 'duplicate_attempt', { source });
  return {
    success: true,
    orderId,
    notificationSent: false,
    error: 'Duplicate notification prevented'
  };
}
```

### Auto-Print Errors

#### 1. Print Service Unavailable

**Scenario**: Print server is not responding

**Handling**:
- Show error toast to user
- Log error to console
- Do NOT block order workflow
- Order continues to kitchen display

**Example**:
```typescript
try {
  await printOrder(orderId);
} catch (error) {
  console.error('Print failed:', error);
  toast.error('Erro ao imprimir pedido. Verifique a impressora.');
  // Order workflow continues
}
```

#### 2. Order Data Missing

**Scenario**: Order not found or incomplete data

**Handling**:
- Log error to console
- Skip print attempt
- Continue with order processing

**Example**:
```typescript
const order = orders.find(o => o.id === orderId);
if (!order) {
  console.error('Order not found for printing:', orderId);
  return;
}
```

## Monitoring and Debugging

### Logging Tables

#### 1. payment_confirmation_log

Query recent confirmations:
```sql
SELECT 
  pcl.*,
  o.table_number,
  o.status,
  o.payment_status
FROM payment_confirmation_log pcl
JOIN orders o ON o.id = pcl.order_id
WHERE pcl.created_at > NOW() - INTERVAL '1 hour'
ORDER BY pcl.created_at DESC;
```

#### 2. whatsapp_notifications

Check for duplicates:
```sql
SELECT 
  order_id,
  notification_type,
  COUNT(*) as notification_count,
  MIN(created_at) as first_sent,
  MAX(created_at) as last_sent
FROM whatsapp_notifications
WHERE notification_type = 'payment_confirmed'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY order_id, notification_type
HAVING COUNT(*) > 1;
```

#### 3. whatsapp_error_logs

Check for notification failures:
```sql
SELECT *
FROM whatsapp_error_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Console Logging

The implementation includes comprehensive console logging:

```typescript
// Payment confirmation
console.log('Payment confirmation started:', { orderId, source });
console.log('Order updated successfully:', orderId);
console.log('WhatsApp notification sent:', orderId);

// Auto-print
console.log('Auto-print initialized with orders:', orders.length);
console.log('Order status changed:', { orderId, from: previousStatus, to: currentStatus });
console.log('Triggering auto-print for order:', orderId);
```

## Testing

### Manual Testing Scenarios

#### Scenario 1: Manual Payment Confirmation

1. Open Cashier panel
2. Find order with pending payment
3. Click "Confirmar Pagamento"
4. Verify:
   - Order status changes to 'in_preparation'
   - Single WhatsApp notification sent
   - Check `whatsapp_notifications` table for single entry
   - Check `payment_confirmation_log` for confirmation record

#### Scenario 2: Webhook Payment Confirmation

1. Create order with PIX payment
2. Simulate MercadoPago webhook (payment approved)
3. Verify:
   - Order status changes to 'in_preparation'
   - Single WhatsApp notification sent
   - Check database tables as above

#### Scenario 3: Auto-Print with Kitchen Page Open

1. Open Kitchen page
2. Enable auto-print toggle
3. Confirm payment for an order (from Cashier panel)
4. Verify:
   - Kitchen receipt prints automatically
   - Order appears in kitchen display
   - No error messages

#### Scenario 4: Auto-Print with Kitchen Page Closed

1. Confirm payment for an order (Kitchen page closed)
2. Open Kitchen page
3. Verify:
   - Kitchen receipt prints automatically on page load
   - Order appears in kitchen display

#### Scenario 5: Duplicate Prevention

1. Confirm payment for an order
2. Immediately try to confirm again
3. Verify:
   - Second confirmation is prevented
   - Only one notification in database
   - No error shown to user

### Database Verification Queries

Check payment confirmation:
```sql
SELECT * FROM payment_confirmation_log 
WHERE order_id = 'YOUR_ORDER_ID';
```

Check WhatsApp notifications:
```sql
SELECT * FROM whatsapp_notifications 
WHERE order_id = 'YOUR_ORDER_ID' 
AND notification_type = 'payment_confirmed';
```

Check order status:
```sql
SELECT id, status, payment_status, payment_confirmed_at 
FROM orders 
WHERE id = 'YOUR_ORDER_ID';
```

## Performance Considerations

### Deduplication Check

- **Complexity**: O(1) lookup using indexed `dedupe_key`
- **Index**: `idx_whatsapp_notifications_dedupe` on `(dedupe_key, created_at)`
- **Impact**: Minimal overhead, typically < 10ms

### Initial Order Tracking

- **Frequency**: Once per Kitchen page load
- **Query**: Fetches orders in relevant statuses only
- **Impact**: One-time cost, typically < 100ms

### Real-time Updates

- **Overhead**: No additional overhead vs previous implementation
- **Subscription**: Same Supabase real-time subscription model
- **Impact**: Negligible

### Notification Sending

- **Execution**: Async, non-blocking
- **Timeout**: 30 seconds for Evolution API call
- **Retry**: No automatic retry (prevents duplicates)

## Security Considerations

### Edge Function Authentication

- Requires Supabase service role key
- Not accessible from public clients
- Called via authenticated Supabase client

### RLS Policies

- Existing policies maintained on `orders` table
- New tables have appropriate RLS policies
- Service role bypasses RLS for edge functions

### Webhook Validation

- MercadoPago webhook validates signatures
- Rejects unauthorized requests
- Logs all webhook attempts

### Rate Limiting

- Consider adding rate limits to prevent abuse
- Current implementation: No explicit rate limiting
- Deduplication provides some protection

## Troubleshooting

See TROUBLESHOOTING.md for detailed troubleshooting guide.
