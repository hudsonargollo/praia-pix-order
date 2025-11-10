// Test function to debug environment variables and Supabase connection

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
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;
    
    console.log('🔍 Environment Debug:', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_KEY,
      urlLength: SUPABASE_URL?.length || 0,
      keyLength: SUPABASE_SERVICE_KEY?.length || 0,
      url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing',
      keyPrefix: SUPABASE_SERVICE_KEY ? `${SUPABASE_SERVICE_KEY.substring(0, 20)}...` : 'missing'
    });

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({
        error: 'Missing environment variables',
        debug: {
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_SERVICE_KEY,
          allEnvKeys: Object.keys(context.env)
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test Supabase connection
    console.log('🔍 Testing Supabase connection...');
    
    const testResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 Supabase test response:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok
    });

    const testData = await testResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      environment: {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_SERVICE_KEY,
        urlValid: SUPABASE_URL?.includes('supabase.co'),
        keyValid: SUPABASE_SERVICE_KEY?.startsWith('eyJ')
      },
      supabaseTest: {
        status: testResponse.status,
        statusText: testResponse.statusText,
        ok: testResponse.ok,
        hasUsers: !!testData.users,
        userCount: testData.users?.length || 0,
        error: testData.error || testData.msg || null
      },
      debug: testData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔴 Test function error:', error);
    return new Response(JSON.stringify({
      error: 'Test function failed',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}