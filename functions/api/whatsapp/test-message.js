/**
 * WhatsApp Test Message Handler
 * Sends a test message to verify connection
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

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get Evolution API config
    const apiUrl = context.env.EVOLUTION_API_URL || 'http://wppapi.clubemkt.digital';
    const apiKey = context.env.EVOLUTION_API_KEY || 'DD451E404240-4C45-AF35-BFCA6A976927';
    const instanceName = context.env.EVOLUTION_INSTANCE_NAME || 'cocooo';
    const testNumber = context.env.TEST_PHONE_NUMBER || '5573189719731'; // Admin phone number

    const { message } = await context.request.json();

    console.log(`Sending test message to ${testNumber}`);

    // First check if instance is connected
    const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!statusResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'WhatsApp instance not connected or not found'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const statusData = await statusResponse.json();
    if (statusData.instance?.state !== 'open') {
      return new Response(JSON.stringify({
        success: false,
        error: 'WhatsApp instance is not connected. Please connect first.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send test message
    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: testNumber,
        text: message || '🥥 Teste de conexão WhatsApp - Coco Loko Açaiteria ✅\n\nSe você recebeu esta mensagem, o WhatsApp está funcionando corretamente!\n\n📱 Mensagem enviada em: ' + new Date().toLocaleString('pt-BR')
      })
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(JSON.stringify({
        success: true,
        messageId: data.key?.id,
        message: 'Mensagem de teste enviada com sucesso'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      const errorData = await response.text();
      console.error('Failed to send test message:', errorData);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send test message',
        details: errorData
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Test message error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}