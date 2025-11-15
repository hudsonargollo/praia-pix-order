# API Documentation

## Overview

This document describes the Cloudflare Functions API endpoints for the Waiter Payment Workflow feature. These endpoints handle PIX generation, item additions to orders, and payment webhook processing.

## Base URL

All endpoints are relative to your Cloudflare Pages deployment:
```
https://your-domain.pages.dev/api
```

## Authentication

Most endpoints require authentication via Supabase. The service uses:
- **Service Role Key**: For server-side operations (stored in environment variables)
- **User Authentication**: For client-side requests (via Supabase Auth)

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key (server-side only)
- `VITE_MERCADOPAGO_ACCESS_TOKEN`: MercadoPago API access token

---

## Endpoints

### 1. Generate PIX for Order

Creates a PIX QR code for waiter-created orders that are awaiting payment.

**Endpoint:** `POST /api/orders/generate-pix`

**Description:** Generates a MercadoPago PIX payment for a waiter order. The PIX QR code is stored in the order record and expires after 15 minutes.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "orderId": "uuid-string"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string | Yes | UUID of the order to generate PIX for |

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "qrCode": "00020126580014br.gov.bcb.pix...",
  "qrCodeBase64": "data:image/png;base64,iVBORw0KGgo...",
  "amount": 45.50,
  "expiresAt": "2024-11-15T15:30:00.000Z",
  "paymentId": "1234567890"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates if the operation was successful |
| qrCode | string | PIX copy-paste code (EMV format) |
| qrCodeBase64 | string | Base64-encoded QR code image |
| amount | number | Payment amount in BRL |
| expiresAt | string | ISO 8601 timestamp when PIX expires |
| paymentId | string | MercadoPago payment ID |

#### Error Responses

**400 Bad Request - Missing Order ID:**
```json
{
  "error": "Order ID is required"
}
```

**400 Bad Request - Not a Waiter Order:**
```json
{
  "error": "Order must be created by a waiter"
}
```

**400 Bad Request - Invalid Payment Status:**
```json
{
  "error": "Order payment status must be pending",
  "currentStatus": "confirmed"
}
```

**400 Bad Request - PIX Already Exists:**
```json
{
  "error": "PIX already generated and not expired",
  "qrCode": "00020126580014br.gov.bcb.pix...",
  "expiresAt": "2024-11-15T15:30:00.000Z"
}
```

**404 Not Found:**
```json
{
  "error": "Order not found"
}
```

**500 Internal Server Error - MercadoPago Not Configured:**
```json
{
  "error": "MercadoPago not configured"
}
```

**500 Internal Server Error - PIX Generation Failed:**
```json
{
  "error": "Failed to generate PIX QR code"
}
```

**500 Internal Server Error - General Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

#### Validation Rules

1. Order must exist in the database
2. Order must have a `waiter_id` (created by a waiter)
3. Order `payment_status` must be `'pending'`
4. If PIX already exists and hasn't expired, returns existing PIX data
5. PIX expires 15 minutes after generation

#### Example Usage

```typescript
const response = await fetch('/api/orders/generate-pix', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
});

const data = await response.json();

if (data.success) {
  console.log('PIX QR Code:', data.qrCode);
  console.log('Expires at:', data.expiresAt);
}
```

---

### 2. Add Items to Order

Adds new items to an existing order that is in preparation. Recalculates totals and invalidates PIX if necessary.

**Endpoint:** `POST /api/orders/add-items`

