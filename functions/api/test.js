// Simple test endpoint to verify Cloudflare Functions are working

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const envCheck = {
    hasSupabaseUrl: !!context.env.SUPABASE_URL,
    hasSupabaseKey: !!context.env.SUPABASE_SERVICE_KEY,
    hasWhatsAppKey: !!context.env.WHATSAPP_ENCRYPTION_KEY,
    timestamp: new Date().toISOString(),
    message: 'Cloudflare Functions are working!'
  };

  return new Response(JSON.stringify(envCheck, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
