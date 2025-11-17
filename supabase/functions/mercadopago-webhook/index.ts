// Mercado Pago Webhook Handler - Supabase Edge Function
// Handles payment notifications from Mercado Pago

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
};

interface MercadoPagoWebhook {
  id: string;
  type: string;
  action: string;
  data: {
    id: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Webhook received:', req.method);

    // Parse webhook data
    const webhookData: MercadoPagoWebhook = await req.json();
    console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

    // Only process payment notifications
    if (webhookData.type !== 'payment') {
      console.log('Ignoring non-payment webhook:', webhookData.type);
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook type not processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const paymentId = webhookData.data.id;
    console.log('Processing payment:', paymentId);

    // Get payment details from Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paymentResponse.ok) {
      throw new Error(`Failed to fetch payment: ${paymentResponse.statusText}`);
    }

    const payment = await paymentResponse.json();
    console.log('Payment status:', payment.status);
    console.log('Payment type:', payment.payment_type_id);
    console.log('Payment method:', payment.payment_method_id);
    console.log('Payment metadata:', payment.metadata);

    // Extract order ID from payment metadata
    const orderId = payment.metadata?.order_id || payment.external_reference;
    if (!orderId) {
      console.error('No order ID found in payment metadata');
      return new Response(
        JSON.stringify({ success: false, message: 'No order ID found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract payment method (payment_type_id from MercadoPago)
    // This will be: credit_card, debit_card, pix, bank_transfer, ticket, account_money
    const paymentMethod = payment.payment_type_id || 'pix'; // Default to pix if not specified

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine order status based on payment status
    let orderStatus = 'pending_payment';
    let paymentStatus = 'pending';
    let paymentConfirmedAt = null;

    if (payment.status === 'approved') {
      orderStatus = 'paid';
      paymentStatus = 'confirmed';
      paymentConfirmedAt = new Date().toISOString();
      console.log('Payment approved, updating order to paid via', paymentMethod);
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      orderStatus = 'cancelled';
      paymentStatus = 'failed';
      console.log('Payment rejected/cancelled');
    } else {
      console.log('Payment status not final:', payment.status);
    }

    // Update order status with payment method
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        payment_confirmed_at: paymentConfirmedAt,
        mercadopago_payment_id: paymentId,
        payment_method: paymentMethod,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    console.log('Order updated successfully:', updatedOrder);

    // Log webhook processing
    await supabase.from('payment_webhooks').insert({
      order_id: orderId,
      mercadopago_payment_id: paymentId,
      webhook_type: webhookData.type,
      webhook_action: webhookData.action,
      payment_status: payment.status,
      webhook_data: webhookData,
      payment_data: payment,
      processed_at: new Date().toISOString(),
    }).catch(err => {
      // Don't fail if logging fails
      console.error('Error logging webhook:', err);
    });

    // If payment approved, trigger notifications
    if (payment.status === 'approved') {
      console.log('Payment approved, triggering notifications for order:', orderId);
      
      // TODO: Trigger WhatsApp notification
      // This would call your WhatsApp notification service
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        orderId,
        status: orderStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