**Description:** Allows waiters to add items to orders that are already in preparation. If a PIX QR code was previously generated and hasn't expired, it will be invalidated and must be regenerated with the new total.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "orderId": "uuid-string",
  "waiterId": "uuid-string",
  "items": [
    {
      "productId": "uuid-string",
      "quantity": 2,
      "notes": "Optional special instructions"
    }
  ]
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string | Yes | UUID of the order to add items to |
| waiterId | string | Yes | UUID of the waiter making the request |
| items | array | Yes | Array of items to add (min 1 item) |
| items[].productId | string | Yes | UUID of the menu item |
| items[].quantity | number | Yes | Quantity to add (positive integer) |
| items[].notes | string | No | Special instructions for the item |

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "order": {
    "id": "uuid-string",
    "total_amount": 67.50,
    "commission_amount": 6.75,
    "status": "in_preparation",
    "payment_status": "pending"
  },
  "addedItems": [
    {
      "id": "uuid-string",
      "menu_item_id": "uuid-string",
      "item_name": "Açaí 500ml",
      "unit_price": 22.00,
      "quantity": 1
    }
  ],
  "newTotal": 67.50,
  "addedAmount": 22.00,
  "pixInvalidated": true,
  "message": "Items added successfully. PIX was invalidated and needs to be regenerated with the new amount."
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates if the operation was successful |
| order | object | Updated order object with new totals |
| addedItems | array | Array of newly added order items |
| newTotal | number | New total amount after adding items |
| addedAmount | number | Amount added by the new items |
| pixInvalidated | boolean | Whether existing PIX was invalidated |
| message | string | Human-readable success message |

#### Error Responses

**400 Bad Request - Missing Required Fields:**
```json
{
  "error": "Order ID and items array are required"
}
```

**400 Bad Request - Missing Waiter ID:**
```json
{
  "error": "Waiter ID is required"
}
```

**400 Bad Request - Not a Waiter Order:**
```json
{
  "error": "Order must be created by a waiter"
}
```

**400 Bad Request - Invalid Order Status:**
```json
{
  "error": "Can only add items to orders in preparation",
  "currentStatus": "ready"
}
```

**400 Bad Request - Product Not Found:**
```json
{
  "error": "Product abc123 not found"
}
```

**400 Bad Request - Product Not Available:**
```json
{
  "error": "Product Açaí 1L is not available"
}
```

**403 Forbidden - Not Order Owner:**
```json
{
  "error": "You can only add items to your own orders"
}
```

**404 Not Found:**
```json
{
  "error": "Order not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

#### Validation Rules

1. Order must exist in the database
2. Order must have a `waiter_id` (created by a waiter)
3. Waiter making the request must own the order (`waiter_id` matches)
4. Order `status` must be `'in_preparation'`
5. All products must exist and be available
6. Items array must contain at least one item
7. If PIX exists and hasn't expired, it will be invalidated

#### Business Logic

1. **Commission Calculation**: Commission is recalculated at 10% of the new total
2. **PIX Invalidation**: If a valid PIX exists, it's cleared and must be regenerated
3. **Audit Logging**: All item additions are logged with timestamp and details

#### Example Usage

```typescript
const response = await fetch('/api/orders/add-items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    waiterId: 'waiter-uuid-here',
    items: [
      {
        productId: 'product-uuid-1',
        quantity: 2
      },
      {
        productId: 'product-uuid-2',
        quantity: 1,
        notes: 'Sem açúcar'
      }
    ]
  })
});

const data = await response.json();

if (data.success) {
  console.log('New total:', data.newTotal);
  if (data.pixInvalidated) {
    console.log('PIX needs to be regenerated!');
  }
}
```

---

### 3. MercadoPago Payment Webhook

Receives payment notifications from MercadoPago and updates order payment status.

**Endpoint:** `POST /api/mercadopago/webhook`

**Description:** Webhook endpoint that receives payment status updates from MercadoPago. This endpoint is called automatically by MercadoPago when payment status changes.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body (from MercadoPago):**
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "1234567890"
  },
  "date_created": "2024-11-15T14:30:00Z",
  "id": 12345,
  "live_mode": true,
  "type": "payment",
  "user_id": "123456789"
}
```

**Parameters:**
| Field | Type | Description |
|-------|------|-------------|
| type | string | Notification type (must be "payment") |
| data.id | string | MercadoPago payment ID |

#### Response

