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

    // Initialize Supabase client with service role key for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Handle payment status
    if (payment.status === 'approved') {
      console.log('Payment approved, calling centralized confirmation service');
      
      // Call the centralized confirm-payment edge function
      try {
        const confirmResponse = await fetch(`${supabaseUrl}/functions/v1/confirm-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            source: 'mercadopago',
            paymentMethod,
            paymentId,
          }),
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          console.error('Payment confirmation failed:', errorData);
          throw new Error(errorData.error || 'Payment confirmation failed');
        }

        const confirmResult = await confirmResponse.json();
        console.log('Payment confirmation result:', confirmResult);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Webhook processed successfully',
            orderId,
            status: 'in_preparation',
            notificationSent: confirmResult.notificationSent,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (confirmError) {
        console.error('Error calling confirm-payment service:', confirmError);
        
        // Return error response
        return new Response(
          JSON.stringify({
            success: false,
            message: `Payment confirmation failed: ${confirmError.message}`,
            orderId,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      console.log('Payment rejected/cancelled, updating order status');
      
      // For rejected/cancelled payments, update directly (no notification needed)
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          mercadopago_payment_id: paymentId,
          payment_method: paymentMethod,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook processed successfully',
          orderId,
          status: 'cancelled',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      console.log('Payment status not final:', payment.status);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook processed - payment status not final',
          orderId,
          status: payment.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

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
