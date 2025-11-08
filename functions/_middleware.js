/**
 * Cloudflare Functions Middleware
 * Handles common concerns like error handling, logging, and CORS
 */

// Error logging helper
async function logError(context, error, endpoint) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    endpoint,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: {
      method: context.request.method,
      url: context.request.url,
      headers: Object.fromEntries(context.request.headers)
    }
  };

  console.error('Function Error:', JSON.stringify(errorLog, null, 2));

  // Optionally log to Supabase if configured
  if (context.env.SUPABASE_URL && context.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        context.env.SUPABASE_URL,
        context.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase.from('whatsapp_error_logs').insert({
        error_type: 'function_error',
        error_message: error.message,
        error_details: errorLog,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Main middleware
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Add request ID for tracking
  const requestId = crypto.randomUUID();
  
  // Log request
  console.log(`[${requestId}] ${request.method} ${url.pathname}`);

  try {
    // Add CORS headers to context for use in handlers
    context.corsHeaders = corsHeaders;
    context.requestId = requestId;

    // Continue to the actual function
    const response = await next();

    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    // Add request ID to response
    newHeaders.set('X-Request-ID', requestId);

    // Log response
    console.log(`[${requestId}] Response: ${response.status}`);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  } catch (error) {
    // Log error
    await logError(context, error, url.pathname);

    // Return error response
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      requestId,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });
  }
}
