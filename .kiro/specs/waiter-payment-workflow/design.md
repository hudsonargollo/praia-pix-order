# Design Document

## Overview

This design document outlines the technical architecture for separating order status from payment status, enabling waiters to create orders that go directly into preparation while payment is handled separately through manual PIX generation.

## Glossary

- **Order_Management_System**: The system component responsible for creating, updating, and tracking orders
- **Payment_Management_System**: The system component responsible for handling payment status and PIX generation
- **PIX_Generation_System**: The subsystem that generates PIX QR codes via MercadoPago
- **Status_Display_System**: The UI components that display order and payment status
- **MercadoPago_Integration**: The integration layer with MercadoPago payment API
- **Commission_Calculation_System**: The system that calculates waiter commissions

## Architecture

### Database Schema Changes

#### Orders Table Updates

```sql
-- Add payment status tracking
ALTER TABLE public.orders 
ADD COLUMN payment_status TEXT DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded'));

-- Add payment timestamps
ALTER TABLE public.orders 
ADD COLUMN payment_confirmed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.orders 
ADD COLUMN pix_generated_at TIMESTAMP WITH TIME ZONE;

-- Add PIX data storage
ALTER TABLE public.orders 
ADD COLUMN pix_qr_code TEXT;

ALTER TABLE public.orders 
ADD COLUMN pix_expires_at TIMESTAMP WITH TIME ZONE;

-- Performance indexes
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_waiter_payment ON public.orders(waiter_id, payment_status) 
WHERE waiter_id IS NOT NULL;
CREATE INDEX idx_orders_status_payment ON public.orders(status, payment_status);
```

#### Data Migration

```sql
-- Set existing completed orders to confirmed payment
UPDATE public.orders 
SET payment_status = 'confirmed',
    payment_confirmed_at = updated_at
WHERE status = 'completed' 
AND payment_status IS NULL;
```

### API Endpoints

#### New Endpoints

**POST /api/orders/{id}/generate-pix**
- Generates PIX QR code for waiter-created orders
- Validates order ownership and status
- Returns QR code data, amount, and expiration
- Updates `pix_generated_at` timestamp

Request:
```typescript
{
  orderId: string;
}
```

Response:
```typescript
{
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
  expiresAt: string;
  pixKey: string;
}
```

**POST /api/orders/{id}/add-items**
- Adds items to existing orders in preparation
- Recalculates totals and commission
- Invalidates PIX if already generated

Request:
```typescript
{
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
}
```

Response:
```typescript
{
  order: Order;
  newTotal: number;
  pixInvalidated: boolean;
}
```

**GET /api/orders/by-payment-status**
- Filters orders by payment status
- Supports waiter-specific filtering

Query Parameters:
```typescript
{
  paymentStatus: 'pending' | 'confirmed' | 'failed' | 'refunded';
  waiterId?: string;
  startDate?: string;
  endDate?: string;
}
```

#### Updated Endpoints

**POST /api/orders** (Order Creation)
- For waiter-created orders: set `status='in_preparation'`, `payment_status='pending'`
- For customer orders: maintain existing flow (`status='pending_payment'`)
- Skip automatic PIX generation for waiter orders

**POST /api/webhooks/mercadopago** (Payment Webhook)
- Update `payment_status` to 'confirmed'
- Set `payment_confirmed_at` timestamp
- Trigger commission calculation
- Send real-time updates to all clients

## Components and Interfaces

### TypeScript Interfaces

```typescript
// Extended Order interface
interface Order {
  id: string;
  status: 'pending_payment' | 'in_preparation' | 'ready' | 'completed';
  payment_status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  payment_confirmed_at?: string;
  pix_generated_at?: string;
  pix_qr_code?: string;
  pix_expires_at?: string;
  waiter_id?: string;
  created_by_waiter: boolean;
  // ... existing fields
}

// Payment status helpers
interface PaymentStatusInfo {
  status: PaymentStatus;
  label: string;
  color: string;
  icon: string;
  canGeneratePix: boolean;
}
```

### UI Components

#### StatusBadge Component (Updated)

```typescript
interface StatusBadgeProps {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  showBoth?: boolean;
  compact?: boolean;
}

// Displays both order status and payment status
// Order status: existing colors (blue, yellow, green, gray)
// Payment status: orange for pending, blue for confirmed
```

#### PIXGenerationModal Component

```typescript
interface PIXGenerationModalProps {
  orderId: string;
  amount: number;
  onSuccess: (qrCode: string) => void;
  onError: (error: string) => void;
}

// Features:
// - Shows order details and amount
// - Generates PIX QR code
// - Displays QR code with copy functionality
// - Shows expiration countdown
// - Handles generation errors
```

#### AddItemsModal Component

