import { OrderData } from './types';
import { templateManager } from './template-manager';

/**
 * WhatsApp message templates with fallback to hardcoded templates
 * Uses template manager for database-driven templates
 */
export class WhatsAppTemplates {
  /**
   * Generate order confirmation message
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
  
  private static generateOrderConfirmationFallback(orderData: OrderData): string {
    const itemsList = orderData.items
      .map(item => `• ${item.quantity}x ${item.itemName} - R$ ${item.unitPrice.toFixed(2)}`)
      .join('\n');

    return `🌴 *Coco Loko Açaiteria* 🌴

✅ *Pedido Confirmado!*

📋 *Pedido #${orderData.orderNumber}*
👤 *Cliente:* ${orderData.customerName}
📱 *Telefone:* ${orderData.customerPhone}

📝 *Itens do Pedido:*
${itemsList}

💰 *Total:* R$ ${orderData.totalAmount.toFixed(2)}

⏰ *Tempo estimado:* 15-20 minutos

Você receberá uma nova mensagem quando seu pedido estiver pronto para retirada!

Obrigado por escolher a Coco Loko! 🥥🌊`;
  }

  private static generateReadyForPickupFallback(orderData: OrderData): string {
    return `🌴 *Coco Loko Açaiteria* 🌴

🎉 *Pedido Pronto!*

📋 *Pedido #${orderData.orderNumber}*
👤 *Cliente:* ${orderData.customerName}
📱 *Telefone:* ${orderData.customerPhone}

✨ Seu pedido está pronto para retirada no balcão!

Por favor, apresente este número do pedido: *#${orderData.orderNumber}*

Aproveite seu açaí! 🥥🌊`;
  }

  private static generatePreparingFallback(orderData: OrderData): string {
    return `🌴 *Coco Loko Açaiteria* 🌴

👨‍🍳 *Pedido em Preparo!*

📋 *Pedido #${orderData.orderNumber}*
👤 *Cliente:* ${orderData.customerName}

Seu pedido está sendo preparado com carinho!

⏰ *Tempo estimado:* 15-20 minutos

Em breve você receberá uma notificação quando estiver pronto! 🥥🌊`;
  }

  private static generateStatusUpdateFallback(orderData: OrderData, status: string): string {
    let statusMessage = '';
    let emoji = '';

    switch (status) {
      case 'in_preparation':
      case 'preparing':
        statusMessage = 'em preparo';
        emoji = '👨‍🍳';
        break;
      case 'ready':
        statusMessage = 'pronto para retirada';
        emoji = '✅';
        break;
      case 'completed':
        statusMessage = 'finalizado';
        emoji = '🎉';
        break;
      default:
        statusMessage = status;
        emoji = 'ℹ️';
    }

    return `🌴 *Coco Loko Açaiteria* 🌴

${emoji} *Atualização do Pedido*

📋 *Pedido #${orderData.orderNumber}*
👤 *Cliente:* ${orderData.customerName}
📱 *Telefone:* ${orderData.customerPhone}

📊 *Status:* ${statusMessage}

${status === 'ready' ? 'Por favor, retire seu pedido no balcão!' : 'Obrigado pela preferência!'}

🥥🌊`;
  }

  private static generateCustomMessageFallback(orderData: OrderData, customText: string): string {
    return `🌴 *Coco Loko Açaiteria* 🌴

📋 *Pedido #${orderData.orderNumber}*
👤 *Cliente:* ${orderData.customerName}
📱 *Telefone:* ${orderData.customerPhone}

${customText}

🥥🌊`;
  }
}