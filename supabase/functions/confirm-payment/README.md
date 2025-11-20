# Payment Confirmation Edge Function

Centralized endpoint for payment confirmation with deduplication and coordinated WhatsApp notifications.

## Purpose

This edge function provides a single, reliable path for confirming payments from multiple sources:
- Manual confirmation from Cashier panel
- Webhook confirmation from MercadoPago
- Other payment sources

## Features

- **Deduplication**: Prevents duplicate WhatsApp notifications within a 5-minute window
- **Atomic Updates**: Ensures order status and payment confirmation are updated together
- **Error Handling**: Gracefully handles database and notification failures
- **Comprehensive Logging**: Tracks all confirmation attempts in `payment_confirmation_log`
- **Non-blocking Notifications**: Payment confirmation succeeds even if notification fails

## API

### Request

```typescript
POST /functions/v1/confirm-payment

Headers:
  Authorization: Bearer <service-role-key>
  Content-Type: application/json

Body:
{
  "orderId": "uuid",
  "source": "manual" | "webhook" | "mercadopago",
  "paymentMethod": "pix" | "credit_card" | "debit_card" (optional),
  "paymentId": "string" (optional)
}
```

### Response

```typescript
{
  "success": boolean,
  "orderId": string,
  "notificationSent": boolean,
  "error": string (optional)
}
```

### Status Codes

- `200`: Payment confirmed successfully
- `400`: Invalid request (missing orderId or invalid source)
- `404`: Order not found
- `500`: Server error (database failure, configuration error)

## Usage Examples

### From Cashier Panel

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/confirm-payment`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'abc-123',
    source: 'manual'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Payment confirmed!');
}
```

### From MercadoPago Webhook

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/confirm-payment`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: payment.metadata.order_id,
    source: 'mercadopago',
    paymentMethod: payment.payment_type_id,
    paymentId: payment.id
  })
});
```

## Database Changes

### Order Updates

When payment is confirmed, the order is updated with:
- `status`: 'in_preparation'
- `payment_status`: 'confirmed'
- `payment_confirmed_at`: current timestamp
- `payment_method`: provided payment method (optional)
- `mercadopago_payment_id`: provided payment ID (optional)

### Notification Queue

A notification is enqueued in `whatsapp_notifications` table:
- `order_id`: order UUID
- `customer_phone`: customer phone number
- `notification_type`: 'payment_confirmed'
- `message_content`: generated confirmation message
- `status`: 'pending'
- `scheduled_at`: current timestamp

### Confirmation Log

All confirmation attempts are logged in `payment_confirmation_log`:
- `order_id`: order UUID
- `source`: confirmation source
- `payment_method`: payment method used
- `payment_id`: external payment ID
- `notification_sent`: whether notification was enqueued
- `notification_error`: error message if notification failed
- `created_at`: timestamp

## Error Handling

### Database Update Failures

If the order update fails:
- Error is logged to `whatsapp_error_logs`
- Error is logged to `payment_confirmation_log`
- Returns 500 status with error message
- No notification is sent

### Notification Failures

If notification enqueueing fails:
- Error is logged to `whatsapp_error_logs`
- Error is logged to `payment_confirmation_log`
- Payment confirmation still succeeds (returns 200)
- `notificationSent` is set to `false` in response

### Duplicate Confirmations

If a notification was sent within the last 5 minutes:
- Logs duplicate attempt to `payment_confirmation_log`
- Returns 200 status with success
- `notificationSent` is set to `false`
- Error message indicates duplicate

## Deployment

Deploy using Supabase CLI:

```bash
supabase functions deploy confirm-payment
```

## Environment Variables

Required:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

## Testing

Test the function locally:

```bash
supabase functions serve confirm-payment
```

Test with curl:

```bash
curl -X POST http://localhost:54321/functions/v1/confirm-payment \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-id",
    "source": "manual"
  }'
```

## Monitoring

Monitor the function through:
- Supabase Dashboard > Edge Functions > confirm-payment
- `payment_confirmation_log` table for all confirmation attempts
- `whatsapp_error_logs` table for errors
- `whatsapp_notifications` table for notification status

## Related

- Requirements: `.kiro/specs/fix-payment-notifications-and-printing/requirements.md`
- Design: `.kiro/specs/fix-payment-notifications-and-printing/design.md`
- Tasks: `.kiro/specs/fix-payment-notifications-and-printing/tasks.md`
