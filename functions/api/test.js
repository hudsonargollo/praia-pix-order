// Simple test endpoint to verify Cloudflare Functions are working
export async function onRequestGet(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const testResponse = {
    message: 'Cloudflare Functions are working!',
    timestamp: new Date().toISOString(),
    environment: {
      hasMercadoPagoToken: !!env.MERCADOPAGO_ACCESS_TOKEN,
      tokenStart: env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20) + '...'
    }
  };

  return new Response(JSON.stringify(testResponse, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}