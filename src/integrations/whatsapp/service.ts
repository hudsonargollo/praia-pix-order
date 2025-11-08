import { evolutionClient } from './evolution-client';
import { WhatsAppTemplates } from './templates';
import { OrderData } from './types';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';

// Retry configuration for WhatsApp messages
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
};

// Fallback notification methods
const FALLBACK_METHODS = {
  email: false, // Could be implemented later
  sms: false,   // Could be implemented later
  push: false   // Could be implemented later
};

export class WhatsAppService {
  /**
   * Retry mechanism with exponential backoff for WhatsApp messages
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = RETRY_CONFIG.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          console.error(`${context} failed after ${maxRetries + 1} attempts:`, lastError);
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          console.error(`${context} failed with non-retryable error:`, lastError);
          break;
        }

        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay
        );
        
        console.warn(`${context} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if a WhatsApp error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Network errors are retryable
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return true;
    }
    
    // HTTP 5xx errors are retryable
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }
    
    // Rate limiting is retryable
    if (message.includes('429') || message.includes('rate limit')) {
      return true;
    }
    
    // WhatsApp specific temporary errors
    if (message.includes('temporary') || message.includes('try again') || message.includes('busy')) {
      return true;
    }
    
    // WhatsApp API specific errors that are retryable
    if (message.includes('throttled') || message.includes('quota exceeded')) {
      return true;
    }
    
    return false;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message for WhatsApp failures
   */
  private getUserFriendlyErrorMessage(error: Error, messageType: string): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Erro de conexão ao enviar notificação. Tentaremos novamente.';
    }
    
    if (message.includes('invalid phone') || message.includes('invalid number')) {
      return 'Número de WhatsApp inválido. Verifique o número cadastrado.';
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return 'Muitas mensagens enviadas. Aguarde um momento.';
    }
    
    if (message.includes('not configured') || message.includes('credentials')) {
      return 'Serviço de notificação temporariamente indisponível.';
    }
    
    return `Erro ao enviar ${messageType}. Tentaremos novamente automaticamente.`;
  }

  async sendOrderConfirmation(orderData: OrderData): Promise<string | null> {
    if (!evolutionClient.isConfigured()) {
      console.warn('Evolution API not configured, attempting fallback notification methods');
      await this.handleFallbackNotification(orderData, 'confirmation');
      return null;
    }

    return this.retryWithBackoff(async () => {
      try {
        const message = await WhatsAppTemplates.generateOrderConfirmation(orderData);
        const response = await evolutionClient.sendTextMessage({
          number: orderData.customerPhone,
          text: message,
          delay: 0
        });
        const messageId = response.key?.id || 'unknown';
        
        // Log the successful notification
        await this.logNotification(orderData.id, orderData.customerPhone, 'confirmation', message, 'sent', messageId);
        
        console.log('Order confirmation sent successfully:', { orderId: orderData.id, messageId });
        return messageId;
      } catch (error) {
        console.error('Failed to send order confirmation:', error);
        
        // Log the failed notification
        await this.logNotification(orderData.id, orderData.customerPhone, 'confirmation', '', 'failed');
        
        // Show user-friendly error message
        const friendlyMessage = this.getUserFriendlyErrorMessage(error as Error, 'confirmação do pedido');
        toast.error(friendlyMessage);
        
        throw error;
      }
    }, 'Send order confirmation');
  }

  async sendReadyNotification(orderData: OrderData): Promise<string | null> {
    if (!evolutionClient.isConfigured()) {
      console.warn('Evolution API not configured, attempting fallback notification methods');
      await this.handleFallbackNotification(orderData, 'ready');
      return null;
    }

    return this.retryWithBackoff(async () => {
      try {
        const message = await WhatsAppTemplates.generateReadyForPickup(orderData);
        const response = await evolutionClient.sendTextMessage({
          number: orderData.customerPhone,
          text: message,
          delay: 0
        });
        const messageId = response.key?.id || 'unknown';
        
        // Log the successful notification
        await this.logNotification(orderData.id, orderData.customerPhone, 'ready', message, 'sent', messageId);
        
        console.log('Ready notification sent successfully:', { orderId: orderData.id, messageId });
        return messageId;
      } catch (error) {
        console.error('Failed to send ready notification:', error);
        
        // Log the failed notification
        await this.logNotification(orderData.id, orderData.customerPhone, 'ready', '', 'failed');
        
        // Show user-friendly error message
        const friendlyMessage = this.getUserFriendlyErrorMessage(error as Error, 'notificação de pedido pronto');
        toast.error(friendlyMessage);
        
        throw error;
      }
    }, 'Send ready notification');
  }

  async sendStatusUpdate(orderData: OrderData, status: string): Promise<string | null> {
    if (!evolutionClient.isConfigured()) {
      console.warn('Evolution API not configured, attempting fallback notification methods');
      await this.handleFallbackNotification(orderData, 'status_update', status);
      return null;
    }

    return this.retryWithBackoff(async () => {
      try {
        const message = await WhatsAppTemplates.generateStatusUpdate(orderData, status);
        const response = await evolutionClient.sendTextMessage({
          number: orderData.customerPhone,
          text: message,
          delay: 0
        });
        const messageId = response.key?.id || 'unknown';
        
        // Log the successful notification
        await this.logNotification(orderData.id, orderData.customerPhone, 'status_update', message, 'sent', messageId);
        
        console.log('Status update sent successfully:', { orderId: orderData.id, status, messageId });
        return messageId;
      } catch (error) {
        console.error('Failed to send status update:', error);
        
        // Log the failed notification
        await this.logNotification(orderData.id, orderData.customerPhone, 'status_update', '', 'failed');
        
        // Show user-friendly error message
        const friendlyMessage = this.getUserFriendlyErrorMessage(error as Error, 'atualização de status');
        toast.error(friendlyMessage);
        
        throw error;
      }
    }, 'Send status update');
  }

  async sendCustomMessage(orderData: OrderData, customText: string): Promise<string | null> {
    if (!evolutionClient.isConfigured()) {
      console.warn('Evolution API not configured, attempting fallback notification methods');
      await this.handleFallbackNotification(orderData, 'custom', customText);
      return null;
    }

    return this.retryWithBackoff(async () => {
      try {
        const message = await WhatsAppTemplates.generateCustomMessage(orderData, customText);
        const response = await evolutionClient.sendTextMessage({
          number: orderData.customerPhone,
          text: message,
          delay: 0
        });
        const messageId = response.key?.id || 'unknown';
        
        // Log the successful notification
        await this.logNotification(orderData.id, orderData.customerPhone, 'custom', message, 'sent', messageId);
        
        console.log('Custom message sent successfully:', { orderId: orderData.id, messageId });
        return messageId;
      } catch (error) {
        console.error('Failed to send custom message:', error);
        
        // Log the failed notification
        await this.logNotification(orderData.id, orderData.customerPhone, 'custom', '', 'failed');
        
        // Show user-friendly error message
        const friendlyMessage = this.getUserFriendlyErrorMessage(error as Error, 'mensagem personalizada');
        toast.error(friendlyMessage);
        
        throw error;
      }
    }, 'Send custom message');
  }

  private async logNotification(
    orderId: string,
    phone: string,
    messageType: string,
    messageContent: string,
    status: 'pending' | 'sent' | 'failed' | 'retrying' | 'fallback_attempted',
    whatsappMessageId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_notifications')
        .insert({
          order_id: orderId,
          phone,
          message_type: messageType,
          message_content: messageContent,
          status,
          whatsapp_message_id: whatsappMessageId,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        });

      if (error) {
        console.error('Failed to log WhatsApp notification:', error);
      }
    } catch (error) {
      console.error('Error logging WhatsApp notification:', error);
    }
  }

  /**
   * Handle fallback notification methods when WhatsApp is not available
   */
  private async handleFallbackNotification(
    orderData: OrderData, 
    messageType: string, 
    customText?: string
  ): Promise<void> {
    try {
      console.log('Attempting fallback notification methods for:', { orderId: orderData.id, messageType });
      
      // Log the fallback attempt
      await this.logNotification(
        orderData.id, 
        orderData.customerPhone, 
        messageType, 
        `Fallback notification: ${messageType}${customText ? ` - ${customText}` : ''}`, 
        'fallback_attempted'
      );

      // Future: Implement email fallback
      if (FALLBACK_METHODS.email) {
        // await this.sendEmailNotification(orderData, messageType, customText);
      }

      // Future: Implement SMS fallback
      if (FALLBACK_METHODS.sms) {
        // await this.sendSMSNotification(orderData, messageType, customText);
      }

      // For now, just show a toast to staff
      toast.warning(
        `WhatsApp indisponível. Notifique manualmente o cliente ${orderData.customerName} (${orderData.customerPhone}).`,
        { duration: 10000 }
      );

    } catch (error) {
      console.error('Error in fallback notification handling:', error);
    }
  }

  /**
   * Enhanced retry mechanism for failed notifications with intelligent scheduling
   */
  async retryFailedNotifications(orderId: string): Promise<void> {
    try {
      const { data: failedNotifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'failed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch failed notifications:', error);
        return;
      }

      if (!failedNotifications || failedNotifications.length === 0) {
        console.log('No failed notifications to retry for order:', orderId);
        return;
      }

      // Get order data for retry
      const { data: orderData, error: orderError } = await supabase
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

      if (orderError || !orderData) {
        console.error('Failed to fetch order data for retry:', orderError);
        return;
      }

      const formattedOrderData: OrderData = {
        id: orderData.id,
        orderNumber: orderData.order_number,
        customerName: orderData.customer_name,
        customerPhone: orderData.customer_phone,
        tableNumber: orderData.table_number,
        totalAmount: orderData.total_amount,
        items: orderData.order_items.map((item: any) => ({
          itemName: item.item_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
        status: orderData.status,
        createdAt: orderData.created_at,
      };

      console.log(`Retrying ${failedNotifications.length} failed notifications for order:`, orderId);

      // Retry each failed notification with delay between attempts
      for (let i = 0; i < failedNotifications.length; i++) {
        const notification = failedNotifications[i];
        
        try {
          // Add delay between retries to avoid rate limiting
          if (i > 0) {
            await this.sleep(1000); // 1 second delay between retries
          }

          let messageId: string | null = null;

          // Mark as retrying
          await supabase
            .from('whatsapp_notifications')
            .update({ status: 'retrying' })
            .eq('id', notification.id);

          switch (notification.message_type) {
            case 'confirmation':
              messageId = await this.sendOrderConfirmation(formattedOrderData);
              break;
            case 'ready':
              messageId = await this.sendReadyNotification(formattedOrderData);
              break;
            case 'status_update':
              messageId = await this.sendStatusUpdate(formattedOrderData, formattedOrderData.status);
              break;
            case 'custom':
              messageId = await this.sendCustomMessage(formattedOrderData, notification.message_content || '');
              break;
          }

          if (messageId) {
            // Update the notification status to sent
            await supabase
              .from('whatsapp_notifications')
              .update({
                status: 'sent',
                whatsapp_message_id: messageId,
                sent_at: new Date().toISOString(),
              })
              .eq('id', notification.id);

            console.log(`Successfully retried notification ${notification.id}`);
          }
        } catch (error) {
          console.error(`Failed to retry notification ${notification.id}:`, error);
          
          // Mark as failed again
          await supabase
            .from('whatsapp_notifications')
            .update({ status: 'failed' })
            .eq('id', notification.id);
        }
      }

      toast.success(`Tentativa de reenvio concluída para ${failedNotifications.length} notificações.`);

    } catch (error) {
      console.error('Error retrying failed notifications:', error);
      toast.error('Erro ao tentar reenviar notificações.');
    }
  }

  /**
   * Automatically retry failed notifications with exponential backoff
   */
  async scheduleAutomaticRetry(orderId: string, delayMs: number = 60000): Promise<void> {
    setTimeout(async () => {
      try {
        await this.retryFailedNotifications(orderId);
      } catch (error) {
        console.error('Error in automatic retry:', error);
      }
    }, delayMs);
  }

  /**
   * Get notification statistics for monitoring
   */
  async getNotificationStats(orderId: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    try {
      const { data: notifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('status')
        .eq('order_id', orderId);

      if (error) {
        console.error('Error fetching notification stats:', error);
        return { total: 0, sent: 0, failed: 0, pending: 0 };
      }

      const stats = notifications?.reduce((acc, notification) => {
        acc.total++;
        switch (notification.status) {
          case 'sent':
            acc.sent++;
            break;
          case 'failed':
            acc.failed++;
            break;
          case 'pending':
          case 'retrying':
            acc.pending++;
            break;
        }
        return acc;
      }, { total: 0, sent: 0, failed: 0, pending: 0 }) || { total: 0, sent: 0, failed: 0, pending: 0 };

      return stats;
    } catch (error) {
      console.error('Error calculating notification stats:', error);
      return { total: 0, sent: 0, failed: 0, pending: 0 };
    }
  }
}

export const whatsappService = new WhatsAppService();