// This Worker handles the secure deletion of waiter accounts using the Supabase Service Role Key.
// Uses direct REST API calls instead of Supabase JS client for Cloudflare Workers compatibility

export async function onRequest(context) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Support both POST and DELETE methods
  if (context.request.method !== 'POST' && context.request.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST or DELETE.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing environment variables:', { 
        hasUrl: !!SUPABASE_URL, 
        hasKey: !!SUPABASE_SERVICE_KEY 
      });
      return new Response(JSON.stringify({ 
        error: "Supabase environment variables not set. Please configure SUPABASE_URL and SUPABASE_SERVICE_KEY in Cloudflare Pages settings." 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let waiterId;

    if (context.request.method === 'POST') {
      // For POST requests, get waiterId from request body
      const requestBody = await context.request.json();
      waiterId = requestBody.waiterId;
    } else {
      // For DELETE requests, extract user ID from the URL path or query parameter
      const url = new URL(context.request.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      // Path is /api/admin/delete-waiter/[waiterId] or /api/admin/delete-waiter?id=[waiterId]
      waiterId = pathSegments[pathSegments.length - 1];
      
      // If the last segment is 'delete-waiter', check query params
      if (waiterId === 'delete-waiter') {
        waiterId = url.searchParams.get('id');
      }
    }

    console.log('🔵 Delete waiter request:', { 
      method: context.request.method,
      waiterId,
      url: context.request.url
    });

    if (!waiterId || waiterId === 'delete-waiter') {
      return new Response(JSON.stringify({ error: "Waiter ID is required in request body (POST) or URL path (DELETE)." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete user using Supabase Admin API directly
    const deleteUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${waiterId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deleteUserResponse.ok) {
      const errorData = await deleteUserResponse.json();
      console.error("Supabase delete user error:", errorData);
      return new Response(JSON.stringify({ 
        error: errorData.msg || errorData.message || "Failed to delete user" 
      }), {
        status: deleteUserResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: "Waiter account deleted successfully", 
      userId: waiterId 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Worker error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error",
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
