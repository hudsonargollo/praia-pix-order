# 🛠️ Manual Supabase Deployment Guide

## ✅ Already Completed
- **Edge Functions**: Successfully deployed (create-waiter, delete-waiter, list-waiters)
- **Frontend**: Deployed to https://1b45495f.coco-loko-acaiteria.pages.dev

## 🎯 Manual Database Migration Steps

Since the Supabase CLI is stuck at "Initialising login role...", follow these steps to manually apply the pending migrations:

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql
2. Login to your Supabase account
3. Navigate to SQL Editor

### Step 2: Apply Migrations in Order

Execute these SQL files **in this exact order**:

#### 1. Add Test Product
```sql
-- From: 20251106000007_add_test_product.sql
INSERT INTO menu_items (name, description, price, category, image_url, available) VALUES
('Açaí Tradicional', 'Açaí puro batido com guaraná, servido com granola e banana', 12.00, 'acai', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400', true);
```

#### 2. Create WhatsApp Sessions Table
```sql
-- From: 20251107000001_create_whatsapp_sessions_table.sql
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read sessions" ON public.whatsapp_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update sessions" ON public.whatsapp_sessions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert sessions" ON public.whatsapp_sessions
  FOR INSERT TO authenticated WITH CHECK (true);
```

#### 3. Update WhatsApp Notifications Table
```sql
-- From: 20251107000002_update_whatsapp_notifications_table.sql
ALTER TABLE public.whatsapp_notifications 
ADD COLUMN IF NOT EXISTS session_name TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS message_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_session ON public.whatsapp_notifications(session_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON public.whatsapp_notifications(delivery_status);
```

#### 4. Create Notification Templates Table
```sql
-- From: 20251107000003_create_notification_templates_table.sql
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read templates" ON public.notification_templates
  FOR SELECT TO authenticated USING (true);

-- Insert default templates
INSERT INTO public.notification_templates (name, template, description, variables) VALUES
('order_ready', 'Olá {{customer_name}}! Seu pedido #{{order_id}} está pronto para retirada. Total: R$ {{total_amount}}', 'Template for order ready notifications', '["customer_name", "order_id", "total_amount"]'::jsonb),
('payment_confirmed', 'Pagamento confirmado! Seu pedido #{{order_id}} foi recebido e está sendo preparado.', 'Template for payment confirmation', '["order_id"]'::jsonb)
ON CONFLICT (name) DO NOTHING;
```

#### 5. Create WhatsApp Error Logs Table
```sql
-- From: 20251107000004_create_whatsapp_error_logs_table.sql
CREATE TABLE IF NOT EXISTS public.whatsapp_error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  phone_number TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read error logs" ON public.whatsapp_error_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert error logs" ON public.whatsapp_error_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_session ON public.whatsapp_error_logs(session_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_error_logs_created_at ON public.whatsapp_error_logs(created_at);
```

#### 6. Create WhatsApp Opt-out Table
```sql
-- From: 20251107000005_create_whatsapp_opt_out_table.sql
CREATE TABLE IF NOT EXISTS public.whatsapp_opt_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

-- Enable RLS
ALTER TABLE public.whatsapp_opt_out ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read opt-out list" ON public.whatsapp_opt_out
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage opt-out list" ON public.whatsapp_opt_out
  FOR ALL TO authenticated USING (true);
```

#### 7. Make Table Number Nullable
```sql
-- From: 20251107000006_make_table_number_nullable.sql
ALTER TABLE public.orders ALTER COLUMN table_number DROP NOT NULL;
```

#### 8. Add Missing Payment Fields
```sql
-- From: 20251107000007_add_missing_payment_fields.sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix',
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at);
```

#### 9. Add Soft Delete
```sql
-- From: 20251108000001_add_soft_delete.sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_order_items_deleted_at ON public.order_items(deleted_at);
```

#### 10. Fix Order Update RLS
```sql
-- From: 20251108000002_fix_order_update_rls.sql
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

CREATE POLICY "Users can update orders" ON public.orders
  FOR UPDATE TO authenticated 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_app_meta_data ->> 'role' IN ('admin', 'kitchen', 'cashier', 'waiter')
    )
    OR auth.uid() = user_id
  );
```

### Step 3: Apply Waiter Module Enhancements

#### 11. Add Waiter Module Fields
```sql
-- From: 20251108150000_add_waiter_module_fields.sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_waiter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00;

-- Create waiter performance view
CREATE OR REPLACE VIEW public.waiter_performance AS
SELECT 
  o.waiter_id,
  u.email as waiter_email,
  u.raw_user_meta_data ->> 'full_name' as waiter_name,
  DATE(o.created_at) as order_date,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) as gross_sales,
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.commission_amount END), 0) as total_commission
FROM public.orders o
JOIN auth.users u ON o.waiter_id = u.id
WHERE o.created_by_waiter = true
  AND o.deleted_at IS NULL
GROUP BY o.waiter_id, u.email, u.raw_user_meta_data ->> 'full_name', DATE(o.created_at);

-- Enable RLS on view
ALTER VIEW public.waiter_performance SET (security_invoker = true);
```

#### 12. Create Waiter RPC Function
```sql
-- From: 20251108150001_create_waiter_rpc_function.sql
CREATE OR REPLACE FUNCTION public.create_waiter_account(
  email TEXT,
  password TEXT,
  full_name TEXT,
  phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  result JSON;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data ->> 'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create waiter accounts';
  END IF;

  -- This is a placeholder - actual user creation should be done via Supabase Auth API
  -- Return success message for now
  result := json_build_object(
    'success', true,
    'message', 'Waiter account creation initiated. Complete via Auth API.',
    'email', email,
    'full_name', full_name
  );

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_waiter_account TO authenticated;
```

### Step 4: Apply Latest Waiter Functions

#### 13. Enhance Waiter Order Management
```sql
-- Execute the content from: supabase/migrations/20251110000001_enhance_waiter_order_management.sql
-- (This file contains the waiter order management enhancements)
```

#### 14. Waiter Order Functions
```sql
-- Execute the content from: supabase/migrations/20251110000002_waiter_order_functions.sql
-- (This file contains the waiter-specific functions)
```

## ✅ Verification Steps

After applying all migrations:

1. **Test Edge Functions**: 
   - Go to https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/functions
   - Verify all 3 functions are deployed

2. **Test Database**:
   - Check that all tables exist
   - Verify RLS policies are active
   - Test sample queries

3. **Test Application**:
   - Visit https://1b45495f.coco-loko-acaiteria.pages.dev
   - Test waiter creation in admin panel
   - Verify order management works

## 🚨 Important Notes

- Execute migrations **in the exact order** listed above
- If any migration fails, check for existing tables/columns first
- Some migrations use `IF NOT EXISTS` to prevent conflicts
- The Edge Functions are already deployed and working

## 📞 Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Verify your database connection
3. Ensure you have admin privileges on the project

**Project ID**: sntxekdwdllwkszclpiq  
**Dashboard**: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq