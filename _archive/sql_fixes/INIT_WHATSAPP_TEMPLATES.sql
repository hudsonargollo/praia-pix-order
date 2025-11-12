-- Initialize WhatsApp Notification Templates
-- Run this in Supabase SQL Editor to set up default message templates

-- Delete existing templates (if any)
DELETE FROM notification_templates;

-- 1. Payment Confirmed Template
INSERT INTO notification_templates (template_type, content, variables, is_active)
VALUES (
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
);

-- 2. Order Ready Template
INSERT INTO notification_templates (template_type, content, variables, is_active)
VALUES (
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
);

-- 3. Order Preparing Template (Optional)
INSERT INTO notification_templates (template_type, content, variables, is_active)
VALUES (
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
);

-- 4. Custom Message Template
INSERT INTO notification_templates (template_type, content, variables, is_active)
VALUES (
  'custom',
  '🌴 *Coco Loko Açaiteria* 🌴

📋 *Pedido #{{orderNumber}}*
👤 *Cliente:* {{customerName}}

{{customMessage}}

🥥🌊',
  ARRAY['orderNumber', 'customerName', 'customMessage'],
  true
);

-- Verify templates were created
SELECT 
  template_type,
  LEFT(content, 50) as content_preview,
  array_length(variables, 1) as variable_count,
  is_active,
  created_at
FROM notification_templates
ORDER BY template_type;

-- Show full content of each template
SELECT 
  template_type,
  content,
  variables
FROM notification_templates
ORDER BY template_type;
