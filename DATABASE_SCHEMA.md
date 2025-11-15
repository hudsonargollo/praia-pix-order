# Database Schema Documentation

## Overview

This document describes the database schema for the Coco Loko Açaiteria application, with special focus on the Waiter Payment Workflow feature.

## Table of Contents

1. [Orders Table](#orders-table)
2. [Order Items Table](#order-items-table)
3. [Profiles Table](#profiles-table)
4. [Menu Items Table](#menu-items-table)
5. [Payment Webhooks Table](#payment-webhooks-table)
6. [Indexes](#indexes)
7. [Constraints](#constraints)
8. [Triggers](#triggers)
9. [RLS Policies](#rls-policies)

---

## Orders Table

The `orders` table is the core of the order management system, tracking both order status and payment status independently.

### Schema

```sql
CREATE TABLE public.orders (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order Information
  order_number TEXT UNIQUE NOT NULL,
  table_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  
  -- Order Status (preparation workflow)
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN (
      'pending_payment',
      'in_preparation',
      'ready',
      'completed',
      'cancelled'
    )),
  
  -- Payment Status (independent from order status)
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN (
      'pending',
      'confirmed',
      'failed',
      'refunded'
    )),
  
  -- Financial Information
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Waiter Information
  waiter_id UUID REFERENCES auth.users(id),
  created_by_waiter BOOLEAN DEFAULT false,
  
  -- PIX Payment Information
  pix_qr_code TEXT,
  pix_generated_at TIMESTAMP WITH TIME ZONE,
  pix_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- MercadoPago Integration
  mercadopago_payment_id TEXT,
  mercadopago_preference_id TEXT,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### Field Descriptions

#### Order Status Fields

- **status**: Tracks the preparation/fulfillment state of the order
  - `pending_payment`: Order created, waiting for payment (customer orders)
  - `in_preparation`: Order is being prepared in kitchen
  - `ready`: Order is ready for pickup/delivery
  - `completed`: Order has been delivered to customer
  - `cancelled`: Order was cancelled

- **payment_status**: Tracks the payment state independently
  - `pending`: Payment not yet received
  - `confirmed`: Payment confirmed via webhook
  - `failed`: Payment attempt failed
  - `refunded`: Payment was refunded

#### Waiter Payment Workflow Fields

- **payment_status**: Added in migration `20251114000004`
  - Allows orders to be in preparation while payment is pending
  - Enables separate tracking of order fulfillment and payment
  
- **payment_confirmed_at**: Timestamp when payment was confirmed
  - Set by MercadoPago webhook
  - Used for commission calculations
  - Null until payment confirmed

- **pix_generated_at**: When PIX QR code was generated
  - Set when waiter clicks "Gerar PIX"
  - Used to track PIX generation attempts
  - Helps with debugging payment issues

- **pix_qr_code**: Stores the PIX QR code data
  - Base64 encoded image or PIX copy-paste code
  - Cleared when items are added to order
  - Expires after configured time (typically 30 minutes)

- **pix_expires_at**: PIX expiration timestamp
  - Calculated as `pix_generated_at + 30 minutes`
  - Used to determine if PIX needs regeneration
  - Prevents use of expired payment codes

#### Commission Fields

- **commission_amount**: Waiter's commission for the order
  - Calculated as percentage of `total_amount` (typically 10%)
  - Only counted in reports when `payment_status='confirmed'`
  - Recalculated when items are added

- **created_by_waiter**: Boolean flag indicating waiter-created order
  - `true`: Order created by waiter (goes directly to preparation)
  - `false`: Order created by customer (requires payment first)

### Status Transitions

#### Customer Order Flow
```
pending_payment → in_preparation → ready → completed
       ↓
   cancelled
```

#### Waiter Order Flow
```
in_preparation → ready → completed
       ↓
   cancelled
```

#### Payment Status Flow
```
pending → confirmed
   ↓
 failed → pending (retry)
   ↓
confirmed → refunded (admin action)
```

### Example Queries

#### Get Orders with Pending Payment
```sql
SELECT 
  id,
  order_number,
  customer_name,
  total_amount,
  payment_status,
  status,
  created_at
FROM orders
WHERE payment_status = 'pending'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

#### Get Waiter's Confirmed Commission
```sql
SELECT 
  waiter_id,
  SUM(commission_amount) as total_commission,
  COUNT(*) as order_count
FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND payment_status = 'confirmed'
  AND created_at >= CURRENT_DATE
  AND deleted_at IS NULL
GROUP BY waiter_id;
```

#### Get Orders Needing PIX Generation
```sql
SELECT 
  id,
  order_number,
  total_amount,
  waiter_id
FROM orders
WHERE payment_status = 'pending'
  AND status = 'in_preparation'
  AND (pix_qr_code IS NULL OR pix_expires_at < NOW())
  AND deleted_at IS NULL;
```

---

## Order Items Table

Stores individual items within each order.

### Schema

```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES menu_items(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Field Descriptions

- **order_id**: Foreign key to orders table
- **product_id**: Foreign key to menu_items table
- **product_name**: Denormalized product name (for historical record)
- **quantity**: Number of items ordered
- **price**: Price per item at time of order
- **notes**: Special instructions for this item

### Example Queries

#### Get All Items for an Order
```sql
SELECT 
  oi.id,
  oi.product_name,
  oi.quantity,
  oi.price,
  oi.notes,
  (oi.quantity * oi.price) as subtotal
FROM order_items oi
WHERE oi.order_id = 'ORDER_ID'
ORDER BY oi.created_at;
```

#### Calculate Order Total from Items
```sql
SELECT 
  order_id,
  SUM(quantity * price) as total
FROM order_items
WHERE order_id = 'ORDER_ID'
GROUP BY order_id;
```

---

## Profiles Table

Stores user profile information and roles.

### Schema

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN (
      'customer',
      'waiter',
      'kitchen',
      'cashier',
      'admin'
    )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Roles

- **customer**: Can browse menu and create orders
- **waiter**: Can create orders, generate PIX, add items, view commissions
- **kitchen**: Can view and update order preparation status
- **cashier**: Can view all orders and manage payments
- **admin**: Full access to all features

---

## Menu Items Table

Stores products available for ordering.

### Schema

```sql
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

---

## Payment Webhooks Table

Logs all webhook calls from MercadoPago for debugging and auditing.

### Schema

```sql
CREATE TABLE public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  payment_id TEXT,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Field Descriptions

- **order_id**: Associated order (if found)
- **payment_id**: MercadoPago payment ID
- **event_type**: Type of webhook event (e.g., 'payment.updated')
- **payload**: Full webhook payload as JSON
- **processed**: Whether webhook was successfully processed
- **error**: Error message if processing failed

---

## Indexes

Performance indexes for common queries.

### Orders Table Indexes

```sql
-- Payment status queries
CREATE INDEX idx_orders_payment_status 
ON orders(payment_status)
WHERE deleted_at IS NULL;

-- Waiter-specific payment queries
CREATE INDEX idx_orders_waiter_payment 
ON orders(waiter_id, payment_status)
WHERE waiter_id IS NOT NULL AND deleted_at IS NULL;

-- Combined status filtering
CREATE INDEX idx_orders_status_payment 
ON orders(status, payment_status)
WHERE deleted_at IS NULL;

-- Date-based queries
CREATE INDEX idx_orders_created_at 
ON orders(created_at DESC)
WHERE deleted_at IS NULL;

-- PIX expiration checks
CREATE INDEX idx_orders_pix_expires 
ON orders(pix_expires_at)
WHERE pix_expires_at IS NOT NULL AND deleted_at IS NULL;
```

### Order Items Indexes

```sql
-- Order lookup
CREATE INDEX idx_order_items_order_id 
ON order_items(order_id);

-- Product lookup
CREATE INDEX idx_order_items_product_id 
ON order_items(product_id);
```

---

## Constraints

### Check Constraints

```sql
-- Order status must be valid
ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN (
  'pending_payment',
  'in_preparation',
  'ready',
  'completed',
  'cancelled'
));

-- Payment status must be valid
ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN (
  'pending',
  'confirmed',
  'failed',
  'refunded'
));

-- Amounts must be non-negative
ALTER TABLE orders
ADD CONSTRAINT orders_total_amount_check
CHECK (total_amount >= 0);

ALTER TABLE orders
ADD CONSTRAINT orders_commission_amount_check
CHECK (commission_amount >= 0);

-- Order items quantity must be positive
ALTER TABLE order_items
ADD CONSTRAINT order_items_quantity_check
CHECK (quantity > 0);
```

### Foreign Key Constraints

```sql
-- Order items reference orders
ALTER TABLE order_items
ADD CONSTRAINT order_items_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id)
ON DELETE CASCADE;

-- Orders reference waiters
ALTER TABLE orders
ADD CONSTRAINT orders_waiter_id_fkey
FOREIGN KEY (waiter_id) REFERENCES auth.users(id)
ON DELETE SET NULL;
```

---

## Triggers

### Update Timestamp Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to orders table
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply to order_items table
CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## RLS Policies

Row Level Security policies control data access based on user roles.

### Orders Table Policies

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
TO authenticated
USING (
  customer_phone = (SELECT phone FROM profiles WHERE id = auth.uid())
  OR auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('waiter', 'kitchen', 'cashier', 'admin')
  )
);

-- Waiters can create orders
CREATE POLICY "Waiters can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('waiter', 'admin')
  )
);

-- Waiters can update their own orders
CREATE POLICY "Waiters can update own orders"
ON orders FOR UPDATE
TO authenticated
USING (
  waiter_id = auth.uid()
  OR auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('kitchen', 'cashier', 'admin')
  )
);

-- Staff can view all orders
CREATE POLICY "Staff can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('waiter', 'kitchen', 'cashier', 'admin')
  )
);
```

---

## Migration History

### 20251114000004 - Add Payment Status Fields

This migration added the waiter payment workflow functionality:

```sql
-- Add payment status tracking
ALTER TABLE orders 
ADD COLUMN payment_status TEXT DEFAULT 'pending'
CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded'));

-- Add payment timestamps
ALTER TABLE orders 
ADD COLUMN payment_confirmed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN pix_generated_at TIMESTAMP WITH TIME ZONE;

-- Add PIX data storage
ALTER TABLE orders 
ADD COLUMN pix_qr_code TEXT;

ALTER TABLE orders 
ADD COLUMN pix_expires_at TIMESTAMP WITH TIME ZONE;

-- Create performance indexes
CREATE INDEX idx_orders_payment_status 
ON orders(payment_status);

CREATE INDEX idx_orders_waiter_payment 
ON orders(waiter_id, payment_status) 
WHERE waiter_id IS NOT NULL;

CREATE INDEX idx_orders_status_payment 
ON orders(status, payment_status);

-- Migrate existing data
UPDATE orders 
SET payment_status = 'confirmed',
    payment_confirmed_at = updated_at
WHERE status = 'completed' 
AND payment_status IS NULL;
```

---

## Best Practices

### Query Optimization

1. **Always filter by deleted_at**:
```sql
WHERE deleted_at IS NULL
```

2. **Use indexes for common filters**:
```sql
-- Good: Uses idx_orders_payment_status
WHERE payment_status = 'pending'

-- Good: Uses idx_orders_waiter_payment
WHERE waiter_id = 'ID' AND payment_status = 'pending'
```

3. **Avoid SELECT ***:
```sql
-- Good: Select only needed columns
SELECT id, order_number, total_amount, payment_status
FROM orders;
```

### Data Integrity

1. **Use transactions for related updates**:
```sql
BEGIN;
  UPDATE orders SET total_amount = 100 WHERE id = 'ID';
  INSERT INTO order_items (...) VALUES (...);
COMMIT;
```

2. **Validate before insert/update**:
```sql
-- Check order exists and is in valid state
SELECT status, payment_status 
FROM orders 
WHERE id = 'ID'
FOR UPDATE;
```

3. **Use soft deletes**:
```sql
-- Don't DELETE, set deleted_at
UPDATE orders 
SET deleted_at = NOW() 
WHERE id = 'ID';
```

### Security

1. **Always use RLS policies**
2. **Validate user permissions in application code**
3. **Use service role key only in backend functions**
4. **Never expose sensitive data in client-side code**

---

## Backup and Recovery

### Backup Important Data

```sql
-- Backup orders
COPY (
  SELECT * FROM orders 
  WHERE deleted_at IS NULL
) TO '/tmp/orders_backup.csv' CSV HEADER;

-- Backup order items
COPY (
  SELECT * FROM order_items
) TO '/tmp/order_items_backup.csv' CSV HEADER;
```

### Restore from Backup

```sql
-- Restore orders
COPY orders FROM '/tmp/orders_backup.csv' CSV HEADER;

-- Restore order items
COPY order_items FROM '/tmp/order_items_backup.csv' CSV HEADER;
```

---

## Monitoring Queries

### Check Payment Status Distribution

```sql
SELECT 
  payment_status,
  COUNT(*) as count,
  SUM(total_amount) as total_amount
FROM orders
WHERE deleted_at IS NULL
  AND created_at >= CURRENT_DATE
GROUP BY payment_status;
```

### Find Stuck Orders

```sql
-- Orders in preparation for more than 2 hours
SELECT 
  id,
  order_number,
  status,
  payment_status,
  created_at,
  AGE(NOW(), created_at) as age
FROM orders
WHERE status = 'in_preparation'
  AND created_at < NOW() - INTERVAL '2 hours'
  AND deleted_at IS NULL;
```

### Check PIX Expiration

```sql
-- Expired PIX codes
SELECT 
  id,
  order_number,
  pix_generated_at,
  pix_expires_at,
  payment_status
FROM orders
WHERE pix_expires_at < NOW()
  AND payment_status = 'pending'
  AND deleted_at IS NULL;
```
