// Cloudflare Pages Function to handle Mercado Pago webhooks
// This receives payment notifications and updates order status

interface Env {
  VITE_MERCADOPAGO_ACCESS_TOKEN: string;
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const webhookData = await context.request.json();
    
    console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

    // Only process payment notifications
    if (webhookData.type !== 'payment') {
      return new Response(JSON.stringify({ success: true, message: 'Not a payment webhook' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const paymentId = webhookData.data.id;
    const accessToken = context.env.VITE_MERCADOPAGO_ACCESS_TOKEN;

    // Fetch payment details from Mercado Pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!paymentResponse.ok) {
      throw new Error(`Failed to fetch payment: ${paymentResponse.statusText}`);
    }

    const payment = await paymentResponse.json();
    const orderId = payment.metadata?.order_id || payment.external_reference;

    if (!orderId) {
      console.error('No order ID in payment metadata');
      return new Response(JSON.stringify({ success: false, message: 'No order ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine order status and payment status
    let orderStatus = 'pending_payment';
    let paymentStatus = 'pending';
    let paymentConfirmedAt = null;

    if (payment.status === 'approved') {
      orderStatus = 'paid';
      paymentStatus = 'confirmed';
      paymentConfirmedAt = new Date().toISOString();
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      orderStatus = 'cancelled';
      paymentStatus = 'failed';
    }

    // Update order in Supabase
    const supabaseUrl = context.env.VITE_SUPABASE_URL;
    const serviceRoleKey = context.env.SUPABASE_SERVICE_KEY;

    // First, check if this payment has already been processed (idempotency)
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=mercadopago_payment_id,payment_status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (checkResponse.ok) {
      const orders = await checkResponse.json();
      if (orders.length > 0 && orders[0].mercadopago_payment_id === paymentId) {
        console.log(`Payment ${paymentId} already processed for order ${orderId}`);
        return new Response(JSON.stringify({
          success: true,
          message: 'Payment already processed',
          orderId,
          status: orders[0].payment_status
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: orderStatus,
        payment_status: paymentStatus,
        payment_confirmed_at: paymentConfirmedAt,
        mercadopago_payment_id: paymentId
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Failed to update order:', error);
      throw new Error(`Failed to update order: ${error}`);
    }

    console.log(`Order ${orderId} updated - status: ${orderStatus}, payment_status: ${paymentStatus}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed',
      orderId,
      status: orderStatus,
      payment_status: paymentStatus
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
