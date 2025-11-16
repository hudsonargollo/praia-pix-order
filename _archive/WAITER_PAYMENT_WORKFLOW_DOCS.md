# Waiter Payment Workflow - Documentation Index

## Overview

This document serves as an index to all documentation related to the Waiter Payment Workflow feature. This feature enables waiters to create orders that go directly into preparation while payment is handled separately through manual PIX generation.

## Documentation Files

### 1. [DEPLOYMENT.md](./DEPLOYMENT.md)
**Purpose**: Deployment guide with waiter payment workflow integration

**Key Sections**:
- Deployment verification steps including waiter payment workflow testing
- Database schema changes section documenting payment_status fields
- Payment troubleshooting section with common issues and solutions
- Environment variables for payment integration

**When to Use**:
- Deploying the application to production
- Setting up new environments
- Verifying deployment success
- Troubleshooting deployment issues

### 2. [TROUBLESHOOTING_PAYMENT.md](./TROUBLESHOOTING_PAYMENT.md)
**Purpose**: Comprehensive troubleshooting guide for payment-related issues

**Key Sections**:
- PIX Generation Issues
- Payment Confirmation Issues
- Commission Calculation Issues
- Add Items Issues
- Real-time Updates Issues
- Database Issues
- Common Error Messages
- Emergency Procedures

**When to Use**:
- PIX generation not working
- Payment status not updating
- Commission calculations incorrect
- Real-time updates failing
- Any payment-related bugs or issues

### 3. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
**Purpose**: Complete database schema documentation

**Key Sections**:
- Orders table with payment_status fields
- Order items table
- Profiles and roles
- Indexes for performance
- Constraints and validation
- Triggers and automation
- RLS policies for security
- Migration history
- Best practices and monitoring queries

**When to Use**:
- Understanding database structure
- Writing queries
- Debugging data issues
- Planning schema changes
- Performance optimization

### 4. [COMMISSION_CALCULATION.md](./COMMISSION_CALCULATION.md)
**Purpose**: Detailed commission calculation documentation

**Key Sections**:
- Commission basics and formulas
- Payment status impact (pending vs confirmed)
- Calculation logic and implementation
- TypeScript functions and interfaces
- UI display components
- Troubleshooting commission issues
- Reporting queries
- Best practices

**When to Use**:
- Understanding commission calculations
- Debugging commission issues
- Implementing commission features
- Creating commission reports
- Explaining commission to waiters

## Quick Reference

### Feature Summary

**What It Does**:
- Separates order status from payment status
- Allows waiters to create orders that go directly to kitchen
- Enables manual PIX generation when customer is ready to pay
- Tracks pending vs confirmed commissions
- Supports adding items to orders in preparation

**Key Benefits**:
- Faster order processing (no payment delay)
- Better customer experience
- Accurate commission tracking
- Flexible payment timing
- Real-time status updates

### Key Concepts

#### Order Status vs Payment Status

**Order Status** (preparation workflow):
- `pending_payment` - Waiting for payment (customer orders)
- `in_preparation` - Being prepared in kitchen
- `ready` - Ready for pickup
- `completed` - Delivered to customer
- `cancelled` - Order cancelled

**Payment Status** (independent):
- `pending` - Payment not received
- `confirmed` - Payment confirmed via webhook
- `failed` - Payment attempt failed
- `refunded` - Payment refunded

#### Commission Types

**Confirmed Commission**:
- Orders with `payment_status = 'confirmed'`
- Actual earned commission
- Included in reports and payouts
- Cannot be modified

**Pending Commission**:
- Orders with `payment_status = 'pending'`
- Estimated commission
- May change if order modified
- Not included in confirmed totals

### Common Tasks

#### Check Order Payment Status
```sql
SELECT 
  id,
  order_number,
  status,
  payment_status,
  total_amount,
  commission_amount
FROM orders
WHERE id = 'ORDER_ID';
```

#### Calculate Waiter Commission
```sql
SELECT 
  payment_status,
  COUNT(*) as orders,
  SUM(commission_amount) as commission
FROM orders
WHERE waiter_id = 'WAITER_ID'
  AND created_at >= CURRENT_DATE
GROUP BY payment_status;
```

#### Reset Expired PIX
```sql
UPDATE orders
SET 
  pix_qr_code = NULL,
  pix_generated_at = NULL,
  pix_expires_at = NULL
WHERE pix_expires_at < NOW()
  AND payment_status = 'pending';
```

#### Force Payment Confirmation (Emergency)
```sql
UPDATE orders
SET 
  payment_status = 'confirmed',
  payment_confirmed_at = NOW()
WHERE id = 'ORDER_ID'
  AND payment_status = 'pending';
```

## Architecture Overview

### Database Layer
```
orders table
├── Order status (preparation)
├── Payment status (independent)
├── PIX data (qr_code, timestamps)
├── Commission tracking
└── Waiter association
```

### API Layer
```
Cloudflare Functions
├── /api/orders/generate-pix
│   └── Creates PIX QR code
├── /api/orders/add-items
│   └── Adds items to order
└── /api/mercadopago/webhook
    └── Confirms payment
```

