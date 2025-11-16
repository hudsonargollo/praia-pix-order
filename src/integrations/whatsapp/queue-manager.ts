import { QueuedNotification, NotificationRequest, NotificationResult, ProcessResult, QueueStats, OrderData } from './types';
import { supabase } from '../supabase/client';
import { evolutionClient } from './evolution-client';
import { WhatsAppTemplates } from './templates';
import { validatePhoneNumber } from './phone-validator';
import { encryptPhoneNumberSafe, decryptPhoneNumberSafe } from './phone-encryption';
import { optOutManager } from './opt-out-manager';
import { complianceChecker } from './compliance';
import { errorLogger } from './error-logger';

/**
 * Notification Queue Manager
 * Handles queuing, processing, and retry logic for WhatsApp notifications
 */

const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

const PROCESSING_CONFIG = {
  batchSize: 10,
  processingInterval: 5000, // 5 seconds
  maxConcurrent: 5,
};

export class NotificationQueueManager {
  private isProcessing: boolean = false;
  private processingTimer: NodeJS.Timeout | null = null;

  /**
   * Enqueue a notification for sending
   */
  async enqueue(notification: NotificationRequest): Promise<string> {
    // Validate phone number
    const phoneValidation = validatePhoneNumber(notification.customerPhone);
    if (!phoneValidation.isValid) {
      throw new Error(`Invalid phone number: ${phoneValidation.error}`);
    }

    // Check if customer has opted out
    const hasOptedOut = await optOutManager.isOptedOut(phoneValidation.formattedNumber!);
    if (hasOptedOut) {
      console.log('Customer has opted out of notifications, skipping:', {
        orderId: notification.orderId,
        type: notification.notificationType,
      });
      throw new Error('Customer has opted out of WhatsApp notifications');
    }

    // Encrypt phone number before storing
    const encryptedPhone = await encryptPhoneNumberSafe(phoneValidation.formattedNumber!);

    // Generate message content
    let messageContent: string;
    try {
      messageContent = await this.generateMessageContent(notification);
    } catch (error) {
      console.error('Failed to generate message content:', error);
      throw new Error('Failed to generate message content');
    }

    // Check compliance before enqueueing
    const complianceCheck = await complianceChecker.checkFullCompliance(
      messageContent,
      notification.notificationType,
      encryptedPhone,
      supabase
    );

    if (!complianceCheck.isCompliant) {
      console.error('Notification failed compliance check:', complianceCheck.violations);
      throw new Error(`Compliance violation: ${complianceCheck.violations.join(', ')}`);
    }

    // Log warnings if any
    if (complianceCheck.warnings.length > 0) {
      console.warn('Notification compliance warnings:', complianceCheck.warnings);
    }

    // Insert into queue
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .insert({
        order_id: notification.orderId,
        customer_phone: encryptedPhone,
        notification_type: notification.notificationType,
        message_content: messageContent,
        status: 'pending',
        attempts: 0,
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to enqueue notification:', error);
      throw new Error(`Failed to enqueue notification: ${error?.message}`);
    }

    console.log('Notification enqueued:', { id: data.id, orderId: notification.orderId, type: notification.notificationType });
    
    // Trigger immediate processing
    this.processPendingNotifications().catch(err => 
      console.error('Error in immediate processing:', err)
    );

    return data.id;
  }

  /**
   * Process pending notifications in FIFO order
   */
  async processPendingNotifications(): Promise<ProcessResult[]> {
    if (this.isProcessing) {
      console.log('Queue processing already in progress, skipping');
      return [];
    }

    this.isProcessing = true;
    const results: ProcessResult[] = [];

    try {
      // Fetch pending notifications in FIFO order
      const { data: notifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', RETRY_CONFIG.maxAttempts)
        .order('scheduled_at', { ascending: true })
        .limit(PROCESSING_CONFIG.batchSize);

      if (error) {
        console.error('Failed to fetch pending notifications:', error);
        return results;
      }

      if (!notifications || notifications.length === 0) {
        console.log('No pending notifications to process');
        return results;
      }

      console.log(`Processing ${notifications.length} pending notifications`);

      // Process notifications with concurrency limit
      for (let i = 0; i < notifications.length; i += PROCESSING_CONFIG.maxConcurrent) {
        const batch = notifications.slice(i, i + PROCESSING_CONFIG.maxConcurrent);
        const batchResults = await Promise.allSettled(
          batch.map(notification => this.processNotification(notification))
        );

        batchResults.forEach((result, index) => {
          const notification = batch[index];
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Failed to process notification ${notification.id}:`, result.reason);
            results.push({
              notificationId: notification.id,
              success: false,
              error: result.reason?.message || 'Unknown error',
            });
          }
        });

        // Add delay between batches to avoid rate limiting
        if (i + PROCESSING_CONFIG.maxConcurrent < notifications.length) {
          await this.sleep(1000);
        }
      }

      console.log(`Processed ${results.length} notifications:`, {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single notification
   */
  private async processNotification(notification: any): Promise<ProcessResult> {
    const notificationId = notification.id;

    try {
      // Update attempts count
      await supabase
        .from('whatsapp_notifications')
        .update({ attempts: notification.attempts + 1 })
        .eq('id', notificationId);

      // Decrypt phone number before sending
      const decryptedPhone = await decryptPhoneNumberSafe(notification.customer_phone);

      // Send the message using Evolution API
      console.log(`Sending notification ${notificationId} to ${decryptedPhone}`);
      
      const response = await evolutionClient.sendTextMessage({
        number: decryptedPhone,
        text: notification.message_content,
        delay: 0
      });
      
      const messageId = response.key?.id || 'unknown';

      // Mark as sent
      await supabase
        .from('whatsapp_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          whatsapp_message_id: messageId,
        })
        .eq('id', notificationId);

      console.log(`Notification ${notificationId} sent successfully to ${decryptedPhone}`, {
        messageId,
        type: notification.notification_type
      });

      return {
        notificationId,
        success: true,
      };
    } catch (error) {
      console.error(`Failed to process notification ${notificationId}:`, {
        error: error instanceof Error ? error.message : error,
        phone: notification.customer_phone,
        type: notification.notification_type
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const attempts = notification.attempts + 1;

      // Log error for tracking
      await errorLogger.logError(error as Error, {
        operation: 'send_whatsapp_notification',
        orderId: notification.order_id,
        customerPhone: await decryptPhoneNumberSafe(notification.customer_phone),
        notificationId: notificationId,
        additionalData: {
          notificationType: notification.notification_type,
          attempts,
        }
      });

      // Check if we should retry
      if (attempts < RETRY_CONFIG.maxAttempts && this.isRetryableError(error as Error)) {
        // Calculate next retry delay
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempts - 1),
          RETRY_CONFIG.maxDelay
        );

        // Schedule retry
        await supabase
          .from('whatsapp_notifications')
          .update({
            scheduled_at: new Date(Date.now() + delay).toISOString(),
            error_message: errorMessage,
          })
          .eq('id', notificationId);

        console.log(`Notification ${notificationId} scheduled for retry in ${delay}ms (attempt ${attempts}/${RETRY_CONFIG.maxAttempts})`);
      } else {
        // Mark as failed
        await supabase
          .from('whatsapp_notifications')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', notificationId);

        console.error(`Notification ${notificationId} failed after ${attempts} attempts`);
      }

      return {
        notificationId,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<void> {
    console.log('Retrying failed notifications...');

    // Reset failed notifications to pending for retry
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .update({
        status: 'pending',
        attempts: 0,
        scheduled_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('status', 'failed')
      .lt('attempts', RETRY_CONFIG.maxAttempts)
      .select();

    if (error) {
      console.error('Failed to reset failed notifications:', error);
      return;
    }

    console.log(`Reset ${data?.length || 0} failed notifications for retry`);

    // Trigger processing
    await this.processPendingNotifications();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      // Get counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('whatsapp_notifications')
        .select('status');

      if (statusError) {
        console.error('Failed to fetch queue stats:', statusError);
        return this.getEmptyStats();
      }

      // Get today's notifications
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayNotifications, error: todayError } = await supabase
        .from('whatsapp_notifications')
        .select('status')
        .gte('created_at', today.toISOString());

      if (todayError) {
        console.error('Failed to fetch today stats:', todayError);
      }

      // Calculate stats
      const pending = statusCounts?.filter(n => n.status === 'pending').length || 0;
      const sent = statusCounts?.filter(n => n.status === 'sent').length || 0;
      const failed = statusCounts?.filter(n => n.status === 'failed').length || 0;
      const totalToday = todayNotifications?.length || 0;
      const sentToday = todayNotifications?.filter(n => n.status === 'sent').length || 0;
      const deliveryRate = totalToday > 0 ? (sentToday / totalToday) * 100 : 0;

      return {
        pending,
        sent,
        failed,
        totalToday,
        deliveryRate,
      };
    } catch (error) {
      console.error('Error calculating queue stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Start automatic queue processing
   */
  startAutoProcessing(): void {
    if (this.processingTimer) {
      console.warn('Auto-processing already started');
      return;
    }

    console.log('Starting automatic queue processing');
    this.processingTimer = setInterval(() => {
      this.processPendingNotifications().catch(err =>
        console.error('Error in auto-processing:', err)
      );
    }, PROCESSING_CONFIG.processingInterval);
  }

  /**
   * Stop automatic queue processing
   */
  stopAutoProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
      console.log('Stopped automatic queue processing');
    }
  }

  /**
   * Cancel a pending notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_notifications')
      .update({ status: 'cancelled' })
      .eq('id', notificationId)
      .eq('status', 'pending');

    if (error) {
      console.error('Failed to cancel notification:', error);
      throw new Error(`Failed to cancel notification: ${error.message}`);
    }

    console.log(`Notification ${notificationId} cancelled`);
  }

  /**
   * Get notifications for an order
   */
  async getOrderNotifications(orderId: string): Promise<QueuedNotification[]> {
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch order notifications:', error);
      return [];
    }

    // Decrypt phone numbers when retrieving
    const notifications = await Promise.all(
      (data || []).map(async (item) => ({
        id: item.id,
        orderId: item.order_id,
        customerPhone: await decryptPhoneNumberSafe(item.customer_phone),
        notificationType: item.notification_type,
        messageContent: item.message_content,
        status: item.status,
        attempts: item.attempts,
        scheduledAt: new Date(item.scheduled_at),
        sentAt: item.sent_at ? new Date(item.sent_at) : undefined,
        errorMessage: item.error_message,
        createdAt: new Date(item.created_at),
      }))
    );

    return notifications;
  }

  // Helper methods

  private async generateMessageContent(notification: NotificationRequest): Promise<string> {
    // Get order data if not provided
    let orderData = notification.orderDetails;
    
    if (!orderData) {
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
        .eq('id', notification.orderId)
        .single();

      if (error || !data) {
        throw new Error('Failed to fetch order data');
      }

      orderData = {
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
      };
    }

    // Generate message based on type
    switch (notification.notificationType) {
      case 'payment_confirmed':
        return await WhatsAppTemplates.generateOrderConfirmation(orderData);
      case 'preparing':
        return await WhatsAppTemplates.generatePreparingMessage(orderData);
      case 'ready':
        return await WhatsAppTemplates.generateReadyForPickup(orderData);
      case 'custom':
        return await WhatsAppTemplates.generateCustomMessage(orderData, notification.customMessage || '');
      default:
        throw new Error(`Unknown notification type: ${notification.notificationType}`);
    }
  }

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
    
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getEmptyStats(): QueueStats {
    return {
      pending: 0,
      sent: 0,
      failed: 0,
      totalToday: 0,
      deliveryRate: 0,
    };
  }
}

// Export singleton instance
export const queueManager = new NotificationQueueManager();
