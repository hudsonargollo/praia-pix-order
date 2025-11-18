/**
 * WhatsApp Message Variations
 * Multiple message templates that rotate to keep communications fresh and engaging
 */

import { OrderData } from './types';

/**
 * Get a random variation from an array
 */
function getRandomVariation<T>(variations: T[]): T {
  return variations[Math.floor(Math.random() * variations.length)];
}

/**
 * Payment Confirmed Message Variations (5 different versions)
 */
export function getPaymentConfirmedMessage(orderData: OrderData): string {
  const firstName = orderData.customerName.split(' ')[0];
  
  const itemsList = orderData.items
    .map(item => `• ${item.quantity}x ${item.itemName} - R$ ${(item.quantity * item.unitPrice).toFixed(2)}`)
    .join('\n');

  const variations = [
    // Variation 1: Direct and enthusiastic
    `Olá, *${firstName}*! 🎉

Seu pedido acaba de ser confirmado e já está sendo preparado!

📋 *Pedido #${orderData.orderNumber}*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

⏰ Tempo estimado: 15-20 minutos

Você receberá uma notificação quando estiver pronto! 🥥`,

    // Variation 2: Warm and friendly
    `Oi, *${firstName}*! 👋

Confirmamos seu pedido e nossa equipe já começou a preparar tudo com muito carinho!

📝 *Pedido #${orderData.orderNumber}*
${itemsList}

💵 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

🕐 Em breve estará pronto (15-20 min)

Te avisamos quando puder retirar! 🌴`,

    // Variation 3: Professional and clear
    `*${firstName}*, tudo certo! ✅

Pagamento confirmado. Seu pedido está em preparo.

🔖 *#${orderData.orderNumber}*
${itemsList}

💳 *Pago:* R$ ${orderData.totalAmount.toFixed(2)}

⏱️ Previsão: 15-20 minutos

Aguarde nossa próxima mensagem! 🥥`,

    // Variation 4: Casual and upbeat
    `E aí, *${firstName}*! 🤙

Pedido confirmado e já tá rolando na cozinha!

🎯 *Pedido #${orderData.orderNumber}*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

⏰ Fica de olho! Em 15-20 min tá pronto

Logo te chamamos! 🌊`,

    // Variation 5: Concise and efficient
    `*${firstName}*, pedido confirmado! ✓

Já estamos preparando:

📦 *#${orderData.orderNumber}*
${itemsList}

💵 R$ ${orderData.totalAmount.toFixed(2)}

⏰ 15-20 min

Te avisamos quando estiver pronto! 🥥🌴`
  ];

  return getRandomVariation(variations);
}

/**
 * Order Ready Message Variations (5 different versions)
 */
export function getOrderReadyMessage(orderData: OrderData): string {
  const firstName = orderData.customerName.split(' ')[0];
  
  const itemsList = orderData.items
    .map(item => `• ${item.quantity}x ${item.itemName}`)
    .join('\n');

  const variations = [
    // Variation 1: Excited and inviting
    `*${firstName}*, seu pedido está pronto! 🎉

Pode vir buscar no balcão!

📋 *Pedido #${orderData.orderNumber}*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

Te esperamos! 🥥`,

    // Variation 2: Friendly and warm
    `Oi, *${firstName}*! 👋

Tudo prontinho aqui! Pode vir retirar seu pedido no balcão.

🎯 *#${orderData.orderNumber}*
${itemsList}

💵 R$ ${orderData.totalAmount.toFixed(2)}

Até já! 🌴`,

    // Variation 3: Direct and clear
    `*${firstName}*, pronto para retirada! ✅

Seu pedido te aguarda no balcão.

📦 *Pedido #${orderData.orderNumber}*
${itemsList}

💳 R$ ${orderData.totalAmount.toFixed(2)}

Obrigado! 🥥`,

    // Variation 4: Casual and cool
    `E aí, *${firstName}*! 🤙

Tá pronto! Cola aqui no balcão pra buscar.

🔖 *#${orderData.orderNumber}*
${itemsList}

💰 R$ ${orderData.totalAmount.toFixed(2)}

Valeu! 🌊`,

    // Variation 5: Professional and efficient
    `*${firstName}*, pedido pronto! ✓

Retire no balcão:

📝 *#${orderData.orderNumber}*
${itemsList}

💵 R$ ${orderData.totalAmount.toFixed(2)}

Aguardamos você! 🥥🌴`
  ];

  return getRandomVariation(variations);
}

/**
 * Order Preparing Message Variations (5 different versions)
 */
export function getOrderPreparingMessage(orderData: OrderData): string {
  const firstName = orderData.customerName.split(' ')[0];
  
  const itemsList = orderData.items
    .map(item => `• ${item.quantity}x ${item.itemName}`)
    .join('\n');

  const variations = [
    // Variation 1: Enthusiastic
    `*${firstName}*, seu pedido entrou na cozinha! 👨‍🍳

Estamos preparando tudo com carinho!

📋 *Pedido #${orderData.orderNumber}*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

⏰ Em breve estará pronto!

Te avisamos! 🥥`,

    // Variation 2: Warm and friendly
    `Oi, *${firstName}*! 👋

Seu pedido já está sendo preparado pela nossa equipe!

🎯 *#${orderData.orderNumber}*
${itemsList}

💵 R$ ${orderData.totalAmount.toFixed(2)}

🕐 Aguarde mais um pouquinho!

Logo te chamamos! 🌴`,

    // Variation 3: Professional
    `*${firstName}*, pedido em preparo! 👨‍🍳

Nossa equipe está trabalhando no seu pedido.

📦 *Pedido #${orderData.orderNumber}*
${itemsList}

💳 R$ ${orderData.totalAmount.toFixed(2)}

⏱️ Tempo estimado: 15-20 min

Aguarde! 🥥`,

    // Variation 4: Casual
    `E aí, *${firstName}*! 🤙

Tá rolando na cozinha!

🔖 *#${orderData.orderNumber}*
${itemsList}

💰 R$ ${orderData.totalAmount.toFixed(2)}

⏰ Já já tá pronto!

Aguenta aí! 🌊`,

    // Variation 5: Concise
    `*${firstName}*, em preparo! 👨‍🍳

📝 *#${orderData.orderNumber}*
${itemsList}

💵 R$ ${orderData.totalAmount.toFixed(2)}

⏰ 15-20 min

Logo te avisamos! 🥥🌴`
  ];

  return getRandomVariation(variations);
}

/**
 * Get notification type label in Portuguese
 */
export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'order_created': 'Pedido Criado',
    'payment_confirmed': 'Pagamento Confirmado',
    'preparing': 'Em Preparo',
    'in_preparation': 'Em Preparo',
    'ready': 'Pronto para Retirada',
    'custom': 'Mensagem Personalizada',
    'confirmation': 'Confirmação',
    'status_update': 'Atualização de Status',
  };

  return labels[type] || type;
}

/**
 * Get notification status label in Portuguese
 */
export function getNotificationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'Pendente',
    'sent': 'Enviada',
    'failed': 'Falhou',
    'cancelled': 'Cancelada',
  };

  return labels[status] || status;
}
