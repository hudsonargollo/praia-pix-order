// Cloudflare Pages Function to generate PIX for waiter orders
// This creates a MercadoPago payment and stores PIX data in the order

// Type definitions for Cloudflare Pages Functions
type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, unknown>;
}) => Response | Promise<Response>;

interface Env {
  VITE_MERCADOPAGO_ACCESS_TOKEN: string;
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface GeneratePIXRequest {
  orderId: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { orderId }: GeneratePIXRequest = await context.request.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = context.env.VITE_SUPABASE_URL;
    const serviceRoleKey = context.env.SUPABASE_SERVICE_KEY;
    const accessToken = context.env.VITE_MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'MercadoPago not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch order from database
    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch order');
    }

    const orders = await orderResponse.json();
    const order = orders[0];

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate order has waiter_id
    if (!order.waiter_id) {
      return new Response(JSON.stringify({ error: 'Order must be created by a waiter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate payment_status is pending
    if (order.payment_status !== 'pending') {
      return new Response(JSON.stringify({ 
        error: 'Order payment status must be pending',
        currentStatus: order.payment_status 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if PIX already exists and is not expired
    if (order.pix_qr_code && order.pix_expires_at) {
      const expiresAt = new Date(order.pix_expires_at);
      if (expiresAt > new Date()) {
        return new Response(JSON.stringify({
          error: 'PIX already generated and not expired',
          qrCode: order.pix_qr_code,
          expiresAt: order.pix_expires_at
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Create payment with MercadoPago
    const expirationDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    const paymentPayload = {
      transaction_amount: order.total_amount,
      description: `Pedido Garçom #${order.id.slice(0, 8)} - ${order.customer_name || 'Cliente'}`,
      payment_method_id: 'pix',
      date_of_expiration: expirationDate,
      payer: {
        email: `${(order.customer_phone || '').replace(/\D/g, '')}@placeholder.com`,
        first_name: (order.customer_name || 'Cliente').split(' ')[0],
        last_name: (order.customer_name || 'Cliente').split(' ').slice(1).join(' ') || 'Cliente',
      },
      metadata: {
        order_id: orderId,
        waiter_id: order.waiter_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone
      },
      external_reference: orderId,
      notification_url: `https://${context.request.headers.get('host')}/api/mercadopago/webhook`
    };

    const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${orderId}-${Date.now()}`
      },
      body: JSON.stringify(paymentPayload)
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      console.error('MercadoPago API error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to create payment', 
        details: error 
      }), {
        status: paymentResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payment = await paymentResponse.json();
    const pixData = payment.point_of_interaction?.transaction_data;

    if (!pixData || !pixData.qr_code) {
      return new Response(JSON.stringify({ 
        error: 'Failed to generate PIX QR code' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update order with PIX data
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        pix_qr_code: pixData.qr_code,
        pix_generated_at: new Date().toISOString(),
        pix_expires_at: payment.date_of_expiration || expirationDate,
        mercadopago_payment_id: String(payment.id)
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Failed to update order with PIX data:', error);
      throw new Error(`Failed to update order: ${error}`);
    }

    console.log(`PIX generated for order ${orderId}`);

    // Return PIX data
    return new Response(JSON.stringify({
      success: true,
      qrCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64 || '',
      amount: order.total_amount,
      expiresAt: payment.date_of_expiration || expirationDate,
      paymentId: String(payment.id)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Generate PIX error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
