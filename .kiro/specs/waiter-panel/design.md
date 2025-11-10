# Design Document

## Overview

The Waiter Panel feature enhances the existing waiter functionality to provide a complete order management solution. The design builds upon the current React/TypeScript frontend with Supabase backend, extending the existing order flow to support waiter-assisted ordering with customer data collection, order notes, and optional payment generation.

## Architecture

### Frontend Architecture
- **Waiter Order Interface**: Enhanced menu interface for waiters to place orders
- **Customer Info Collection**: Form component for capturing customer details
- **Order Notes Component**: Text input for special instructions
- **PIX QR Generator**: Optional payment QR code generation
- **Admin Reporting Dashboard**: Enhanced admin interface with waiter filtering

### Backend Architecture
- **Database Extensions**: Additional fields in orders table for notes and enhanced waiter tracking
- **Order Creation API**: Modified order creation logic for waiter-assisted orders
- **Reporting Queries**: New database queries for waiter-specific reporting
- **Payment Integration**: Optional PIX QR code generation for waiter orders

## Components and Interfaces

### 1. Enhanced Waiter Menu Interface (`WaiterOrderInterface`)

**Purpose**: Provide waiters with an intuitive menu interface for order placement

**Key Features**:
- Full menu display with categories and items
- Cart management with real-time totals
- Customer information form integration
- Order notes input field
- Order submission with waiter attribution

**Props Interface**:
```typescript
interface WaiterOrderInterfaceProps {
  waiterId: string;
  onOrderComplete: (orderId: string) => void;
}
```

### 2. Customer Information Component (`CustomerInfoForm`)

**Purpose**: Collect and validate customer contact information

**Key Features**:
- Name input with validation
- WhatsApp number input with format validation (11 digits)
- Real-time validation feedback
- Form state management

**Props Interface**:
```typescript
interface CustomerInfoFormProps {
  onCustomerInfoChange: (info: CustomerInfo) => void;
  initialData?: CustomerInfo;
}

interface CustomerInfo {
  name: string;
  phone: string;
}
```

### 3. Order Notes Component (`OrderNotesInput`)

**Purpose**: Allow waiters to add special instructions or modifications

**Key Features**:
- Multi-line text input (max 500 characters)
- Character count display
- Optional field with clear labeling

**Props Interface**:
```typescript
interface OrderNotesInputProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  maxLength?: number;
}
```

### 4. PIX QR Generator Component (`PIXQRGenerator`)

**Purpose**: Generate optional payment QR codes for waiter orders

**Key Features**:
- Integration with existing MercadoPago PIX system
- QR code display with payment instructions
- Payment status monitoring
- Optional usage (not required for order completion)

**Props Interface**:
```typescript
interface PIXQRGeneratorProps {
  orderId: string;
  amount: number;
  customerInfo: CustomerInfo;
  onPaymentComplete?: (paymentId: string) => void;
}
```

### 5. Enhanced Admin Reporting (`AdminWaiterReports`)

**Purpose**: Provide admin interface for waiter performance tracking

**Key Features**:
- Waiter selection dropdown
- Order filtering by waiter
- Sales totals and commission calculations
- Date range filtering
- Export functionality

**Props Interface**:
```typescript
interface AdminWaiterReportsProps {
  onWaiterSelect: (waiterId: string) => void;
  dateRange?: DateRange;
}
```

## Data Models

### Enhanced Orders Table

**New Fields**:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_waiter BOOLEAN DEFAULT FALSE;
```

**Existing Relevant Fields**:
- `waiter_id`: UUID reference to auth.users
- `commission_amount`: Numeric for commission calculation
- `customer_name`: Text for customer identification
- `customer_phone`: Text for WhatsApp notifications

### Waiter Performance View

**Purpose**: Optimized view for admin reporting

```sql
CREATE OR REPLACE VIEW waiter_performance AS
SELECT 
  w.id as waiter_id,
  w.name as waiter_name,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as gross_sales,
  COALESCE(SUM(o.commission_amount), 0) as total_commission,
  DATE_TRUNC('day', o.created_at) as order_date