```typescript
interface AddItemsModalProps {
  orderId: string;
  existingItems: OrderItem[];
  onItemsAdded: (newTotal: number) => void;
}

// Features:
// - Shows menu items with search/filter
// - Quantity selection
// - Shows current order items
// - Calculates new total
// - Warns if PIX needs regeneration
```

#### UniformHeader Component

```typescript
interface UniformHeaderProps {
  title: string;
  actions?: React.ReactNode;
  showDiagnostic?: boolean;
  showConnection?: boolean;
}

// Consistent header design:
// - Left: Page title (concise, objective)
// - Center: Key actions (if any)
// - Right: Diagnostic, Connection status, Logout
```

### Page Layout Updates

#### Waiter Dashboard
- Header: "Dashboard" + Logout
- Add "Gerar PIX" button to unpaid orders
- Show dual status badges
- Filter by payment status
- Display pending vs confirmed commission

#### Cashier Page
- Header: "Caixa" + Actions + Diagnostic + Connection + Logout
- Show payment status alongside order status
- Filter by payment status
- Highlight orders awaiting payment

#### Kitchen Page
- Header: "Cozinha" + Connection + Logout
- Show waiter name for waiter-created orders
- Optional payment status indicator
- Process orders regardless of payment status

## Data Models

### Order State Machine

```
Waiter-Created Orders:
┌─────────────────┐
│  Order Created  │
│ status: in_prep │
│ payment: pending│
└────────┬────────┘
         │
         ├─> Waiter generates PIX
         │   (pix_generated_at set)
         │
         ├─> Customer pays
         │   (payment_status: confirmed)
         │
         ├─> Kitchen marks ready
         │   (status: ready)
         │
         └─> Order completed
             (status: completed)

Customer Orders (existing):
┌─────────────────┐
│  Order Created  │
│ status: pending │
│ payment: pending│
└────────┬────────┘
         │
         ├─> PIX auto-generated
         │
         ├─> Customer pays
         │   (payment_status: confirmed)
         │   (status: in_preparation)
         │
         └─> Continue existing flow
```

### Payment Status Transitions

```
pending → confirmed (via webhook)
pending → failed (via webhook)
confirmed → refunded (manual admin action)
```

## Error Handling

### PIX Generation Errors

```typescript
// Error scenarios and handling:
1. Network timeout
   - Show retry button
   - Log error for monitoring

2. Invalid amount
   - Show validation error
   - Prevent generation

3. API rate limit
   - Show "try again later" message
   - Implement exponential backoff

4. Order already paid
   - Disable PIX generation
   - Show payment confirmed message

5. Order not found
   - Show error message
   - Redirect to dashboard
```

### Payment Webhook Errors

```typescript
// Webhook error handling:
1. Invalid signature
   - Log security event
   - Return 401 Unauthorized
   - Alert admin

2. Order not found
   - Log error
   - Return 404 Not Found

3. Duplicate webhook
   - Check idempotency
   - Return 200 OK (already processed)

4. Database error
   - Log error
   - Return 500 for retry
   - Alert monitoring system
```

### Item Addition Errors

```typescript
// Item addition error handling:
1. Order not in valid status
   - Show error message
   - Disable add items button

2. Waiter doesn't own order
   - Show permission error
   - Log security event

3. Product not available
   - Show validation error
   - Refresh menu data

4. PIX already generated
   - Warn about regeneration
   - Require confirmation
```

## Testing Strategy

### Unit Tests

```typescript
// Payment status logic
- Test payment status transitions
- Test PIX generation validation
- Test commission calculation with payment status
- Test item addition validation

// UI components
- Test StatusBadge with dual status
- Test PIXGenerationModal rendering
- Test AddItemsModal calculations
- Test UniformHeader variations
```

### Integration Tests

```typescript
// API endpoints
- Test order creation with different user types
- Test PIX generation endpoint
- Test add items endpoint
- Test payment status filtering

// Webhook processing
- Test MercadoPago webhook handling
- Test payment confirmation flow
- Test duplicate webhook handling
- Test webhook signature validation
```

### E2E Tests

```typescript
// Complete workflows
1. Waiter creates order → appears in kitchen → generates PIX → customer pays → commission calculated

2. Waiter creates order → adds items → generates PIX → payment confirmed

3. Customer creates order → auto PIX → payment → existing flow

4. Multiple waiters → separate orders → independent payment tracking
```

## Performance Considerations

### Database Optimization

