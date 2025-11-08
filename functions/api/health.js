/**
 * Health check endpoint for monitoring
 * Returns status of all services
 */

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        functions: {
          status: 'operational',
          message: 'Cloudflare Functions are running'
        }
      },
      environment: {
        hasSupabaseUrl: !!context.env.SUPABASE_URL,
        hasSupabaseKey: !!context.env.SUPABASE_SERVICE_ROLE_KEY,
        hasWhatsAppKey: !!context.env.WHATSAPP_ENCRYPTION_KEY,
        hasWhatsAppSession: !!context.env.WHATSAPP_SESSION_ID
      }
    };

    // Check WhatsApp service
    try {
      const whatsappResponse = await fetch(
        `${new URL(context.request.url).origin}/api/whatsapp/connection?action=status`,
        { headers: { 'User-Agent': 'health-check' } }
      );
      
      if (whatsappResponse.ok) {
        const whatsappStatus = await whatsappResponse.json();
        health.services.whatsapp = {
          status: whatsappStatus.isConnected ? 'connected' : 'disconnected',
          connectionState: whatsappStatus.connectionState,
          lastConnected: whatsappStatus.lastConnected
        };
      } else {
        health.services.whatsapp = {
          status: 'error',
          message: 'Failed to check WhatsApp status'
        };
      }
    } catch (error) {
      health.services.whatsapp = {
        status: 'error',
        message: error.message
      };
    }

    // Determine overall health
    const hasErrors = Object.values(health.services).some(
      service => service.status === 'error'
    );
    
    if (hasErrors) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }), {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
