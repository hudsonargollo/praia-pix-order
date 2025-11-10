// Simplified WhatsApp connection handler for Cloudflare Workers
// Note: Full WhatsApp integration requires a dedicated Node.js server

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(context.request.url);
    const action = url.searchParams.get('action') || 'status';

    // For now, return a mock response indicating WhatsApp needs external setup
    switch (action) {
      case 'status':
        return new Response(JSON.stringify({
          isConnected: false,
          connectionState: 'disconnected',
          qrCode: null,
          phoneNumber: null,
          message: 'WhatsApp integration requires external Evolution API setup'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'connect':
        return new Response(JSON.stringify({
          isConnected: false,
          connectionState: 'connecting',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          message: 'Mock QR code - WhatsApp integration requires external setup'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'disconnect':
        return new Response(JSON.stringify({
          success: true,
          message: 'WhatsApp disconnected'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action',
          availableActions: ['status', 'connect', 'disconnect']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('WhatsApp connection error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      isConnected: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}