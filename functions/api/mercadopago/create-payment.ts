// Cloudflare Pages Function to create Mercado Pago payment
// This proxies the request to Mercado Pago API with proper metadata

interface Env {
  VITE_MERCADOPAGO_ACCESS_TOKEN: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { orderId, amount, description, customerName, customerPhone, tableNumber } = await context.request.json();

    const accessToken = context.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Mercado Pago not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create payment with Mercado Pago
    const paymentPayload = {
      transaction_amount: amount,
      description,
      payment_method_id: 'pix',
      payer: {
        email: `${customerPhone.replace(/\D/g, '')}@placeholder.com`,
        first_name: customerName.split(' ')[0] || customerName,
        last_name: customerName.split(' ').slice(1).join(' ') || customerName,
      },
      metadata: {
        order_id: orderId,
        table_number: tableNumber,
        customer_name: customerName,
        customer_phone: customerPhone
      },
      external_reference: orderId,
      notification_url: `https://${context.request.headers.get('host')}/api/mercadopago/webhook`
    };

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${orderId}-${Date.now()}`
      },
      body: JSON.stringify(paymentPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mercado Pago API error:', error);
      return new Response(JSON.stringify({ error: 'Payment creation failed', details: error }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payment = await response.json();

    // Extract PIX data
    const pixData = payment.point_of_interaction?.transaction_data;
    
    return new Response(JSON.stringify({
      id: String(payment.id), // Convert to string for consistency
      status: payment.status,
      qrCode: pixData?.qr_code || '',
      qrCodeBase64: pixData?.qr_code_base64 || '',
      pixCopyPaste: pixData?.qr_code || '',
      expirationDate: payment.date_of_expiration || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      transactionAmount: payment.transaction_amount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-payment function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
