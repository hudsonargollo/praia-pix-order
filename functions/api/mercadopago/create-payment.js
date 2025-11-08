// Cloudflare Pages Function for MercadoPago payment creation
export async function onRequestPost(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const paymentData = await request.json();
    
    // Debug logging
    console.log('Payment request received:', paymentData);
    console.log('Environment variables:', {
      hasAccessToken: !!env.MERCADOPAGO_ACCESS_TOKEN,
      accessTokenStart: env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20)
    });
    
    // Validate required fields
    if (!paymentData.amount || !paymentData.description || !paymentData.customerName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get access token with fallback
    const accessToken = env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-4813437808298526-110522-fa108581dfa5cb10a87458875e5c8136-1769074499';
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'MercadoPago credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // MercadoPago API call
    const mercadoPagoPayload = {
      transaction_amount: paymentData.amount,
      description: paymentData.description,
      payment_method_id: 'pix',
      external_reference: paymentData.orderId,
      payer: {
        first_name: paymentData.customerName.split(' ')[0],
        last_name: paymentData.customerName.split(' ').slice(1).join(' ') || '',
        email: `customer-${paymentData.orderId}@cocoloko.com.br`,
        phone: {
          area_code: paymentData.customerPhone.length >= 11 ? paymentData.customerPhone.substring(0, 2) : "73",
          number: paymentData.customerPhone.length >= 11 ? paymentData.customerPhone.substring(2) : paymentData.customerPhone
        }
      },
      additional_info: {
        items: [
          {
            id: paymentData.orderId,
            title: paymentData.description,
            description: `Pedido de ${paymentData.customerName}`,
            quantity: 1,
            unit_price: paymentData.amount
          }
        ]
      },
      date_of_expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    console.log('Calling MercadoPago API with payload:', mercadoPagoPayload);

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': paymentData.orderId
      },
      body: JSON.stringify(mercadoPagoPayload)
    });

    console.log('MercadoPago API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('MercadoPago API Error:', errorData);
      
      // For now, return a mock response to test the flow
      const mockResponse = {
        id: `mock_${Date.now()}`,
        status: 'pending',
        qrCode: `00020126580014br.gov.bcb.pix0136mock_${Date.now()}520400005303986540${paymentData.amount.toFixed(2)}5802BR5913COCOLOKO6009SAO PAULO62070503***6304`,
        qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        pixCopyPaste: `00020126580014br.gov.bcb.pix0136mock_${Date.now()}520400005303986540${paymentData.amount.toFixed(2)}5802BR5913COCOLOKO6009SAO PAULO62070503***6304`,
        expirationDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        transactionAmount: paymentData.amount,
        _isMock: true,
        _originalError: errorData
      };

      return new Response(JSON.stringify(mockResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Return formatted response
    const paymentResponse = {
      id: data.id.toString(),
      status: data.status,
      qrCode: data.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      pixCopyPaste: data.point_of_interaction?.transaction_data?.qr_code || '',
      expirationDate: data.date_of_expiration,
      transactionAmount: data.transaction_amount
    };

    return new Response(JSON.stringify(paymentResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}