FROM waiters w
LEFT JOIN orders o ON w.id = o.waiter_id
WHERE o.status != 'cancelled'
GROUP BY w.id, w.name, DATE_TRUNC('day', o.created_at);
```

## Error Handling

### Frontend Error Handling

1. **Form Validation Errors**:
   - Real-time validation for customer phone numbers
   - Required field validation for customer name
   - Character limit enforcement for order notes

2. **Network Errors**:
   - Retry mechanisms for order submission
   - Offline state handling with local storage
   - User-friendly error messages with recovery options

3. **Authentication Errors**:
   - Waiter session validation
   - Automatic redirect to login on session expiry
   - Role-based access control enforcement

### Backend Error Handling

1. **Database Constraints**:
   - Foreign key validation for waiter_id
   - Data type validation for phone numbers
   - Transaction rollback on order creation failures

2. **Payment Integration Errors**:
   - PIX generation failure handling
   - Payment timeout management
   - Webhook processing error recovery

## Testing Strategy

### Unit Testing

1. **Component Testing**:
   - Customer info form validation logic
   - Order notes character limit enforcement
   - Cart calculation accuracy
   - PIX QR code generation

2. **Service Testing**:
   - Order creation with waiter attribution
   - Customer data validation functions
   - Commission calculation logic
   - Reporting query accuracy

### Integration Testing

1. **Order Flow Testing**:
   - End-to-end waiter order placement
   - Customer notification integration
   - Kitchen order display verification
   - Admin reporting data accuracy

2. **Payment Integration Testing**:
   - PIX QR code generation and validation
   - Payment webhook processing
   - Order status updates on payment

### User Acceptance Testing

1. **Waiter Workflow Testing**:
   - Order placement efficiency
   - Customer data collection accuracy
   - Notes functionality usability
   - PIX generation when needed

2. **Admin Reporting Testing**:
   - Waiter performance data accuracy
   - Filtering functionality
   - Commission calculation verification
   - Export feature validation

## Performance Considerations

### Frontend Optimizations

1. **Menu Loading**:
   - Implement menu item caching
   - Lazy loading for menu categories
   - Optimistic UI updates for cart operations

2. **Real-time Updates**:
   - Efficient Supabase subscription management
   - Debounced form validation
   - Minimal re-renders for cart updates

### Backend Optimizations

1. **Database Queries**:
   - Indexed queries for waiter reporting
   - Efficient joins for order aggregation
   - Pagination for large order lists

2. **API Performance**:
   - Batch order item creation
   - Optimized waiter performance queries
   - Cached commission calculations

## Security Considerations

### Authentication & Authorization

1. **Waiter Access Control**:
   - Role-based route protection
   - Waiter-specific order access (RLS policies)
   - Session management and timeout

2. **Data Protection**:
   - Customer phone number encryption
   - Secure order notes storage
   - Admin-only access to reporting data

### Input Validation

1. **Frontend Validation**:
   - Phone number format validation
   - XSS prevention in order notes
   - Input sanitization for customer names

2. **Backend Validation**:
   - Server-side phone number validation
   - SQL injection prevention
   - Order amount validation

## Integration Points

### Existing System Integration

1. **Menu System**:
   - Reuse existing menu item components
   - Maintain cart functionality compatibility
   - Preserve existing pricing logic

2. **Kitchen Interface**:
   - Display waiter-created orders
   - Show order notes in kitchen view
   - Maintain existing order status workflow

3. **Notification System**:
   - WhatsApp notifications for waiter orders
   - Customer notification preferences
   - Order status update notifications

### External Service Integration

1. **MercadoPago PIX**:
   - Optional PIX QR code generation
   - Payment webhook handling
   - Order status synchronization

2. **WhatsApp Integration**:
   - Customer notification delivery
   - Order confirmation messages
   - Payment receipt notifications