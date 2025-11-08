// Webhook utilities for MercadoPago integration
import { supabase } from "@/integrations/supabase/client";
import { mercadoPagoService } from "./client";
import { notificationTriggers } from "@/integrations/whatsapp";
import type { MercadoPagoWebhookData } from "./types";

/**
 * Service for handling webhook-related operations
 */
export class WebhookService {
  /**
   * Process webhook data and update order status
   * This is used as a fallback when webhook endpoint is not available
   */
  static async processWebhookData(webhookData: MercadoPagoWebhookData): Promise<boolean> {
    try {
      // Only process payment webhooks
      if (webhookData.type !== 'payment') {
        return true;
      }

      const paymentId = webhookData.data.id;
      
      // Get payment status from MercadoPago
      const paymentStatus = await mercadoPagoService.checkPaymentStatus(paymentId);
      
      // Find order by external reference (order ID)
      // Note: This assumes the external_reference was set to the order ID
      const { data: orders, error: findError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', paymentStatus.id) // This might need adjustment based on how external_reference is stored
        .limit(1);

      if (findError || !orders || orders.length === 0) {
        console.error('Order not found for payment:', paymentId);
        return false;
      }

      const order = orders[0];
      let newStatus = order.status;
      let paymentConfirmedAt = order.payment_confirmed_at;

      // Update status based on payment status
      if (paymentStatus.status === 'approved' && order.status === 'pending_payment') {
        newStatus = 'paid';
        paymentConfirmedAt = new Date().toISOString();
      } else if (paymentStatus.status === 'rejected' || paymentStatus.status === 'cancelled') {
        newStatus = 'cancelled';
      }

      // Update order if status changed
      if (newStatus !== order.status) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: newStatus,
            payment_confirmed_at: paymentConfirmedAt
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('Error updating order status:', updateError);
          return false;
        }

        // Trigger WhatsApp notification if payment was approved
        if (newStatus === 'paid') {
          await notificationTriggers.onPaymentConfirmed(order.id);
        }

        // Log the webhook processing
        await this.logWebhookProcessing(webhookData, order.id, newStatus);
      }

      return true;
    } catch (error) {
      console.error('Error processing webhook data:', error);
      return false;
    }
  }

  /**
   * Validate webhook signature for security
   */
  static validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // In a real implementation, this would use HMAC-SHA256
      // For now, just check if signature exists
      return !!(signature && signature.length > 0);
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Log webhook processing for audit trail
   */
  private static async logWebhookProcessing(
    webhookData: MercadoPagoWebhookData, 
    orderId: string, 
    status: string
  ): Promise<void> {
    try {
      console.log('Webhook processed:', {
        webhookId: webhookData.id,
        orderId,
        status,
        timestamp: new Date().toISOString(),
        action: webhookData.action
      });

      // TODO: Store in payment_webhooks table when it's created
      // This would be implemented in task 6.2
    } catch (error) {
      console.error('Error logging webhook processing:', error);
    }
  }

  /**
   * Handle duplicate webhook prevention
   */
  static async isDuplicateWebhook(webhookId: string): Promise<boolean> {
    try {
      // TODO: Check payment_webhooks table for existing webhook ID
      // For now, return false (no duplicate detection)
      return false;
    } catch (error) {
      console.error('Error checking for duplicate webhook:', error);
      return false;
    }
  }

  /**
   * Get webhook processing status
   */
  static async getWebhookStatus(webhookId: string): Promise<'processed' | 'pending' | 'failed' | 'not_found'> {
    try {
      // TODO: Query payment_webhooks table
      // For now, return 'not_found'
      return 'not_found';
    } catch (error) {
      console.error('Error getting webhook status:', error);
      return 'failed';
    }
  }

}

export default WebhookService;