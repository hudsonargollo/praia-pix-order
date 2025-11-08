/**
 * Cloudflare Function: WhatsApp Message Proxy
 * Proxies requests to Evolution API to bypass CORS restrictions
 */

interface Env {
  EVOLUTION_API_URL?: string;
  EVOLUTION_API_KEY?: string;
  EVOLUTION_INSTANCE_NAME?: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get Evolution API config (with fallbacks)
    const apiUrl = env.EVOLUTION_API_URL || 'http://wppapi.clubemkt.digital';
    const apiKey = env.EVOLUTION_API_KEY || 'DD451E404240-4C45-AF35-BFCA6A976927';
    const instanceName = env.EVOLUTION_INSTANCE_NAME || 'cocooo';

    // Parse request body
    const body = await request.json();

    console.log('Proxying WhatsApp message:', {
      number: body.number,
      textLength: body.text?.length,
    });

    // Forward to Evolution API
    const response = await fetch(
      `${apiUrl}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: body.number,
          text: body.text,
          delay: body.delay || 0,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Evolution API error:', data);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.log('Message sent successfully:', data.key?.id);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
