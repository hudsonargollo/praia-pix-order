# Design Document: Fix Payment Notifications and Printing

## Overview

This design addresses two critical bugs in the order management system:

1. **Duplicate WhatsApp Notifications**: Customers receive multiple WhatsApp messages when payment is confirmed
2. **Kitchen Receipt Auto-Print Failure**: Kitchen receipts don't print automatically when orders enter preparation status

The root causes are:
- Multiple code paths triggering WhatsApp notifications without coordination
- Real-time subscription timing issues causing the auto-print hook to miss status transitions

## Architecture

### Current Flow Analysis

**Payment Confirmation Flow (Cashier Panel):**
```
User clicks "Confirmar Pagamento"
  ↓
confirmPaymentManually() updates order:
  - status = 'in_preparation'
  - payment_status = 'confirmed'
  - payment_confirmed_at = NOW()
  ↓
Supabase real-time subscription detects UPDATE
  ↓
useCashierOrders.handleUpdate() fires
  ↓
Checks if payment_confirmed_at exists
  ↓
Calls onPaymentConfirmed() → shows toast notification
```

**Kitchen Auto-Print Flow:**
```
useAutoPrint subscribes to useKitchenOrders
  ↓
Tracks previous order statuses in ref
  ↓
When order UPDATE detected:
  - Compare previous status vs current status
  - If transition to 'in_preparation' → trigger print
  ↓
Problem: If Kitchen page loads AFTER payment confirmation,
         it doesn't have the previous status tracked
```

### Proposed Architecture

#### 1. Centralized Payment Confirmation Service

Create a single service that coordinates all payment confirmation actions:

```typescript
// src/lib/paymentConfirmationService.ts
class PaymentConfirmationService {
  async confirmPayment(orderId: string, source: 'manual' | 'webhook'): Promise<void>
  private async updateOrderStatus(orderId: string): Promise<void>
  private async sendWhatsAppNotification(orderId: string): Promise<void>
  private async logConfirmation(orderId: string, source: string): Promise<void>
}
```

#### 2. Enhanced Auto-Print with Initial Load Detection

Improve the auto-print hook to handle orders that are already in preparation:

```typescript
// src/hooks/useAutoPrint.ts
- Track previous statuses in ref
- On initial load, fetch current orders and initialize status tracking
- Detect both status transitions AND new orders in 'in_preparation'
- Handle edge case: order confirmed while Kitchen page is loading
```

## Components and Interfaces

### 1. Payment Confirmation Service

**Location**: `src/lib/paymentConfirmationService.ts`

**Interface**:
```typescript
interface PaymentConfirmationOptions {
  orderId: string;
  source: 'manual' | 'webhook' | 'mercadopago';
  paymentMethod?: string;
  paymentId?: string;
}

interface PaymentConfirmationResult {
  success: boolean;
  orderId: string;
  notificationSent: boolean;
  error?: string;
}

class PaymentConfirmationService {
  // Main entry point for all payment confirmations
  async confirmPayment(options: PaymentConfirmationOptions): Promise<PaymentConfirmationResult>
  
  // Check if notification was recently sent (deduplication)
  private async wasRecentlyNotified(orderId: string): Promise<boolean>
  
  // Update order in database
  private async updateOrder(orderId: string, data: Partial<Order>): Promise<Order>
  
  // Send WhatsApp notification
  private async notifyCustomer(order: Order): Promise<boolean>
  
  // Log confirmation event
  private async logEvent(orderId: string, event: string, data: any): Promise<void>
}
```

### 2. Enhanced useAutoPrint Hook

**Location**: `src/hooks/useAutoPrint.ts`

**Changes**:
```typescript
interface UseAutoPrintOptions {
  enabled?: boolean;
  onPrint?: (orderId: string) => void;
  onError?: (error: Error) => void;
}

export function useAutoPrint(options: UseAutoPrintOptions) {
  // NEW: Initialize status tracking on mount
  useEffect(() => {
    if (enabled && isAutoPrintEnabled) {
      initializeOrderTracking();
    }
  }, [enabled, isAutoPrintEnabled]);
  
  // NEW: Load current orders and track their statuses
  const initializeOrderTracking = async () => {
    const orders = await fetchKitchenOrders();
    orders.forEach(order => {
      previousOrderStatusesRef.current.set(order.id, order.status);
    });
  };
  
  // ENHANCED: Handle both inserts and updates
  const handleOrderInsert = (order: Order) => {
    previousOrderStatusesRef.current.set(order.id, order.status);
    
    // If order is already in preparation, print it
    if (order.status === 'in_preparation') {
      onPrint?.(order.id);
    }
  };
  
  const handleOrderStatusChange = (order: Order) => {
    const previousStatus = previousOrderStatusesRef.current.get(order.id);
    previousOrderStatusesRef.current.set(order.id, order.status);
    
    // Detect transition to 'in_preparation'
    if (order.status === 'in_preparation' && previousStatus !== 'in_preparation') {
      onPrint?.(order.id);
    }
  };
}
```

### 3. Updated Cashier Panel

**Location**: `src/pages/staff/Cashier.tsx`

**Changes**:
```typescript
// REPLACE confirmPaymentManually with service call
const confirmPaymentManually = async (orderId: string) => {
  try {
    const result = await paymentConfirmationService.confirmPayment({
      orderId,
      source: 'manual'
    });
    
    if (result.success) {
      toast.success("Pagamento confirmado! Pedido enviado para a cozinha.");
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    toast.error("Erro ao confirmar pagamento");
  }
};
```