**Success (200 OK) - Payment Processed:**
```json
{
  "success": true,
  "message": "Webhook processed",
  "orderId": "uuid-string",
  "status": "paid",
  "payment_status": "confirmed"
}
```

**Success (200 OK) - Already Processed (Idempotent):**
```json
{
  "success": true,
  "message": "Payment already processed",
  "orderId": "uuid-string",
  "status": "confirmed"
}
```

**Success (200 OK) - Not a Payment Webhook:**
```json
{
  "success": true,
  "message": "Not a payment webhook"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates if the operation was successful |
| message | string | Human-readable message |
| orderId | string | UUID of the affected order |
| status | string | New order status |
| payment_status | string | New payment status |

#### Error Responses

**400 Bad Request - No Order ID:**
```json
{
  "success": false,
  "message": "No order ID"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error message details"
}
```

#### Payment Status Mapping

| MercadoPago Status | Order Status | Payment Status | Payment Confirmed At |
|-------------------|--------------|----------------|---------------------|
| approved | paid | confirmed | Current timestamp |
| rejected | cancelled | failed | null |
| cancelled | cancelled | failed | null |
| pending | pending_payment | pending | null |

#### Webhook Flow

1. **Receive Notification**: MercadoPago sends webhook with payment ID
2. **Fetch Payment Details**: Retrieve full payment data from MercadoPago API
3. **Extract Order ID**: Get order ID from payment metadata or external_reference
4. **Check Idempotency**: Verify if payment was already processed
5. **Update Order**: Update order status and payment_status in database
6. **Log Event**: Log the webhook processing for audit
7. **Return Success**: Return 200 OK to acknowledge receipt

#### Idempotency

The webhook implements idempotency checking:
- Before processing, checks if the payment ID was already processed
- If already processed, returns success without updating
- Prevents duplicate processing of the same payment

#### Security Considerations

**Current Implementation:**
- Validates webhook type (must be "payment")
- Fetches payment details from MercadoPago API (validates authenticity)
- Uses service role key for database updates

**Recommended Enhancements:**
- Implement MercadoPago signature validation
- Add rate limiting to prevent abuse
- Implement webhook timestamp validation (prevent replay attacks)
- Add IP whitelist for MercadoPago servers

#### Example Webhook Configuration

Configure this webhook URL in your MercadoPago account:
```
https://your-domain.pages.dev/api/mercadopago/webhook
```

#### Testing Webhooks

For local testing, use a tool like ngrok to expose your local server:
```bash
ngrok http 8080
```

Then configure the ngrok URL in MercadoPago's webhook settings.

---

## Error Handling

### Error Response Format

All error responses follow this format:
```json
{
  "error": "Human-readable error message",
  "details": "Optional additional details"
}
```

Or for webhook errors:
```json
{
  "success": false,
  "message": "Error message"
}
```

### HTTP Status Codes

| Status Code | Meaning | When Used |
|------------|---------|-----------|
| 200 | OK | Successful operation |
| 400 | Bad Request | Invalid input, validation failure |
| 403 | Forbidden | Authorization failure (e.g., not order owner) |
| 404 | Not Found | Resource not found (order, product) |
| 500 | Internal Server Error | Server-side error, database error, external API failure |

### Common Error Scenarios

#### Network Timeouts
- **Cause**: MercadoPago API timeout or database connection timeout
- **Response**: 500 Internal Server Error
- **Client Action**: Retry with exponential backoff

#### Invalid Order State
- **Cause**: Order not in valid state for operation
- **Response**: 400 Bad Request with current state
- **Client Action**: Refresh order data and show appropriate message

#### Authorization Failures
- **Cause**: Waiter doesn't own the order
- **Response**: 403 Forbidden
- **Client Action**: Show error message, log security event

#### Product Unavailability
- **Cause**: Menu item not available or not found
- **Response**: 400 Bad Request with product details
- **Client Action**: Refresh menu data and show error

---

## Rate Limiting

### Current Implementation
No rate limiting is currently implemented.

### Recommended Limits
- **PIX Generation**: 3 requests per order per hour
- **Add Items**: 10 requests per order per hour
- **Webhook**: 100 requests per minute (per IP)

### Rate Limit Response
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## Monitoring and Logging

### Logged Events

#### PIX Generation
```
PIX generated for order {orderId}
```

#### Item Addition (Audit Log)
```json
{
  "event": "items_added",
  "timestamp": "2024-11-15T14:30:00.000Z",
  "waiter_id": "uuid",
  "order_id": "uuid",
  "items_added": [
    {
      "name": "Açaí 500ml",
      "quantity": 1,
      "unit_price": 22.00
    }
  ],
  "old_total": 45.50,
  "new_total": 67.50,
  "added_amount": 22.00,
  "pix_invalidated": true
}
```

#### Webhook Processing
```
Webhook received: {webhook_data}
Order {orderId} updated - status: {status}, payment_status: {payment_status}
Payment {paymentId} already processed for order {orderId}
```

### Error Logging

All errors are logged with:
- Error message
- Stack trace (in development)
- Request context (endpoint, parameters)
- Timestamp

---

## Database Schema

### Orders Table Updates

The following fields were added to support the payment workflow:

```sql
-- Payment status tracking
payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded'))