### UI Layer
```
Components
├── StatusBadge (dual status display)
├── PIXQRGenerator (manual PIX)
├── AddItemsModal (add items)
├── CommissionToggle (pending/confirmed)
└── UniformHeader (consistent navigation)
```

### Real-time Layer
```
Supabase Subscriptions
├── Order updates
├── Payment status changes
├── Commission updates
└── PIX generation events
```

## Workflow Diagrams

### Waiter Order Flow
```
1. Waiter creates order
   ↓
2. Order goes to kitchen (status: in_preparation)
   ↓
3. Kitchen prepares order
   ↓
4. Waiter generates PIX when customer ready
   ↓
5. Customer scans QR code and pays
   ↓
6. Webhook confirms payment (payment_status: confirmed)
   ↓
7. Commission becomes confirmed
   ↓
8. Order marked as completed
```

### Customer Order Flow (Existing)
```
1. Customer creates order
   ↓
2. PIX auto-generated (status: pending_payment)
   ↓
3. Customer pays
   ↓
4. Webhook confirms payment
   ↓
5. Order goes to kitchen (status: in_preparation)
   ↓
6. Kitchen prepares and completes
```

### Add Items Flow
```
1. Waiter views order in preparation
   ↓
2. Clicks "Adicionar Item"
   ↓
3. Selects items and quantities
   ↓
4. System recalculates total and commission
   ↓
5. If PIX exists, it's invalidated
   ↓
6. Waiter must regenerate PIX with new amount
```

## Testing Checklist

### Manual Testing

- [ ] Create waiter order (should go to preparation)
- [ ] Verify order shows payment_status='pending'
- [ ] Generate PIX QR code
- [ ] Verify QR code displays correctly
- [ ] Test payment via MercadoPago
- [ ] Verify payment_status updates to 'confirmed'
- [ ] Check commission moves from pending to confirmed
- [ ] Add items to order in preparation
- [ ] Verify total and commission recalculate
- [ ] Verify PIX is invalidated after adding items
- [ ] Test real-time updates across dashboards

### Automated Testing

Test files located in `src/test/`:
- `e2e-waiter-payment-workflow.test.ts` - End-to-end workflow
- `integration-payment-workflow.test.ts` - API integration
- `payment-status-logic.test.ts` - Status logic
- `realtime-payment-verification.test.ts` - Real-time updates
- `payment-status-realtime.test.ts` - Real-time status changes

## Support Resources

### For Developers

1. **Code Reference**:
   - `src/lib/commissionUtils.ts` - Commission calculations
   - `src/components/StatusBadge.tsx` - Status display
   - `functions/api/orders/generate-pix.ts` - PIX generation
   - `functions/api/mercadopago/webhook.ts` - Payment confirmation

2. **Database Reference**:
   - Migration: `supabase/migrations/20251114000004_add_payment_status_fields.sql`
   - Types: `src/integrations/supabase/types.ts`

3. **Testing Reference**:
   - Test suite: `src/test/`
   - Test reports: `src/test/*.md`

### For Operations

1. **Monitoring**:
   - Check Cloudflare Functions logs
   - Monitor Supabase real-time connections
   - Track payment confirmation rates
   - Review commission calculations

2. **Common Issues**:
   - See [TROUBLESHOOTING_PAYMENT.md](./TROUBLESHOOTING_PAYMENT.md)
   - Check webhook logs in MercadoPago dashboard
   - Verify environment variables
   - Test API endpoints manually

3. **Emergency Procedures**:
   - Manual payment confirmation SQL
   - PIX reset procedures
   - Commission recalculation
   - Database rollback steps

### For Waiters

1. **How to Use**:
   - Create order (goes directly to kitchen)
   - Generate PIX when customer ready to pay
   - Show QR code to customer
   - Wait for payment confirmation
   - View confirmed vs pending commissions

2. **Common Questions**:
   - Why is commission pending? (Payment not confirmed yet)
   - Can I add items? (Yes, if order in preparation and payment pending)
   - What if PIX expires? (Generate new one)
   - When do I get paid? (Based on confirmed commissions)

## Version History

### v1.0.0 - Initial Release (2024-11-14)
- Added payment_status field to orders table
- Implemented PIX generation for waiter orders
- Created dual status display system
- Added pending vs confirmed commission tracking
- Implemented add items to orders feature
- Created comprehensive documentation

### Migration: 20251114000004
- Added payment_status column with CHECK constraint
- Added payment timestamps (confirmed_at, generated_at)
- Added PIX data fields (qr_code, expires_at)
- Created performance indexes
- Migrated existing data

## Related Documentation

- [Requirements Document](./.kiro/specs/waiter-payment-workflow/requirements.md)
- [Design Document](./.kiro/specs/waiter-payment-workflow/design.md)
- [Implementation Tasks](./.kiro/specs/waiter-payment-workflow/tasks.md)
- [Waiter Guide](./.kiro/specs/waiter-payment-workflow/WAITER_GUIDE.md)

## Contributing

When updating documentation:

1. Keep all documents in sync
2. Update version history
3. Add examples for new features
4. Include troubleshooting steps
5. Update quick reference sections
6. Test all code examples
7. Review for clarity and completeness

## Feedback

For documentation improvements:
- Open an issue with suggestions
- Submit pull request with changes
- Contact development team
- Update based on user feedback
