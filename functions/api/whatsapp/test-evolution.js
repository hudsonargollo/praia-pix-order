// Test Evolution API endpoints to find the correct ones
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
    const apiUrl = context.env.EVOLUTION_API_URL || 'http://wppapi.clubemkt.digital';
    const apiKey = context.env.EVOLUTION_API_KEY || 'DD451E404240-4C45-AF35-BFCA6A976927';
    const instanceName = context.env.EVOLUTION_INSTANCE_NAME || 'cocooo';

    const results = [];

    // Test 1: Basic API health
    try {
      const healthResponse = await fetch(`${apiUrl}/`, {
        method: 'GET',
        headers: { 'apikey': apiKey }
      });
      results.push({
        test: 'API Health Check',
        url: `${apiUrl}/`,
        status: healthResponse.status,
        ok: healthResponse.ok,
        response: healthResponse.ok ? await healthResponse.text() : 'Failed'
      });
    } catch (error) {
      results.push({
        test: 'API Health Check',
        url: `${apiUrl}/`,
        error: error.message
      });
    }

    // Test 2: List instances
    try {
      const instancesResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 'apikey': apiKey }
      });
      const instancesData = instancesResponse.ok ? await instancesResponse.json() : null;
      results.push({
        test: 'List Instances',
        url: `${apiUrl}/instance/fetchInstances`,
        status: instancesResponse.status,
        ok: instancesResponse.ok,
        response: instancesData
      });
    } catch (error) {
      results.push({
        test: 'List Instances',
        url: `${apiUrl}/instance/fetchInstances`,
        error: error.message
      });
    }

    // Test 3: Instance status
    try {
      const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': apiKey }
      });
      const statusData = statusResponse.ok ? await statusResponse.json() : null;
      results.push({
        test: 'Instance Status',
        url: `${apiUrl}/instance/connectionState/${instanceName}`,
        status: statusResponse.status,
        ok: statusResponse.ok,
        response: statusData
      });
    } catch (error) {
      results.push({
        test: 'Instance Status',
        url: `${apiUrl}/instance/connectionState/${instanceName}`,
        error: error.message
      });
    }

    // Test 4: QR Code
    try {
      const qrResponse = await fetch(`${apiUrl}/instance/${instanceName}/qrcode`, {
        method: 'GET',
        headers: { 'apikey': apiKey }
      });
      const qrData = qrResponse.ok ? await qrResponse.json() : null;
      results.push({
        test: 'QR Code',
        url: `${apiUrl}/instance/${instanceName}/qrcode`,
        status: qrResponse.status,
        ok: qrResponse.ok,
        response: qrData ? { hasQrCode: !!qrData.qrcode, keys: Object.keys(qrData) } : null
      });
    } catch (error) {
      results.push({
        test: 'QR Code',
        url: `${apiUrl}/instance/${instanceName}/qrcode`,
        error: error.message
      });
    }

    return new Response(JSON.stringify({
      config: {
        apiUrl,
        instanceName,
        hasApiKey: !!apiKey
      },
      results
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}