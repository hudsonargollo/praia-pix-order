/**
 * WhatsApp QR Code Generator
 * Dedicated endpoint for generating QR codes for WhatsApp connection
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
    // Get Evolution API config
    const apiUrl = context.env.EVOLUTION_API_URL || 'http://wppapi.clubemkt.digital';
    const apiKey = context.env.EVOLUTION_API_KEY || 'DD451E404240-4C45-AF35-BFCA6A976927';
    const instanceName = context.env.EVOLUTION_INSTANCE_NAME || 'cocooo';

    console.log(`Generating QR code for instance: ${instanceName}`);

    // Try multiple approaches to get QR code
    const qrEndpoints = [
      `${apiUrl}/instance/connect/${instanceName}`,
      `${apiUrl}/instance/${instanceName}/qrcode`,
      `${apiUrl}/qrcode/${instanceName}`
    ];

    for (const endpoint of qrEndpoints) {
      try {
        console.log(`Trying QR endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('QR response:', JSON.stringify(data, null, 2));

          // Handle different response formats
          let qrCode = null;
          
          if (data.base64) {
            qrCode = `data:image/png;base64,${data.base64}`;
          } else if (data.qrcode && data.qrcode.base64) {
            qrCode = `data:image/png;base64,${data.qrcode.base64}`;
          } else if (data.qrcode && typeof data.qrcode === 'string') {
            qrCode = data.qrcode;
          } else if (typeof data === 'string' && data.startsWith('data:image')) {
            qrCode = data;
          }

          if (qrCode) {
            return new Response(JSON.stringify({
              success: true,
              qrCode: qrCode,
              source: endpoint,
              message: 'QR code generated successfully'
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } else {
          console.log(`QR endpoint ${endpoint} failed with status:`, response.status);
        }
      } catch (error) {
        console.log(`QR endpoint ${endpoint} error:`, error.message);
        continue;
      }
    }

    // If all endpoints fail, try to restart instance first
    try {
      console.log('Attempting to restart instance before QR generation');
      
      const restartResponse = await fetch(`${apiUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (restartResponse.ok) {
        // Wait for restart
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try QR generation again after restart
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
              message: 'QR code generated after restart'
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      }
    } catch (restartError) {
      console.log('Restart failed:', restartError.message);
    }

    // Return failure response
    return new Response(JSON.stringify({
      success: false,
      message: 'Unable to generate QR code. Instance may need manual intervention.',
      suggestion: 'Try restarting the WhatsApp instance or check Evolution API status'
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('QR code generation error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}