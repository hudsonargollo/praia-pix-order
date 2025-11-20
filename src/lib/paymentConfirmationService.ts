/**
 * Payment Confirmation Service
 * Centralized service for handling payment confirmations with deduplication
 * and coordinated WhatsApp notifications
 */

import { supabase } from '@/integrations/supabase/client';
import { notificationTriggers } from '@/integrations/whatsapp';
import { errorLogger } from '@/integrations/whatsapp/error-logger';

export interface PaymentConfirmationOptions {
  orderId: string;
  source: 'manual' | 'webhook' | 'mercadopago';
  paymentMethod?: string;
  paymentId?: string;
}

export interface PaymentConfirmationResult {
  success: boolean;
  orderId: string;
  notificationSent: boolean;
  error?: string;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  payment_confirmed_at: string | null;
}

/**
 * PaymentConfirmationService
 * Handles all payment confirmation operations with deduplication
 */
export class PaymentConfirmationService {
  /**
   * Main entry point for payment confirmation
   * Coordinates database updates, deduplication, and notifications
   */
  async confirmPayment(options: PaymentConfirmationOptions): Promise<PaymentConfirmationResult> {
    const { orderId, source, paymentMethod, paymentId } = options;

    console.log('[PaymentConfirmationService] Payment confirmation requested:', {
      orderId,
      source,
      paymentMethod,
      paymentId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Validate input
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // Check if notification was recently sent (deduplication)
      const wasNotified = await this.wasRecentlyNotified(orderId);
      if (wasNotified) {
        console.log('[PaymentConfirmationService] Payment confirmation skipped - notification recently sent:', {
          orderId,
          source,
          reason: 'deduplication_check_passed',
          timestamp: new Date().toISOString(),
        });
        await this.logEvent(orderId, 'duplicate_confirmation_attempt', {
          source,
          reason: 'notification_recently_sent',
        });

        return {
          success: true,
          orderId,
          notificationSent: false,
          error: 'Notification already sent recently',
        };
      }

      console.log('[PaymentConfirmationService] Deduplication check passed - proceeding with confirmation:', {
        orderId,
        source,
      });

      // Update order status in database
      let order: Order | null = null;
      try {
        order = await this.updateOrder(orderId, {
          status: 'in_preparation',
          payment_status: 'confirmed',
          payment_confirmed_at: new Date().toISOString(),
          payment_method: paymentMethod,
          ...(paymentId && { mercadopago_payment_id: paymentId }),
        });
      } catch (dbError) {
        console.error('Database update failed:', dbError);
        
        // Log database error
        await errorLogger.logError(dbError as Error, {
          operation: 'update_order_payment_status',
          orderId,
          additionalData: { source, paymentMethod },
        });

        await this.logEvent(orderId, 'database_update_failed', {
          source,
          error: (dbError as Error).message,
        });

        throw new Error(`Database update failed: ${(dbError as Error).message}`);
      }

      if (!order) {
        throw new Error('Failed to update order - order not found');
      }

      // Send WhatsApp notification (non-blocking)
      let notificationSent = false;
      try {
        notificationSent = await this.notifyCustomer(order);
      } catch (notificationError) {
        console.error('WhatsApp notification failed:', notificationError);
        
        // Log notification error but don't fail the payment confirmation
        await errorLogger.logError(notificationError as Error, {
          operation: 'send_payment_notification',
          orderId,
          customerPhone: order.customer_phone,
          additionalData: { source },
        });

        await this.logEvent(orderId, 'notification_failed', {
          source,
          error: (notificationError as Error).message,
          paymentConfirmed: true, // Payment was confirmed despite notification failure
        });

        // Continue - payment is confirmed even if notification fails
        notificationSent = false;
      }

      // Log successful confirmation
      await this.logEvent(orderId, 'payment_confirmed', {
        source,
        paymentMethod,
        paymentId,
        notificationSent,
      });

      console.log('[PaymentConfirmationService] Payment confirmation completed successfully:', {
        orderId,
        source,
        paymentMethod,
        paymentId,
        notificationSent,
        orderStatus: 'in_preparation',
        paymentStatus: 'confirmed',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        orderId,
        notificationSent,
      };
    } catch (error) {
      console.error('Error confirming payment:', error);

      // Log error
      await errorLogger.logError(error as Error, {
        operation: 'confirm_payment',
        orderId,
        additionalData: { source, paymentMethod, paymentId },
      });

      await this.logEvent(orderId, 'payment_confirmation_failed', {
        source,
        error: (error as Error).message,
      });

      return {
        success: false,
        orderId,
        notificationSent: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check if notification was recently sent to prevent duplicates
   * Checks for any notification sent within the last 5 minutes
   * 
   * Error handling: Fails open (returns false) to allow notifications on error
   * This prevents database issues from blocking legitimate payment confirmations
   */
  private async wasRecentlyNotified(orderId: string): Promise<boolean> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('whatsapp_notifications')
        .select('id, notification_type, sent_at')
        .eq('order_id', orderId)
        .in('notification_type', ['payment_confirmed', 'order_created'])
        .eq('status', 'sent')
        .gte('sent_at', fiveMinutesAgo)
        .limit(1);

      if (error) {
        console.error('Error checking recent notifications:', error);
        
        // Log error but don't fail the payment confirmation
        await errorLogger.logError(error as Error, {
          operation: 'check_recent_notifications',
          orderId,
          additionalData: { reason: 'deduplication_check_failed' },
        }).catch(err => {
          console.error('Failed to log deduplication error:', err);
        });

        // On error, allow the notification to proceed (fail open)
        // This ensures database issues don't block legitimate confirmations
        return false;
      }

      const wasNotified = data && data.length > 0;
      if (wasNotified) {
        const timeSinceNotification = Math.round((Date.now() - new Date(data[0].sent_at).getTime()) / 1000);
        console.log('[PaymentConfirmationService] Recent notification found - preventing duplicate:', {
          orderId,
          notificationId: data[0].id,
          notificationType: data[0].notification_type,
          sentAt: data[0].sent_at,
          timeSinceNotification: `${timeSinceNotification}s`,
          deduplicationWindow: '5 minutes',
        });
      } else {
        console.log('[PaymentConfirmationService] No recent notification found - proceeding with confirmation:', {
          orderId,
          deduplicationWindow: '5 minutes',
        });
      }

      return wasNotified;
    } catch (error) {
      console.error('Unexpected error in wasRecentlyNotified:', error);
      
      // Log unexpected errors
      await errorLogger.logError(error as Error, {
        operation: 'check_recent_notifications',
        orderId,
        additionalData: { reason: 'unexpected_error' },
      }).catch(err => {
        console.error('Failed to log unexpected error:', err);
      });

      // On error, allow the notification to proceed (fail open)
      return false;
    }
  }

  /**
   * Update order in database with payment confirmation
   * 
   * Error handling: Throws on failure to ensure payment confirmation is atomic
   * If database update fails, the entire confirmation process should fail
   */
  private async updateOrder(
    orderId: string,
    updates: Partial<{
      status: string;
      payment_status: string;
      payment_confirmed_at: string;
      payment_method?: string;
      mercadopago_payment_id?: string;
    }>
  ): Promise<Order | null> {
    try {
      console.log('Updating order in database:', { orderId, updates });

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select('id, order_number, customer_name, customer_phone, status, payment_status, payment_confirmed_at')
        .single();

      if (error) {
        console.error('Database error updating order:', error);
        
        // Check for specific error types
        if (error.code === 'PGRST116') {
          throw new Error(`Order not found: ${orderId}`);
        } else if (error.code === '23505') {
          throw new Error('Duplicate key violation - order may already be confirmed');
        } else if (error.message.includes('permission')) {
          throw new Error('Permission denied - insufficient privileges to update order');
        } else {
          throw new Error(`Database update failed: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error(`Order not found or update returned no data: ${orderId}`);
      }

      console.log('Order updated successfully:', {
        orderId: data.id,
        orderNumber: data.order_number,
        status: data.status,
        paymentStatus: data.payment_status,
        paymentConfirmedAt: data.payment_confirmed_at,
      });

      return data;
    } catch (error) {
      console.error('Error in updateOrder:', error);
      // Re-throw to be handled by caller
      throw error;
    }
  }

  /**
   * Send WhatsApp notification to customer
   * 
   * Error handling: Catches all errors and returns false on failure
   * Notification failures should NOT block payment confirmation
   * Payment is confirmed even if notification fails
   */
  private async notifyCustomer(order: Order): Promise<boolean> {
    try {
      console.log('Sending WhatsApp notification:', {
        orderId: order.id,
        orderNumber: order.order_number,
        customerPhone: order.customer_phone,
      });

      // Validate customer phone before attempting notification
      if (!order.customer_phone) {
        console.warn('No customer phone number - skipping notification');
        await this.logEvent(order.id, 'notification_skipped', {
          reason: 'no_phone_number',
        });
        return false;
      }

      // Trigger WhatsApp notification through the notification service
      await notificationTriggers.onPaymentConfirmed(order.id);

      console.log('WhatsApp notification triggered successfully');
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);

      // Log notification error but don't fail the payment confirmation
      await errorLogger.logError(error as Error, {
        operation: 'notify_customer_payment_confirmed',
        orderId: order.id,
        customerPhone: order.customer_phone,
        additionalData: {
          orderNumber: order.order_number,
          customerName: order.customer_name,
        },
      }).catch(err => {
        console.error('Failed to log notification error:', err);
      });

      // Return false to indicate notification failed, but payment is still confirmed
      return false;
    }
  }

  /**
   * Log payment confirmation event
   * Logs all events to payment_confirmation_log table for tracking and debugging
   */
  private async logEvent(
    orderId: string,
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[PaymentConfirmationService] Logging event: ${event}`, {
        orderId,
        event,
        data,
        timestamp,
      });

      const logEntry = {
        order_id: orderId,
        source: data.source || 'unknown',
        payment_method: data.paymentMethod || null,
        payment_id: data.paymentId || null,
        notification_sent: data.notificationSent || false,
        notification_error: data.error || null,
        created_at: timestamp,
      };

      const { error } = await supabase
        .from('payment_confirmation_log')
        .insert(logEntry);

      if (error) {
        console.error('[PaymentConfirmationService] Error logging payment confirmation event:', {
          event,
          orderId,
          error: error.message,
          logEntry,
        });
        // Don't throw - logging failures shouldn't break the flow
        
        // Try to log to error logger as fallback
        await errorLogger.logError(new Error(`Failed to log event: ${event}`), {
          operation: 'log_payment_event',
          orderId,
          additionalData: { event, logEntry, dbError: error.message },
        }).catch(err => {
          console.error('[PaymentConfirmationService] Failed to log to error logger:', err);
        });
      } else {
        console.log(`[PaymentConfirmationService] Event logged successfully to payment_confirmation_log:`, {
          event,
          orderId,
          source: logEntry.source,
          notificationSent: logEntry.notification_sent,
          timestamp,
        });
      }
    } catch (error) {
      console.error('[PaymentConfirmationService] Error in logEvent:', {
        event,
        orderId,
        error: error instanceof Error ? error.message : error,
      });
      // Don't throw - logging failures shouldn't break the flow
    }
  }
}

// Export singleton instance
export const paymentConfirmationService = new PaymentConfirmationService();
