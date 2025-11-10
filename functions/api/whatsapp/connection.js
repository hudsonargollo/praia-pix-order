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
        // Try to get connection status - use simpler approach
        try {
          const statusResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (statusResponse.ok) {
            const instances = await statusResponse.json();
            const instance = instances.find(i => i.instanceName === instanceName);
            
            return new Response(JSON.stringify({
              isConnected: instance?.connectionStatus === 'open',
              connectionState: instance?.connectionStatus || 'disconnected',
              phoneNumber: instance?.profilePictureUrl ? 'Connected' : null,
              lastConnected: instance?.connectionStatus === 'open' ? new Date().toISOString() : null,
              qrCode: null
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (error) {
          console.log('Status check failed, returning default');
        }

        // Fallback response
        return new Response(JSON.stringify({
          isConnected: false,
          connectionState: 'disconnected',
          phoneNumber: null,
          lastConnected: null,
          qrCode: null,
          message: 'Evolution API status check failed'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'connect':
        // Try to get QR code for connection
        try {
          // First try to create/restart the instance
          const createResponse = await fetch(`${apiUrl}/instance/create`, {
            method: 'POST',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              instanceName: instanceName,
              token: apiKey,
              qrcode: true,
              integration: 'WHATSAPP-BAILEYS'
            })
          });

          if (createResponse.ok) {
            const createData = await createResponse.json();
            
            if (createData.qrcode && createData.qrcode.code) {
              return new Response(JSON.stringify({
                isConnected: false,
                connectionState: 'qr_required',
                qrCode: createData.qrcode.code,
                message: 'Scan QR code to connect WhatsApp'
              }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }

          // Fallback: try to get existing QR code
          const qrResponse = await fetch(`${apiUrl}/instance/${instanceName}/qrcode`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.qrcode) {
              return new Response(JSON.stringify({
                isConnected: false,
                connectionState: 'qr_required',
                qrCode: qrData.qrcode,
                message: 'Scan QR code to connect WhatsApp'
              }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }
        } catch (error) {
          console.log('Connect failed:', error.message);
        }

        // Return connecting state if QR code generation fails
        return new Response(JSON.stringify({
          isConnected: false,
          connectionState: 'connecting',
          message: 'Iniciando conexão WhatsApp... Tente novamente em alguns segundos.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'disconnect':
        // Try to disconnect the instance
        try {
          const disconnectResponse = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          return new Response(JSON.stringify({
            success: true,
            message: 'WhatsApp desconectado com sucesso'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Erro ao desconectar WhatsApp'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      default:
        return new Response(JSON.stringify({
          error: 'Ação inválida',
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