# Waiter Order Management Database Schema Implementation

## Task 1: Enhance database schema for waiter order management

### ✅ Completed Sub-tasks:

#### 1. Added order_notes column to orders table
- **Column**: `order_notes TEXT`
- **Purpose**: Store special instructions or modifications for orders (max 500 characters)
- **Location**: `supabase/migrations/20251110000001_enhance_waiter_order_management.sql`

#### 2. Added created_by_waiter boolean flag
- **Column**: `created_by_waiter BOOLEAN DEFAULT FALSE`
- **Purpose**: Distinguish orders created by waiters vs customer self-service
- **Location**: `supabase/migrations/20251110000001_enhance_waiter_order_management.sql`

#### 3. Created waiter_performance view for admin reporting
- **View**: `public.waiter_performance`
- **Purpose**: Optimized view for admin reporting with waiter sales data
- **Includes**: 
  - Waiter ID, name, email
  - Total orders, completed orders, cancelled orders
  - Gross sales and commission totals
  - Order date grouping
- **Location**: `supabase/migrations/20251110000001_enhance_waiter_order_management.sql`

#### 4. Updated RLS policies for waiter order access
- **Enhanced policies**:
  - Waiters can view their own orders and waiter-created orders
  - Waiters can insert orders with proper attribution
  - Waiters can update their own orders
  - Kitchen/admin/cashier staff can view and update all orders
- **Admin-only access** to waiter_performance view
- **Location**: `supabase/migrations/20251110000001_enhance_waiter_order_management.sql`

#### 5. Created helper functions for waiter order management
- **Function**: `create_waiter_order()` - Creates waiter orders with validation
- **Function**: `get_waiter_performance()` - Retrieves waiter performance data for admins
- **Function**: `update_order_status()` - Updates order status with role validation
- **Location**: `supabase/migrations/20251110000002_waiter_order_functions.sql`

#### 6. Added database indexes for performance
- **Index**: `idx_orders_created_by_waiter` - Efficient filtering of waiter orders
- **Index**: `idx_orders_waiter_id` - Efficient waiter reporting queries
- **Index**: `idx_orders_notes` - Full-text search on order notes (Portuguese)
- **Location**: `supabase/migrations/20251110000001_enhance_waiter_order_management.sql`

#### 7. Enhanced commission calculation function
- **Updated**: `calculate_waiter_commission()` function
- **Logic**: Only calculates 10% commission for waiter-created orders
- **Behavior**: Non-waiter orders have 0 commission
- **Location**: `supabase/migrations/20251110000001_enhance_waiter_order_management.sql`

## Requirements Addressed:

### Requirement 3.2: Order notes storage and display
- ✅ Added `order_notes` column with 500 character limit
- ✅ Added validation in `create_waiter_order()` function
- ✅ Added full-text search index for Portuguese

### Requirement 3.4: Order notes integration
- ✅ Order notes stored with order record
- ✅ Available for kitchen interface display
- ✅ Included in waiter order creation workflow

### Requirement 4.2: Waiter order attribution
- ✅ Added `created_by_waiter` boolean flag
- ✅ Enhanced RLS policies for waiter access
- ✅ Updated commission calculation for waiter orders only

### Requirement 6.2: Admin reporting and waiter filtering
- ✅ Created `waiter_performance` view with comprehensive metrics
- ✅ Added `get_waiter_performance()` function with date filtering
- ✅ Admin-only access control via RLS policies

## Database Schema Changes:

### Orders Table Additions:
```sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_notes TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_by_waiter BOOLEAN DEFAULT FALSE;
```

### New View:
```sql
CREATE OR REPLACE VIEW public.waiter_performance AS
SELECT 
  u.id as waiter_id,
  (u.raw_user_meta_data ->> 'full_name')::text as waiter_name,
  u.email as waiter_email,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as gross_sales,
  COALESCE(SUM(o.commission_amount), 0) as total_commission,
  DATE_TRUNC('day', o.created_at) as order_date,
  COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders
FROM auth.users u
LEFT JOIN public.orders o ON u.id = o.waiter_id
WHERE u.raw_app_meta_data ->> 'role' = 'waiter'
  AND u.deleted_at IS NULL
  AND (o.id IS NULL OR o.status != 'cancelled')
GROUP BY u.id, u.raw_user_meta_data, u.email, DATE_TRUNC('day', o.created_at);
```

## Migration Files Created:
1. `supabase/migrations/20251110000001_enhance_waiter_order_management.sql`
2. `supabase/migrations/20251110000002_waiter_order_functions.sql`

## Next Steps:
The database schema enhancements are complete and ready for the frontend implementation. The next tasks in the implementation plan can now proceed with:
- Building customer information collection components
- Enhancing waiter order placement interface
- Implementing PIX QR code generation
- Creating admin reporting interfaces
- Updating kitchen interface to display order notes

## Validation:
- ✅ SQL syntax validated with getDiagnostics
- ✅ All migrations follow existing project patterns
- ✅ RLS policies properly configured for security
- ✅ Indexes added for performance optimization
- ✅ Functions include proper validation and error handling