### 4. Updated MercadoPago Webhook

**Location**: `supabase/functions/mercadopago-webhook/index.ts`

**Changes**:
```typescript
// REPLACE direct database update with service call
if (payment.status === 'approved') {
  // Use the centralized service
  const confirmationResult = await fetch(`${supabaseUrl}/functions/v1/confirm-payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderId,
      source: 'mercadopago',
      paymentMethod,
      paymentId
    })
  });
}
```

### 5. New Edge Function: Confirm Payment

**Location**: `supabase/functions/confirm-payment/index.ts`

**Purpose**: Centralized endpoint for payment confirmation that can be called from:
- Frontend (Cashier panel)
- MercadoPago webhook
- Other payment sources

**Interface**:
```typescript
// POST /functions/v1/confirm-payment
{
  orderId: string;
  source: 'manual' | 'webhook' | 'mercadopago';
  paymentMethod?: string;
  paymentId?: string;
}

// Response
{
  success: boolean;
  orderId: string;
  notificationSent: boolean;
  error?: string;
}
```

## Data Models

### Notification Deduplication Tracking

Add a field to track recent notifications:

```sql
-- Add to whatsapp_notifications table
ALTER TABLE whatsapp_notifications 
ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_dedupe 
ON whatsapp_notifications(dedupe_key, created_at);
```

The `dedupe_key` format: `{order_id}:{notification_type}:{date}`

Example: `"abc-123:payment_confirmed:2025-11-19"`

### Payment Confirmation Log

Track all payment confirmation attempts:

```sql
CREATE TABLE IF NOT EXISTS payment_confirmation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  source TEXT NOT NULL, -- 'manual', 'webhook', 'mercadopago'
  payment_method TEXT,
  payment_id TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_confirmation_log_order 
ON payment_confirmation_log(order_id, created_at DESC);
```

## Error Handling

### Payment Confirmation Errors

1. **Database Update Fails**:
   - Log error to `whatsapp_error_logs`
   - Return error to caller
   - Do NOT send WhatsApp notification

2. **WhatsApp Notification Fails**:
   - Log error to `whatsapp_error_logs`
   - Order status still updated (payment confirmed)
   - Return partial success to caller

3. **Duplicate Confirmation Attempt**:
   - Check `payment_confirmation_log` for recent confirmation
   - If found within 5 minutes, skip and return success
   - Log as duplicate attempt

### Auto-Print Errors

1. **Print Service Unavailable**:
   - Show error toast
   - Log to console
   - Do NOT block order workflow

2. **Order Data Missing**:
   - Log error
   - Skip print attempt
   - Continue with order processing

## Testing Strategy

### Unit Tests

1. **PaymentConfirmationService**:
   - Test deduplication logic
   - Test error handling for each step
   - Test different payment sources

2. **useAutoPrint Hook**:
   - Test initial load tracking
   - Test status transition detection
   - Test insert handling for new orders

### Integration Tests

1. **Payment Confirmation Flow**:
   - Manual confirmation from Cashier
   - Webhook confirmation from MercadoPago
   - Verify single WhatsApp notification sent

2. **Auto-Print Flow**:
   - Order confirmed while Kitchen page open
   - Order confirmed before Kitchen page loads
   - Verify print triggered in both cases

### Manual Testing Scenarios

1. **Duplicate Notification Prevention**:
   - Confirm payment manually
   - Verify only one WhatsApp sent
   - Check `whatsapp_notifications` table for single entry

2. **Auto-Print Reliability**:
   - Scenario A: Kitchen page open → confirm payment → verify print
   - Scenario B: Confirm payment → open Kitchen page → verify print
   - Scenario C: Auto-print disabled → confirm payment → verify no print

## Migration Strategy

### Phase 1: Add Infrastructure
- Create `payment_confirmation_log` table
- Add `dedupe_key` to `whatsapp_notifications`
- Create `confirm-payment` edge function

### Phase 2: Implement Service
- Create `PaymentConfirmationService`
- Add deduplication logic
- Add comprehensive logging

### Phase 3: Update Consumers
- Update Cashier panel to use service
- Update MercadoPago webhook to use service
- Ensure backward compatibility

### Phase 4: Enhance Auto-Print
- Update `useAutoPrint` hook
- Add initial load tracking
- Test thoroughly

### Phase 5: Cleanup
- Remove old notification trigger code
- Remove obsolete database triggers
- Update documentation

## Performance Considerations

1. **Deduplication Check**: O(1) lookup using indexed `dedupe_key`
2. **Initial Order Tracking**: One-time fetch on Kitchen page load
3. **Real-time Updates**: No additional overhead, same subscription model
4. **Notification Sending**: Async, non-blocking

## Security Considerations

1. **Edge Function Authentication**: Requires service role key
2. **RLS Policies**: Maintain existing policies on orders table
3. **Webhook Validation**: Verify MercadoPago signatures
4. **Rate Limiting**: Consider adding rate limits to prevent abuse

## Rollback Plan

If issues arise:

1. **Revert Cashier Changes**: Restore direct database update
2. **Disable Edge Function**: Remove from deployment
3. **Revert Auto-Print**: Restore previous hook version
4. **Database Rollback**: Drop new tables if needed

All changes are additive and can be rolled back without data loss.