-- Payment timestamps
payment_confirmed_at TIMESTAMP WITH TIME ZONE
pix_generated_at TIMESTAMP WITH TIME ZONE

-- PIX data storage
pix_qr_code TEXT
pix_expires_at TIMESTAMP WITH TIME ZONE

-- MercadoPago reference
mercadopago_payment_id TEXT
```

### Indexes

```sql
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_waiter_payment ON orders(waiter_id, payment_status) 
  WHERE waiter_id IS NOT NULL;
CREATE INDEX idx_orders_status_payment ON orders(status, payment_status);
```

---

## Integration Examples

### Complete Waiter Workflow

```typescript
// 1. Create order (existing flow)
const order = await createOrder({
  items: [...],
  waiterId: currentWaiterId,
  customerName: "João Silva",
  customerPhone: "+5511999999999"
});

// 2. Add items to order (if needed)
const addItemsResponse = await fetch('/api/orders/add-items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    waiterId: currentWaiterId,
    items: [
      { productId: 'product-uuid', quantity: 1 }
    ]
  })
});

const addItemsData = await addItemsResponse.json();

if (addItemsData.pixInvalidated) {
  alert('PIX precisa ser gerado novamente com o novo valor!');
}

// 3. Generate PIX when customer is ready to pay
const pixResponse = await fetch('/api/orders/generate-pix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id
  })
});

const pixData = await pixResponse.json();

if (pixData.success) {
  // Display QR code to customer
  displayQRCode(pixData.qrCode, pixData.qrCodeBase64);
  
  // Show expiration countdown
  startExpirationCountdown(pixData.expiresAt);
}

// 4. Wait for payment confirmation (via real-time subscription)
const subscription = supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${order.id}`
  }, (payload) => {
    if (payload.new.payment_status === 'confirmed') {
      alert('Pagamento confirmado!');
      // Update commission display
      updateCommissionDisplay();
    }
  })
  .subscribe();
```

---

## Changelog

### Version 1.0.0 (2024-11-15)
- Initial API documentation
- Added PIX generation endpoint
- Added item addition endpoint
- Updated webhook documentation for payment_status handling
- Added comprehensive error codes and examples

---

## Support

For issues or questions:
1. Check error logs in Cloudflare Pages dashboard
2. Verify environment variables are configured
3. Test endpoints with provided examples
4. Review MercadoPago API documentation for payment-specific issues

## Related Documentation

- [MercadoPago API Documentation](https://www.mercadopago.com.br/developers/en/docs)
- [Supabase REST API](https://supabase.com/docs/guides/api)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
