// Cloudflare Pages Function for MercadoPago payment status check
export async function onRequestGet(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get payment ID from URL
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('paymentId');
    
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'Payment ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle mock payments (for testing)
    if (paymentId.startsWith('mock_')) {
      const mockPaymentStatus = {
        id: paymentId,
        status: 'approved', // Auto-approve mock payments for testing
        statusDetail: 'accredited',
        transactionAmount: 0.50,
        dateCreated: new Date().toISOString(),
        dateApproved: new Date().toISOString()
      };

      return new Response(JSON.stringify(mockPaymentStatus), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get access token - try both variable names for compatibility
    const accessToken = env.VITE_MERCADOPAGO_ACCESS_TOKEN || env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('MercadoPago access token not configured');
      return new Response(JSON.stringify({ 
        error: 'Payment service not configured',
        details: 'Access token missing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // MercadoPago API call
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('MercadoPago API Error:', errorData);
      
      return new Response(JSON.stringify({ 
        error: 'Payment check failed',
        details: errorData.message || response.statusText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Return formatted response
    const paymentStatus = {
      id: String(data.id), // Ensure ID is always a string
      status: data.status,
      statusDetail: data.status_detail,
      transactionAmount: data.transaction_amount,
      dateCreated: data.date_created,
      dateApproved: data.date_approved
    };

    return new Response(JSON.stringify(paymentStatus), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment check error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}