/**
 * Centralized WhatsApp Notification Triggers
 * Handles automatic notification sending based on order status changes
 */

import { supabase } from '../supabase/client';
import { queueManager } from './queue-manager';
import { errorLogger } from './error-logger';
import { NotificationRequest, OrderData } from './types';

export class NotificationTriggerService {
  /**
   * Trigger notification when order is created with payment links
   */
  async onOrderCreatedWithLinks(orderId: string, baseUrl: string): Promise<void> {
    try {
      console.log('Order created with links trigger:', { orderId, baseUrl });
      
      // Get order data
      const orderData = await this.getOrderData(orderId);
      if (!orderData) {
        console.error('Order not found for creation notification:', orderId);
        return;
      }

      // Check if notification was already sent to prevent duplicates
      const { data: existingNotifications } = await supabase
        .from('whatsapp_notifications')
        .select('id')
        .eq('order_id', orderId)
        .eq('notification_type', 'order_created')
        .eq('status', 'sent')
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        console.log('Order creation notification already sent, skipping:', { orderId });
        return;
      }

      // Build message with order details and links
      const orderStatusUrl = `${baseUrl}/order-status/${orderId}`;
      const paymentUrl = `${baseUrl}/payment/${orderId}`;
      
      const itemsList = orderData.items
        .map(item => `• ${item.quantity}x ${item.itemName} - R$ ${(item.quantity * item.unitPrice).toFixed(2)}`)
        .join('\n');

      const message = `🎉 *Pedido #${orderData.orderNumber} Criado!*\n\n` +
        `Olá ${orderData.customerName}! Recebemos o seu pedido!\n\n` +
        `📋 *Itens do Pedido:*\n${itemsList}\n\n` +
        `💰 *Total: R$ ${orderData.totalAmount.toFixed(2)}*\n\n` +
        `🔗 *Links Úteis:*\n` +
        `📱 Ver Pedido: ${orderStatusUrl}\n` +
        `💳 Ir para Pagamento: ${paymentUrl}\n\n` +
        `Você pode visualizar seu pedido, editá-lo ou prosseguir com o pagamento através dos links acima.`;

      // Queue order creation notification with custom message
      const notification: NotificationRequest = {
        orderId: orderData.id,
        customerPhone: orderData.customerPhone,
        customerName: orderData.customerName,
        notificationType: 'order_created',
        orderDetails: orderData,
        customMessage: message,
      };

      await queueManager.enqueue(notification);
      console.log('Order creation notification queued:', { orderId });
    } catch (error) {
      console.error('Error triggering order creation notification:', error);
      // Log error for tracking
      await errorLogger.logError(error as Error, {
        operation: 'trigger_order_creation',
        orderId,
        additionalData: { notificationType: 'order_created' }
      });
      // Don't throw - notification failures shouldn't break the order flow
    }
  }

  /**
   * Trigger notification when payment is confirmed
   */
  async onPaymentConfirmed(orderId: string): Promise<void> {
    try {
      console.log('Payment confirmed trigger:', { orderId });
      
      // Get order data
      const orderData = await this.getOrderData(orderId);
      if (!orderData) {
        console.error('Order not found for payment confirmation notification:', orderId);
        return;
      }

      // Check if ANY notification was already sent recently (within last 2 minutes) to prevent duplicates
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recentNotifications } = await supabase
        .from('whatsapp_notifications')
        .select('id, notification_type, sent_at')
        .eq('order_id', orderId)
        .in('notification_type', ['order_created', 'payment_confirmed'])
        .eq('status', 'sent')
        .gte('sent_at', twoMinutesAgo)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (recentNotifications && recentNotifications.length > 0) {
        console.log('Recent notification already sent, skipping payment confirmation:', { 
          orderId, 
          recentType: recentNotifications[0].notification_type,
          sentAt: recentNotifications[0].sent_at
        });
        return;
      }

      // Queue payment confirmation notification
      const notification: NotificationRequest = {
        orderId: orderData.id,
        customerPhone: orderData.customerPhone,
        customerName: orderData.customerName,
        notificationType: 'payment_confirmed',
        orderDetails: orderData,
      };

      await queueManager.enqueue(notification);
      console.log('Payment confirmation notification queued:', { orderId });
    } catch (error) {
      console.error('Error triggering payment confirmation notification:', error);
      // Log error for tracking
      await errorLogger.logError(error as Error, {
        operation: 'trigger_payment_confirmation',
        orderId,
        additionalData: { notificationType: 'payment_confirmed' }
      });
      // Don't throw - notification failures shouldn't break the payment flow
    }
  }

  /**
   * Trigger notification when order moves to preparing status
   */
  async onOrderPreparing(orderId: string): Promise<void> {
    try {
      console.log('Order preparing trigger:', { orderId });
      
      // Get order data
      const orderData = await this.getOrderData(orderId);
      if (!orderData) {
        console.error('Order not found for preparing notification:', orderId);
        return;
      }

      // Check if notification was already sent to prevent duplicates
      const { data: existingNotifications } = await supabase
        .from('whatsapp_notifications')
        .select('id')
        .eq('order_id', orderId)
        .eq('notification_type', 'preparing')
        .eq('status', 'sent')
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        console.log('Preparing notification already sent, skipping:', { orderId });
        return;
      }

      // Queue preparing notification
      const notification: NotificationRequest = {
        orderId: orderData.id,
        customerPhone: orderData.customerPhone,
        customerName: orderData.customerName,
        notificationType: 'preparing',
        orderDetails: orderData,
      };

      await queueManager.enqueue(notification);
      console.log('Preparing notification queued:', { orderId });
    } catch (error) {
      console.error('Error triggering preparing notification:', error);
      // Log error for tracking
      await errorLogger.logError(error as Error, {
        operation: 'trigger_preparing_notification',
        orderId,
        additionalData: { notificationType: 'preparing' }
      });
      // Don't throw - notification failures shouldn't break the order flow
    }
  }

  /**
   * Trigger notification when order is ready for pickup
   */
  async onOrderReady(orderId: string): Promise<void> {
    try {
      console.log('Order ready trigger:', { orderId });
      
      // Get order data
      const orderData = await this.getOrderData(orderId);
      if (!orderData) {
        console.error('Order not found for ready notification:', orderId);
        return;
      }

      // Check if notification was already sent to prevent duplicates
      const { data: existingNotifications } = await supabase
        .from('whatsapp_notifications')
        .select('id')
        .eq('order_id', orderId)
        .eq('notification_type', 'ready')
        .eq('status', 'sent')
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        console.log('Ready notification already sent, skipping:', { orderId });
        return;
      }

      // Queue ready notification
      const notification: NotificationRequest = {
        orderId: orderData.id,
        customerPhone: orderData.customerPhone,
        customerName: orderData.customerName,
        notificationType: 'ready',
        orderDetails: orderData,
      };

      await queueManager.enqueue(notification);
      console.log('Ready notification queued:', { orderId });
    } catch (error) {
      console.error('Error triggering ready notification:', error);
      // Log error for tracking
      await errorLogger.logError(error as Error, {
        operation: 'trigger_ready_notification',
        orderId,
        additionalData: { notificationType: 'ready' }
      });
      // Don't throw - notification failures shouldn't break the order flow
    }
  }

  /**
   * Trigger notification based on order status change
   */
  async onOrderStatusChange(orderId: string, newStatus: string, oldStatus?: string): Promise<void> {
    try {
      console.log('Order status change trigger:', { orderId, oldStatus, newStatus });

      // Trigger appropriate notification based on status
      switch (newStatus) {
        case 'paid':
          // Only send if transitioning from pending_payment
          if (oldStatus === 'pending_payment' || !oldStatus) {
            await this.onPaymentConfirmed(orderId);
          }
          break;

        case 'in_preparation':
          // Send preparing notification
          await this.onOrderPreparing(orderId);
          break;

        case 'ready':
          // Send ready notification
          await this.onOrderReady(orderId);
          break;

        default:
          console.log('No notification trigger for status:', newStatus);
      }
    } catch (error) {
      console.error('Error handling order status change notification:', error);
      // Log error for tracking
      await errorLogger.logError(error as Error, {
        operation: 'trigger_status_change_notification',
        orderId,
        additionalData: { oldStatus, newStatus }
      });
      // Don't throw - notification failures shouldn't break the order flow
    }
  }

  /**
   * Get order data with items for notifications
   */
  private async getOrderData(orderId: string): Promise<OrderData | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            item_name,
            quantity,
            unit_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (error || !data) {
        console.error('Error fetching order data:', error);
        return null;
      }

      // Determine payment method from mercadopago_payment_id or payment_method field
      let paymentMethod = data.payment_method || 'pix'; // Default to PIX
      
      // If payment_method is not set, try to infer from payment ID
      if (!data.payment_method && data.mercadopago_payment_id) {
        // Check if it's a card payment (card payments typically have different ID format)
        // For now, default to PIX unless explicitly set
        paymentMethod = 'pix';
      }

      return {
        id: data.id,
        orderNumber: data.order_number,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        tableNumber: data.table_number,
        totalAmount: data.total_amount,
        items: data.order_items.map((item: any) => ({
          itemName: item.item_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
        status: data.status,
        createdAt: data.created_at,
        paymentMethod: paymentMethod,
        paymentConfirmedAt: data.payment_confirmed_at,
      };
    } catch (error) {
      console.error('Error getting order data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const notificationTriggers = new NotificationTriggerService();
