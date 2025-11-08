// MercadoPago webhook handler
// This file should be deployed as a serverless function (e.g., Vercel, Netlify)

import { supabase } from "@/integrations/supabase/client";
import { mercadoPagoService } from "@/integrations/mercadopago/client";
import type { MercadoPagoWebhookData } from "@/integrations/mercadopago/types";

// Types for webhook processing
interface WebhookRequest {
  body: MercadoPagoWebhookData;
  headers: {
    'x-signature'?: string;
    'x-request-id'?: string;
  };
}

interface WebhookResponse {
  status: number;
  body: {
    success: boolean;
    message: string;
    orderId?: string;
  };
}

/**
 * Process MercadoPago webhook notifications
 * This function should be deployed as a serverless function
 */
export async function handleMercadoPagoWebhook(request: WebhookRequest): Promise<WebhookResponse> {
  try {
    const webhookData = request.body;
    const signature = request.headers['x-signature'];

    // Validate webhook signature for security
    if (!signature || !mercadoPagoService.validateWebhookSignature(JSON.stringify(webhookData), signature)) {
      console.error('Invalid webhook signature');
      return {
        status: 401,
        body: {
          success: false,
          message: 'Invalid signature'
        }
      };
    }

    // Only process payment-related webhooks
    if (webhookData.type !== 'payment') {
      return {
        status: 200,
        body: {
          success: true,
          message: 'Webhook type not processed'
        }
      };
    }

    // Process the webhook
    const result = await mercadoPagoService.processWebhook(webhookData);
    
    if (!result.orderId) {
      console.error('No order ID found in webhook data');
      return {
        status: 400,
        body: {
          success: false,
          message: 'No order ID found'
        }
      };
    }

    // Update order status based on payment status
    let orderStatus = 'pending_payment';
    let paymentConfirmedAt = null;

    if (result.status === 'approved') {
      orderStatus = 'paid';
      paymentConfirmedAt = new Date().toISOString();
    } else if (result.status === 'rejected' || result.status === 'cancelled') {
      orderStatus = 'cancelled';
    }

    // Update order in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_confirmed_at: paymentConfirmedAt,
        // mercadopago_payment_id: result.paymentId // Add when database schema is updated
      })
      .eq('id', result.orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return {
        status: 500,
        body: {
          success: false,
          message: 'Database update failed'
        }
      };
    }

    // Log webhook processing for audit trail
    await logWebhookProcessing(webhookData, result.orderId, orderStatus);

    // If payment was approved, trigger additional actions
    if (result.status === 'approved') {
      await handlePaymentApproved(result.orderId);
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Webhook processed successfully',
        orderId: result.orderId
      }
    };

  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Internal server error'
      }
    };
  }
}

/**
 * Log webhook processing for audit trail
 */
async function logWebhookProcessing(webhookData: MercadoPagoWebhookData, orderId: string, status: string) {
  try {
    // This would require a payment_webhooks table in the database
    // For now, just log to console
    console.log('Webhook processed:', {
      webhookId: webhookData.id,
      orderId,
      status,
      timestamp: new Date().toISOString()
    });

    // TODO: Implement database logging when payment_webhooks table is created
    /*
    await supabase
      .from('payment_webhooks')
      .insert({
        order_id: orderId,
        webhook_data: webhookData,
        processed_at: new Date().toISOString()
      });
    */
  } catch (error) {
    console.error('Error logging webhook:', error);
  }
}

/**
 * Handle actions when payment is approved
 */
async function handlePaymentApproved(orderId: string) {
  try {
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Error fetching order for approved payment:', error);
      return;
    }

    // TODO: Trigger WhatsApp notification (implement in task 7)
    console.log('Payment approved for order:', order.order_number);

    // TODO: Notify kitchen panel via real-time subscription (implement in task 10)
    console.log('Notifying kitchen of new paid order:', orderId);

  } catch (error) {
    console.error('Error handling approved payment:', error);
  }
}

// Export for serverless deployment
export default handleMercadoPagoWebhook;