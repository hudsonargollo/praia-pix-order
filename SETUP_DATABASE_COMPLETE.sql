-- Complete Database Setup for Coco Loko Açaiteria
-- Run this entire script in Supabase SQL Editor
-- This will set up all missing tables and fields

-- ============================================
-- PART 1: Add Missing Payment Fields to Orders
-- ============================================

-- Add mercadopago_payment_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'mercadopago_payment_id'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN mercadopago_payment_id TEXT;
        
        COMMENT ON COLUMN public.orders.mercadopago_payment_id IS 'Mercado Pago payment ID for tracking';
    END IF;
END $$;

-- Add payment_expires_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_expires_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_expires_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.payment_expires_at IS 'When the PIX payment expires (typically 15 minutes)';
    END IF;
END $$;

-- Add payment_confirmed_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_confirmed_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_confirmed_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.payment_confirmed_at IS 'When payment was confirmed';
    END IF;
END $$;

-- Add ready_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'ready_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN ready_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.ready_at IS 'When order was marked as ready for pickup';
    END IF;
END $$;

-- Add kitchen_notified_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'kitchen_notified_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN kitchen_notified_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.kitchen_notified_at IS 'When kitchen was notified about paid order';
    END IF;
END $$;

-- Add notified_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'notified_at'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN notified_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.orders.notified_at IS 'When customer was last notified via WhatsApp';
    END IF;
END $$;

-- ============================================
-- PART 2: Create Notification Templates Table
-- ============================================

-- Create notification templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_templates_template_type') THEN
        CREATE INDEX idx_notification_templates_template_type ON notification_templates(template_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_templates_is_active') THEN
        CREATE INDEX idx_notification_templates_is_active ON notification_templates(is_active);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read notification_templates" ON notification_templates;
DROP POLICY IF EXISTS "Authenticated users can update notification_templates" ON notification_templates;
DROP POLICY IF EXISTS "Service role can manage notification_templates" ON notification_templates;

-- Create RLS policies
CREATE POLICY "Authenticated users can read notification_templates" ON notification_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update notification_templates" ON notification_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage notification_templates" ON notification_templates
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- PART 3: Insert Default Templates
-- ============================================

-- Delete existing templates
DELETE FROM notification_templates;

-- Insert default templates with detailed order information
INSERT INTO notification_templates (template_type, content, variables, is_active) VALUES 
(
  'payment_confirmed',
  '🌴 *Coco Loko Açaiteria* 🌴

✅ *Pedido Confirmado!*

📋 *Pedido #{{orderNumber}}*
👤 *Cliente:* {{customerName}}
📱 *Telefone:* {{customerPhone}}

📝 *Itens do Pedido:*
{{itemsList}}

💰 *Total:* {{totalAmount}}

⏰ *Tempo estimado:* {{estimatedTime}}

Você receberá uma nova mensagem quando seu pedido estiver pronto para retirada!

Obrigado por escolher a Coco Loko! 🥥🌊',
  ARRAY['orderNumber', 'customerName', 'customerPhone', 'itemsList', 'totalAmount', 'estimatedTime'],
  true
),
(
  'preparing',
  '🌴 *Coco Loko Açaiteria* 🌴

👨‍🍳 *Pedido em Preparo!*

📋 *Pedido #{{orderNumber}}*
👤 *Cliente:* {{customerName}}

Seu pedido está sendo preparado com carinho!

⏰ *Tempo estimado:* {{estimatedTime}}

Em breve você receberá uma notificação quando estiver pronto! 🥥🌊',
  ARRAY['orderNumber', 'customerName', 'estimatedTime'],
  true
),
(
  'ready',
  '🌴 *Coco Loko Açaiteria* 🌴

🎉 *Pedido Pronto!*

📋 *Pedido #{{orderNumber}}*
👤 *Cliente:* {{customerName}}

✨ Seu pedido está pronto para retirada no balcão!

Por favor, apresente este número do pedido: *#{{orderNumber}}*

Aproveite seu açaí! 🥥🌊',
  ARRAY['orderNumber', 'customerName'],
  true
),
(
  'custom',
  '🌴 *Coco Loko Açaiteria* 🌴

📋 *Pedido #{{orderNumber}}*
👤 *Cliente:* {{customerName}}

{{customMessage}}

🥥🌊',
  ARRAY['orderNumber', 'customerName', 'customMessage'],
  true
);

-- ============================================
-- PART 4: Verification Queries
-- ============================================

-- Verify orders table has all required columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name IN (
        'mercadopago_payment_id',
        'payment_expires_at',
        'payment_confirmed_at',
        'ready_at',
        'kitchen_notified_at',
        'notified_at'
    )
ORDER BY column_name;

-- Verify notification templates were created
SELECT 
  template_type,
  LEFT(content, 50) as content_preview,
  array_length(variables, 1) as variable_count,
  is_active
FROM notification_templates
ORDER BY template_type;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE '✅ Payment fields added to orders table';
    RAISE NOTICE '✅ Notification templates table created';
    RAISE NOTICE '✅ Default WhatsApp templates inserted';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to /whatsapp-admin to connect WhatsApp';
    RAISE NOTICE '2. Create a test order and mark it as paid';
    RAISE NOTICE '3. Check if notifications are sent';
END $$;
