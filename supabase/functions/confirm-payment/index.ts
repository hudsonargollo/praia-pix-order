// Payment Confirmation Edge Function
// Centralized endpoint for payment confirmation with deduplication
// Can be called from Cashier panel, webhooks, or other payment sources

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentConfirmationRequest {
  orderId: string;
  source: 'manual' | 'webhook' | 'mercadopago';
  paymentMethod?: string;
  paymentId?: string;
}

interface PaymentConfirmationResponse {
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const timestamp = new Date().toISOString();
    console.log('[confirm-payment] Function invoked:', {
      method: req.method,
      url: req.url,
      timestamp,
    });

    // Parse request body
    const requestData: PaymentConfirmationRequest = await req.json();
    const { orderId, source, paymentMethod, paymentId } = requestData;

    console.log('[confirm-payment] Payment confirmation requested:', {
      orderId,
      source,
      paymentMethod,
      paymentId,
      timestamp,
    });

    // Validate required fields
    if (!orderId) {
      console.warn('[confirm-payment] Missing orderId');
      return new Response(
        JSON.stringify({
          success: false,
          orderId: '',
          notificationSent: false,
          error: 'Order ID is required',
        } as PaymentConfirmationResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!source || !['manual', 'webhook', 'mercadopago'].includes(source)) {
      console.warn('[confirm-payment] Invalid source:', source);
      return new Response(
        JSON.stringify({
          success: false,
          orderId,
          notificationSent: false,
          error: 'Invalid source. Must be: manual, webhook, or mercadopago',
        } as PaymentConfirmationResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[confirm-payment] Missing environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          orderId,
          notificationSent: false,
          error: 'Server configuration error',
        } as PaymentConfirmationResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if notification was recently sent (deduplication)
    const wasNotified = await checkRecentNotification(supabase, orderId);
    if (wasNotified) {
      console.log('[confirm-payment] Notification recently sent - skipping:', {
        orderId,
        source,
        reason: 'deduplication_check_passed',
        timestamp: new Date().toISOString(),
      });
      
      await logEvent(supabase, orderId, 'duplicate_confirmation_attempt', {
        source,
        reason: 'notification_recently_sent',
      });

      return new Response(
        JSON.stringify({
          success: true,
          orderId,
          notificationSent: false,
          error: 'Notification already sent recently',
        } as PaymentConfirmationResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update order status in database
    let order: Order | null = null;
    try {
      order = await updateOrder(supabase, orderId, {
        status: 'in_preparation',
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        payment_method: paymentMethod,
        ...(paymentId && { mercadopago_payment_id: paymentId }),
      });
    } catch (dbError) {
      console.error('[confirm-payment] Database update failed:', dbError);
      
      await logError(supabase, dbError as Error, {
        operation: 'update_order_payment_status',
        orderId,
        additionalData: { source, paymentMethod },
      });

      await logEvent(supabase, orderId, 'database_update_failed', {
        source,
        error: (dbError as Error).message,
      });

      return new Response(
        JSON.stringify({
          success: false,
          orderId,
          notificationSent: false,
          error: `Database update failed: ${(dbError as Error).message}`,
        } as PaymentConfirmationResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!order) {
      console.error('[confirm-payment] Order not found:', orderId);
      return new Response(
        JSON.stringify({
          success: false,
          orderId,
          notificationSent: false,
          error: 'Order not found',
        } as PaymentConfirmationResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send WhatsApp notification (non-blocking)
    let notificationSent = false;
    try {
      notificationSent = await notifyCustomer(supabase, order);
    } catch (notificationError) {
      console.error('[confirm-payment] WhatsApp notification failed:', notificationError);
      
      await logError(supabase, notificationError as Error, {
        operation: 'send_payment_notification',
        orderId,
        customerPhone: order.customer_phone,
        additionalData: { source },
      });

      await logEvent(supabase, orderId, 'notification_failed', {
        source,
        error: (notificationError as Error).message,
        paymentConfirmed: true,
      });

      // Continue - payment is confirmed even if notification fails
      notificationSent = false;
    }

    // Log successful confirmation
    await logEvent(supabase, orderId, 'payment_confirmed', {
      source,
      paymentMethod,
      paymentId,
      notificationSent,
    });

    console.log('[confirm-payment] Payment confirmation completed successfully:', {
      orderId,
      source,
      paymentMethod,
      paymentId,
      notificationSent,
      orderStatus: 'in_preparation',
      paymentStatus: 'confirmed',
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        notificationSent,
      } as PaymentConfirmationResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[confirm-payment] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        orderId: '',
        notificationSent: false,
        error: (error as Error).message || 'Internal server error',
      } as PaymentConfirmationResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Check if notification was recently sent to prevent duplicates
 * Checks for any notification sent within the last 5 minutes
 */
async function checkRecentNotification(
  supabase: any,
  orderId: string
): Promise<boolean> {
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
      console.error('[confirm-payment] Error checking recent notifications:', error);
      // On error, allow the notification to proceed (fail open)
      return false;
    }

    const wasNotified = data && data.length > 0;
    if (wasNotified) {
      const timeSinceNotification = Math.round((Date.now() - new Date(data[0].sent_at).getTime()) / 1000);
      console.log('[confirm-payment] Recent notification found - preventing duplicate:', {
        orderId,
        notificationId: data[0].id,
        notificationType: data[0].notification_type,
        sentAt: data[0].sent_at,
        timeSinceNotification: `${timeSinceNotification}s`,
        deduplicationWindow: '5 minutes',
      });
    } else {
      console.log('[confirm-payment] No recent notification found - proceeding:', {
        orderId,
        deduplicationWindow: '5 minutes',
      });
    }

    return wasNotified;
  } catch (error) {
    console.error('[confirm-payment] Unexpected error in checkRecentNotification:', error);
    // On error, allow the notification to proceed (fail open)
    return false;
  }
}

/**
 * Update order in database with payment confirmation
 */
async function updateOrder(
  supabase: any,
  orderId: string,
  updates: Partial<{
    status: string;
    payment_status: string;
    payment_confirmed_at: string;
    payment_method?: string;
    mercadopago_payment_id?: string;
  }>
): Promise<Order | null> {
  console.log('[confirm-payment] Updating order in database:', { orderId, updates });

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select('id, order_number, customer_name, customer_phone, status, payment_status, payment_confirmed_at')
    .single();

  if (error) {
    console.error('[confirm-payment] Database error updating order:', error);
    
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

  console.log('[confirm-payment] Order updated successfully:', {
    orderId: data.id,
    orderNumber: data.order_number,
    status: data.status,
    paymentStatus: data.payment_status,
  });

  return data;
}

/**
 * Send WhatsApp notification to customer
 * Enqueues notification in the whatsapp_notifications table for processing
 */
async function notifyCustomer(
  supabase: any,
  order: Order
): Promise<boolean> {
  console.log('[confirm-payment] Sending WhatsApp notification:', {
    orderId: order.id,
    orderNumber: order.order_number,
    customerPhone: order.customer_phone,
  });

  // Validate customer phone
  if (!order.customer_phone) {
    console.warn('[confirm-payment] No customer phone number - skipping notification');
    return false;
  }

  try {
    // Generate message content for payment confirmation
    const messageContent = await generatePaymentConfirmationMessage(order);

    // Encrypt phone number before storing (basic encryption for now)
    // In production, use proper encryption matching the frontend implementation
    const encryptedPhone = order.customer_phone; // TODO: Implement encryption

    // Insert notification into queue for processing
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .insert({
        order_id: order.id,
        customer_phone: encryptedPhone,
        notification_type: 'payment_confirmed',
        message_content: messageContent,
        status: 'pending',
        attempts: 0,
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[confirm-payment] Failed to enqueue notification:', error);
      return false;
    }

    console.log('[confirm-payment] WhatsApp notification enqueued:', {
      notificationId: data.id,
      orderId: order.id,
    });
    
    return true;
  } catch (error) {
    console.error('[confirm-payment] Error enqueueing WhatsApp notification:', error);
    return false;
  }
}

/**
 * Generate payment confirmation message
 */
async function generatePaymentConfirmationMessage(order: Order): Promise<string> {
  const emoji = '✅';
  const greeting = `Olá ${order.customer_name}!`;
  const confirmation = `Seu pagamento foi confirmado! 🎉`;
  const orderInfo = `\n\n📋 *Pedido #${order.order_number}*`;
  const status = `\n\n👨‍🍳 Seu pedido já está sendo preparado pela nossa equipe!`;
  const thanks = `\n\nObrigado pela preferência! 🙏`;

  return `${emoji} ${greeting}\n\n${confirmation}${orderInfo}${status}${thanks}`;
}

/**
 * Log payment confirmation event
 */
async function logEvent(
  supabase: any,
  orderId: string,
  event: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[confirm-payment] Logging event: ${event}`, {
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
      console.error('[confirm-payment] Error logging event to payment_confirmation_log:', {
        event,
        orderId,
        error: error.message,
        logEntry,
      });
      // Don't throw - logging failures shouldn't break the flow
    } else {
      console.log(`[confirm-payment] Event logged successfully to payment_confirmation_log:`, {
        event,
        orderId,
        source: logEntry.source,
        notificationSent: logEntry.notification_sent,
        timestamp,
      });
    }
  } catch (error) {
    console.error('[confirm-payment] Error in logEvent:', {
      event,
      orderId,
      error: error instanceof Error ? error.message : error,
    });
    // Don't throw - logging failures shouldn't break the flow
  }
}

/**
 * Log error to whatsapp_error_logs table
 */
async function logError(
  supabase: any,
  error: Error,
  context: {
    operation: string;
    orderId: string;
    customerPhone?: string;
    additionalData?: Record<string, any>;
  }
): Promise<void> {
  try {
    const errorLog = {
      error_type: error.name || 'Error',
      error_message: error.message,
      operation: context.operation,
      order_id: context.orderId,
      customer_phone: context.customerPhone || null,
      additional_data: context.additionalData || {},
      created_at: new Date().toISOString(),
    };

    await supabase
      .from('whatsapp_error_logs')
      .insert(errorLog);
  } catch (logError) {
    console.error('[confirm-payment] Failed to log error:', logError);
    // Don't throw - logging failures shouldn't break the flow
  }
}