```sql
-- Optimized query for waiter dashboard
SELECT 
  o.*,
  SUM(CASE WHEN o.payment_status = 'confirmed' THEN o.commission_amount ELSE 0 END) as confirmed_commission,
  SUM(CASE WHEN o.payment_status = 'pending' THEN o.commission_amount ELSE 0 END) as pending_commission
FROM orders o 
WHERE o.waiter_id = $1 
  AND o.deleted_at IS NULL
GROUP BY o.id
ORDER BY o.created_at DESC;

-- Optimized query for cashier with dual status
SELECT 
  o.*, 
  COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.deleted_at IS NULL
GROUP BY o.id
ORDER BY 
  CASE o.status 
    WHEN 'pending_payment' THEN 1
    WHEN 'in_preparation' THEN 2
    WHEN 'ready' THEN 3
    ELSE 4
  END,
  o.created_at ASC;
```

### Real-time Optimization

```typescript
// Minimize payload size
// Only send changed fields
interface OrderUpdate {
  id: string;
  changes: Partial<Order>;
  timestamp: string;
}

// Batch multiple changes
// Debounce rapid updates
// Use order ID for client-side state updates
```

### Caching Strategy

```typescript
// Cache PIX QR codes (short TTL)
// Cache menu items for add items modal
// Cache waiter commission summaries
// Invalidate cache on payment confirmation
```

## Security Considerations

### PIX Generation Security

```typescript
// Validation checks:
1. Verify waiter owns the order
2. Verify order is in valid state
3. Rate limit: max 3 PIX generations per order
4. Log all generation attempts
5. Validate amount matches order total
6. Check for suspicious patterns
```

### Payment Webhook Security

```typescript
// Security measures:
1. Validate MercadoPago signature
2. Verify webhook timestamp (prevent replay attacks)
3. Use HTTPS only
4. Implement idempotency keys
5. Log all webhook attempts
6. Alert on suspicious activity
7. Rate limit webhook endpoint
```

### Authorization

```typescript
// Access control:
1. Waiters can only generate PIX for their orders
2. Waiters can only add items to their orders
3. Cashier can view all payment statuses
4. Kitchen can view but not modify payment status
5. Admin can override payment status (with audit log)
```

## Visual Design

### Status Badge Colors

```css
/* Order Status (existing) */
.status-pending-payment { 
  background: #fef3c7; 
  color: #92400e; 
}
.status-in-preparation { 
  background: #dbeafe; 
  color: #1e40af; 
}
.status-ready { 
  background: #d1fae5; 
  color: #065f46; 
}
.status-completed { 
  background: #f3f4f6; 
  color: #374151; 
}

/* Payment Status (new) */
.payment-pending { 
  background: #fed7aa; 
  color: #c2410c; 
  border: 1px solid #fb923c;
}
.payment-confirmed { 
  background: #dbeafe; 
  color: #1e40af; 
  border: 1px solid #60a5fa;
}
.payment-failed { 
  background: #fecaca; 
  color: #dc2626; 
  border: 1px solid #f87171;
}
```

### Header Layout

```css
.uniform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-height: 4rem;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 768px) {
  .uniform-header {
    padding: 0.75rem 1rem;
    min-height: 3.5rem;
  }
  
  .header-title {
    font-size: 1.125rem;
  }
}
```

### PIX Modal Design

```css
.pix-modal {
  max-width: 400px;
  padding: 2rem;
  text-align: center;
}

.pix-qr-code {
  width: 250px;
  height: 250px;
  margin: 1.5rem auto;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.pix-expiration {
  font-size: 0.875rem;
  color: #f59e0b;
  margin-top: 1rem;
}
```

## Migration Strategy

### Phase 1: Database Migration
1. Run schema migration
2. Update existing orders with payment_status
3. Verify data integrity
4. Create indexes

### Phase 2: Backend Updates
1. Update order creation logic
2. Implement PIX generation endpoint
3. Update webhook processing
4. Add item addition endpoint

### Phase 3: Frontend Updates
1. Update UI components
2. Implement dual status display
3. Add PIX generation modal
4. Update headers

### Phase 4: Testing & Rollout
1. Run comprehensive tests
2. Deploy to staging
3. User acceptance testing
4. Production deployment
5. Monitor for issues

## Monitoring and Observability

### Key Metrics

```typescript
// Track these metrics:
1. PIX generation success rate
2. Payment confirmation latency
3. Webhook processing time
4. Order creation by type (waiter vs customer)
5. Commission calculation accuracy
6. Item addition frequency
7. Payment status distribution
```

### Logging

```typescript
// Log these events:
1. PIX generation attempts (success/failure)
2. Payment webhook received
3. Payment status changes
4. Item additions to orders
5. Commission calculations
6. Authorization failures
7. API errors
```

### Alerts

```typescript
// Alert on:
1. High PIX generation failure rate
2. Webhook processing failures
3. Payment confirmation delays
4. Database errors
5. Security events (invalid signatures)
6. Commission calculation mismatches
```
