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
        // Try to get connection status
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
            const instance = instances.find(i => i.name === instanceName);
            
            if (instance) {
              return new Response(JSON.stringify({
                isConnected: instance.connectionStatus === 'open',
                connectionState: instance.connectionStatus || 'disconnected',
                phoneNumber: instance.number || null,
                profileName: instance.profileName || null,
                lastConnected: instance.connectionStatus === 'open' ? instance.updatedAt : null,
                qrCode: null,
                instanceData: instance
              }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }
        } catch (error) {
          console.log('Status check failed:', error.message);
        }

        // Fallback response
        return new Response(JSON.stringify({
          isConnected: false,
          connectionState: 'disconnected',
          phoneNumber: null,
          profileName: null,
          lastConnected: null,
          qrCode: null,
          message: 'Instance not found or API unavailable'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'connect':
        // Try to get QR code for connection
        try {
          // First check if instance already exists and is connected
          const statusResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (statusResponse.ok) {
            const instances = await statusResponse.json();
            const instance = instances.find(i => i.name === instanceName);
            
            if (instance && instance.connectionStatus === 'open') {
              return new Response(JSON.stringify({
                isConnected: true,
                connectionState: 'connected',
                phoneNumber: instance.number,
                profileName: instance.profileName,
                lastConnected: instance.updatedAt,
                message: 'WhatsApp already connected'
              }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }

          // If instance exists but is disconnected, try to get QR code directly first
          if (instance && instance.connectionStatus !== 'open') {
            const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
              method: 'GET',
              headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
              }
            });

            if (qrResponse.ok) {
              const qrData = await qrResponse.json();
              if (qrData.base64) {
                return new Response(JSON.stringify({
                  isConnected: false,
                  connectionState: 'qr_required',
                  qrCode: `data:image/png;base64,${qrData.base64}`,
                  message: 'Scan QR code to connect WhatsApp'
                }), {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            }
          }

          // Try to restart the instance to get QR code
          const restartResponse = await fetch(`${apiUrl}/instance/restart/${instanceName}`, {
            method: 'PUT',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (restartResponse.ok) {
            // Wait a moment for restart to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Try to get QR code after restart
            const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
              method: 'GET',
              headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
              }
            });

            if (qrResponse.ok) {
              const qrData = await qrResponse.json();
              if (qrData.base64) {
                return new Response(JSON.stringify({
                  isConnected: false,
                  connectionState: 'qr_required',
                  qrCode: `data:image/png;base64,${qrData.base64}`,
                  message: 'Scan QR code to connect WhatsApp'
                }), {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            }
          }

          // Fallback: try direct QR code endpoint
          const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.base64) {
              return new Response(JSON.stringify({
                isConnected: false,
                connectionState: 'qr_required',
                qrCode: `data:image/png;base64,${qrData.base64}`,
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
          message: 'Iniciando conexão WhatsApp... Aguarde alguns segundos e tente novamente.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'restart':
        // Restart the instance to force reconnection
        try {
          const restartResponse = await fetch(`${apiUrl}/instance/restart/${instanceName}`, {
            method: 'PUT',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (restartResponse.ok) {
            // Wait for restart to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Try to get QR code after restart
            const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
              method: 'GET',
              headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
              }
            });

            if (qrResponse.ok) {
              const qrData = await qrResponse.json();
              if (qrData.base64) {
                return new Response(JSON.stringify({
                  success: true,
                  qrCode: `data:image/png;base64,${qrData.base64}`,
                  message: 'Instance restarted, scan QR code to reconnect'
                }), {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            }
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Instance restarted successfully'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to restart instance'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'disconnect':
        // Try to logout the instance (safer than delete)
        try {
          const logoutResponse = await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (logoutResponse.ok) {
            return new Response(JSON.stringify({
              success: true,
              message: 'WhatsApp desconectado com sucesso'
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            // Even if logout fails, consider it successful for UI purposes
            return new Response(JSON.stringify({
              success: true,
              message: 'WhatsApp desconectado'
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Erro ao desconectar WhatsApp',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      default:
        return new Response(JSON.stringify({
          error: 'Ação inválida',
          availableActions: ['status', 'connect', 'restart', 'disconnect']
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