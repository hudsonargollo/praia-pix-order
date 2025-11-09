// This Worker handles the secure listing of waiter accounts using the Supabase Service Role Key.
// Uses direct REST API calls instead of Supabase JS client for Cloudflare Workers compatibility

export async function onRequestGet(context) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "Supabase environment variables not set." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List all users using Supabase Admin API directly
    const listUsersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const usersData = await listUsersResponse.json();

    if (!listUsersResponse.ok) {
      console.error("Supabase list users error:", usersData);
      return new Response(JSON.stringify({ 
        error: usersData.msg || usersData.message || "Failed to list users" 
      }), {
        status: listUsersResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter users with waiter role
    const users = usersData.users || [];
    const waiters = users
      .filter(user => user.app_metadata?.role === 'waiter' || user.user_metadata?.role === 'waiter')
      .map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'N/A',
        created_at: user.created_at,
      }));

    return new Response(JSON.stringify({ waiters }), {
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
