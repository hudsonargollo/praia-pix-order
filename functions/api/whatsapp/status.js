// Simple WhatsApp status endpoint for Cloudflare Pages
// This provides a basic status check without the full Baileys implementation

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Supabase configuration missing',
        connected: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if WhatsApp session exists in database
    const response = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_sessions?is_active=eq.true&select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const sessions = await response.json();
    const hasActiveSession = sessions && sessions.length > 0;

    return new Response(JSON.stringify({
      connected: hasActiveSession,
      connectionState: hasActiveSession ? 'connected' : 'disconnected',
      phoneNumber: hasActiveSession ? sessions[0].phone_number : null,
      lastConnected: hasActiveSession ? sessions[0].updated_at : null,
      message: hasActiveSession 
        ? 'WhatsApp connected' 
        : 'WhatsApp not connected. Note: Full WhatsApp integration requires a dedicated server.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Status check error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      connected: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
