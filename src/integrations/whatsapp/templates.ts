import { OrderData } from './types';
import { templateManager } from './template-manager';

/**
 * WhatsApp message templates with fallback to hardcoded templates
 * Uses template manager for database-driven templates
 */
export class WhatsAppTemplates {
  /**
   * Generate order created message (when order is first placed)
   */
  static async generateOrderCreated(orderData: OrderData, orderStatusUrl?: string, paymentUrl?: string): Promise<string> {
    try {
      const template = await templateManager.getTemplate('order_created');
      return templateManager.renderTemplate(template, orderData);
    } catch (error) {
      console.warn('Failed to load order_created template, using fallback:', error);
      return this.generateOrderCreatedFallback(orderData, orderStatusUrl, paymentUrl);
    }
  }

  /**
   * Generate order confirmation message (when payment is confirmed)
   */
  static async generateOrderConfirmation(orderData: OrderData): Promise<string> {
    try {
      const template = await templateManager.getTemplate('payment_confirmed');
      return templateManager.renderTemplate(template, orderData);
    } catch (error) {
      console.warn('Failed to load template, using fallback:', error);
      return this.generateOrderConfirmationFallback(orderData);
    }
  }

  /**
   * Generate ready for pickup message
   */
  static async generateReadyForPickup(orderData: OrderData): Promise<string> {
    try {
      const template = await templateManager.getTemplate('ready');
      return templateManager.renderTemplate(template, orderData);
    } catch (error) {
      console.warn('Failed to load template, using fallback:', error);
      return this.generateReadyForPickupFallback(orderData);
    }
  }

  /**
   * Generate preparing status message
   */
  static async generatePreparingMessage(orderData: OrderData): Promise<string> {
    try {
      const template = await templateManager.getTemplate('preparing');
      return templateManager.renderTemplate(template, orderData);
    } catch (error) {
      console.warn('Failed to load template, using fallback:', error);
      return this.generatePreparingFallback(orderData);
    }
  }

  /**
   * Generate custom message
   */
  static async generateCustomMessage(orderData: OrderData, customText: string): Promise<string> {
    try {
      const template = await templateManager.getTemplate('custom');
      // Add custom message to order data for rendering
      const dataWithCustom = {
        ...orderData,
        customMessage: customText,
      } as any;
      return templateManager.renderTemplate(template, dataWithCustom);
    } catch (error) {
      console.warn('Failed to load template, using fallback:', error);
      return this.generateCustomMessageFallback(orderData, customText);
    }
  }

  /**
   * Generate status update message (legacy support)
   */
  static async generateStatusUpdate(orderData: OrderData, status: string): Promise<string> {
    // Map status to notification type
    switch (status) {
      case 'paid':
      case 'payment_confirmed':
        return this.generateOrderConfirmation(orderData);
      case 'preparing':
      case 'in_preparation':
        return this.generatePreparingMessage(orderData);
      case 'ready':
        return this.generateReadyForPickup(orderData);
      default:
        return this.generateStatusUpdateFallback(orderData, status);
    }
  }

  // Fallback methods (hardcoded templates)
  
