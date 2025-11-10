/**
 * WhatsApp Connection Handler using Evolution API
 * Handles connection status, QR code generation, and connection management
 */

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
    // Get Evolution API config (same as send-message function)
    const apiUrl = context.env.EVOLUTION_API_URL || 'http://wppapi.clubemkt.digital';
    const apiKey = context.env.EVOLUTION_API_KEY || 'DD451E404240-4C45-AF35-BFCA6A976927';
    const instanceName = context.env.EVOLUTION_INSTANCE_NAME || 'cocooo';

    const url = new URL(context.request.url);
    const action = url.searchParams.get('action') || 'status';

    console.log(`WhatsApp ${action} request for instance: ${instanceName}`);

    switch (action) {
      case 'status':
        // Check connection status
        const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to get connection status: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        const isConnected = statusData.state === 'open';

        return new Response(JSON.stringify({
          isConnected,
          connectionState: statusData.state || 'disconnected',
          phoneNumber: statusData.instance?.owner || null,
          lastConnected: isConnected ? new Date().toISOString() : null,
          qrCode: null
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'connect':
        // Try to connect and get QR code if needed
        const connectResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!connectResponse.ok) {
          throw new Error(`Failed to connect: ${connectResponse.status}`);
        }

        const connectData = await connectResponse.json();

        // If already connected
        if (connectData.state === 'open') {
          return new Response(JSON.stringify({
            isConnected: true,
            connectionState: 'connected',
            phoneNumber: connectData.instance?.owner || null,
            lastConnected: new Date().toISOString()
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // If needs QR code, try to get it
        try {
          const qrResponse = await fetch(`${apiUrl}/instance/qrcode/${instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            return new Response(JSON.stringify({
              isConnected: false,
              connectionState: 'qr_required',
              qrCode: qrData.qrcode || qrData.base64,
              message: 'Scan QR code to connect WhatsApp'
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (qrError) {
          console.log('QR code not available yet');
        }

        return new Response(JSON.stringify({
          isConnected: false,
          connectionState: 'connecting',
          message: 'Connecting to WhatsApp...'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'disconnect':
        // Disconnect the instance
        const disconnectResponse = await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'WhatsApp disconnected successfully'
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
      isConnected: false,
      connectionState: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}