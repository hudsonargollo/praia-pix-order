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
    // Get Evolution API config from environment variables
    const apiUrl = context.env.VITE_EVOLUTION_API_URL || context.env.EVOLUTION_API_URL || 'http://wppapi.clubemkt.digital';
    const apiKey = context.env.VITE_EVOLUTION_API_KEY || context.env.EVOLUTION_API_KEY || 'DD451E404240-4C45-AF35-BFCA6A976927';
    const instanceName = context.env.VITE_EVOLUTION_INSTANCE_NAME || context.env.EVOLUTION_INSTANCE_NAME || 'cocooo';
    const testNumber = context.env.TEST_PHONE_NUMBER || '5573189719731'; // Admin phone number

    console.log('🔵 WhatsApp Test Config:', {
      apiUrl: apiUrl ? `${apiUrl.substring(0, 20)}...` : 'missing',
      hasApiKey: !!apiKey,
      instanceName,
      testNumber
    });

    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch (e) {
      requestBody = {};
    }
    
    const { message } = requestBody;

    console.log(`🔵 Sending test message to ${testNumber}`);

    // Skip connection check for now and try to send directly
    console.log('🔵 Attempting to send message directly...');

    // Send test message
    const messageText = message || `🥥 Teste de conexão WhatsApp - Coco Loko Açaiteria ✅

Se você recebeu esta mensagem, o WhatsApp está funcionando corretamente!

📱 Mensagem enviada em: ${new Date().toLocaleString('pt-BR')}
🏪 Sistema: Coco Loko Açaiteria
✅ Status: Operacional`;

    const messagePayload = {
      number: testNumber,
      text: messageText
    };

    console.log('🔵 Message payload:', messagePayload);
    console.log('🔵 API URL:', `${apiUrl}/message/sendText/${instanceName}`);

    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    console.log('🔵 WhatsApp API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Message sent successfully:', data);
      return new Response(JSON.stringify({
        success: true,
        messageId: data.key?.id || data.messageId,
        message: 'Mensagem de teste enviada com sucesso!',
        details: data
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      const errorData = await response.text();
      console.error('❌ Failed to send test message:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to send message (${response.status})`,
        details: errorData,
        debug: {
          apiUrl,
          instanceName,
          testNumber,
          hasApiKey: !!apiKey
        }
      }), {
        status: response.status,
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