  private static generateOrderCreatedFallback(orderData: OrderData, orderStatusUrl?: string, paymentUrl?: string): string {
    const itemsList = orderData.items
      .map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        return `• ${item.quantity}x ${item.itemName} - R$ ${itemTotal.toFixed(2)}`;
      })
      .join('\n');

    // Get first name for personalization
    const firstName = orderData.customerName.split(' ')[0];

    let message = `🎉 *Pedido #${orderData.orderNumber} Criado!*\n\n` +
      `Olá *${firstName}*! Recebemos o seu pedido!\n\n` +
      `📋 *Itens do Pedido:*\n${itemsList}\n\n` +
      `💰 *Total: R$ ${orderData.totalAmount.toFixed(2)}*`;

    if (orderStatusUrl && paymentUrl) {
      message += `\n\n🔗 *Links Úteis:*\n` +
        `📱 Ver Pedido: ${orderStatusUrl}\n` +
        `💳 Ir para Pagamento: ${paymentUrl}\n\n` +
        `Você pode visualizar seu pedido, editá-lo ou prosseguir com o pagamento através dos links acima.`;
    } else {
      message += `\n\nEm breve você receberá mais informações sobre o seu pedido! 😊`;
    }

    return message;
  }
  
  private static generateOrderConfirmationFallback(orderData: OrderData): string {
    const itemsList = orderData.items
      .map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        return `• ${item.quantity}x ${item.itemName} - R$ ${itemTotal.toFixed(2)}`;
      })
      .join('\n');

    // Get first name for personalization
    const firstName = orderData.customerName.split(' ')[0];

    return `🌴 *Coco Loko Açaiteria* 🌴

Olá *${firstName}*! 👋

✅ *Pagamento Confirmado!*

Seu pedido foi recebido e já está sendo preparado com muito carinho! 🥥

📋 *Pedido #${orderData.orderNumber}*
🪑 *Mesa:* ${orderData.tableNumber}

📝 *Seus Itens:*
${itemsList}

💰 *Total Pago:* R$ ${orderData.totalAmount.toFixed(2)}

⏰ *Tempo estimado:* 15-20 minutos

Você receberá uma nova mensagem quando seu pedido estiver pronto para retirada no balcão!

Obrigado por escolher a Coco Loko! 🌊`;
  }

  private static generateReadyForPickupFallback(orderData: OrderData): string {
    const itemsList = orderData.items
      .map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        return `• ${item.quantity}x ${item.itemName} — R$ ${itemTotal.toFixed(2)}`;
      })
      .join('\n');

    // Get first name for personalization
    const firstName = orderData.customerName.split(' ')[0];

    // Determine payment status indicator
    let paymentStatus = '🔴 Pendente';
    if (orderData.paymentMethod === 'pix' || orderData.paymentMethod === 'PIX') {
      paymentStatus = '🟢 Confirmado via PIX';
    } else if (orderData.paymentMethod === 'credit_card' || orderData.paymentMethod === 'card') {
      paymentStatus = '🔵 Confirmado via Cartão';
    } else if (orderData.paymentConfirmedAt) {
      // If payment is confirmed but method unknown, check for PIX first
      paymentStatus = '🟢 Confirmado via PIX';
    }

    return `🌴 *Coco Loko Açaiteria* 🌴

Olá, *${firstName}*!

Seu pedido já está pronto para retirada no balcão.

📝 *Itens do Pedido [#${orderData.orderNumber}]:*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

📌 *Status do pagamento:* ${paymentStatus}

Obrigado pela preferência! 🙌`;
  }

  private static generatePreparingFallback(orderData: OrderData): string {
    const itemsList = orderData.items
      .map(item => `• ${item.quantity}x ${item.itemName}`)
      .join('\n');

    // Get first name for personalization
    const firstName = orderData.customerName.split(' ')[0];

    return `🌴 *Coco Loko Açaiteria* 🌴

Olá *${firstName}*! 👋

👨‍🍳 *Seu pedido está sendo preparado!*

📋 *Pedido #${orderData.orderNumber}*
🪑 *Mesa:* ${orderData.tableNumber}

📝 *Seus Itens:*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

⏰ *Tempo estimado:* 15-20 minutos

Estamos preparando tudo com muito carinho! Em breve você receberá uma notificação quando estiver pronto! 🥥🌊`;
  }

  private static generateStatusUpdateFallback(orderData: OrderData, status: string): string {
    let statusMessage = '';
    let emoji = '';
    let additionalMessage = '';

    // Get first name for personalization
    const firstName = orderData.customerName.split(' ')[0];

    const itemsList = orderData.items
      .map(item => `• ${item.quantity}x ${item.itemName}`)
      .join('\n');

    switch (status) {
      case 'in_preparation':
      case 'preparing':
        statusMessage = 'em preparo';
        emoji = '👨‍🍳';
        additionalMessage = 'Estamos preparando seu pedido com carinho!';
        break;
      case 'ready':
        statusMessage = 'pronto para retirada';
        emoji = '✅';
        additionalMessage = `Por favor, *${firstName}*, retire seu pedido no balcão!`;
        break;
      case 'completed':
        statusMessage = 'finalizado';
        emoji = '🎉';
        additionalMessage = `Obrigado pela preferência, *${firstName}*!`;
        break;
      default:
        statusMessage = status;
        emoji = 'ℹ️';
        additionalMessage = 'Obrigado pela preferência!';
    }

    return `🌴 *Coco Loko Açaiteria* 🌴

Olá *${firstName}*! 👋

${emoji} *Atualização do Pedido*

📋 *Pedido #${orderData.orderNumber}*
🪑 *Mesa:* ${orderData.tableNumber}

📝 *Seus Itens:*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

📊 *Status:* ${statusMessage}

${additionalMessage}

🥥🌊`;
  }

  private static generateCustomMessageFallback(orderData: OrderData, customText: string): string {
    // Get first name for personalization
    const firstName = orderData.customerName.split(' ')[0];

    const itemsList = orderData.items
      .map(item => `• ${item.quantity}x ${item.itemName}`)
      .join('\n');

    return `🌴 *Coco Loko Açaiteria* 🌴

Olá *${firstName}*! 👋

📋 *Pedido #${orderData.orderNumber}*
🪑 *Mesa:* ${orderData.tableNumber}

📝 *Seus Itens:*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

---

${customText}

🥥🌊`;
  }
}