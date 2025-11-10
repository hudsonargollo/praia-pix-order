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
    
    console.log('🔵 List waiters - Environment check:', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_KEY,
      url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}...` : 'missing'
    });
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ 
        error: "Supabase environment variables not configured properly.",
        details: {
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_SERVICE_KEY
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List all users using Supabase Admin API directly
    console.log('🔵 Fetching users from Supabase Admin API...');
    
    const listUsersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔵 Supabase response status:', listUsersResponse.status);

    const usersData = await listUsersResponse.json();

    if (!listUsersResponse.ok) {
      console.error("🔴 Supabase list users error:", {
        status: listUsersResponse.status,
        statusText: listUsersResponse.statusText,
        error: usersData
      });
      return new Response(JSON.stringify({ 
        error: usersData.msg || usersData.message || "Failed to list users from Supabase",
        details: {
          status: listUsersResponse.status,
          statusText: listUsersResponse.statusText
        }
      }), {
        status: listUsersResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter users with waiter role
    const users = usersData.users || [];
    console.log('🔵 Total users found:', users.length);
    
    const waiters = users
      .filter(user => {
        const hasWaiterRole = user.app_metadata?.role === 'waiter' || user.user_metadata?.role === 'waiter';
        if (hasWaiterRole) {
          console.log('🔵 Found waiter:', { 
            id: user.id, 
            email: user.email, 
            app_role: user.app_metadata?.role,
            user_role: user.user_metadata?.role 
          });
        }
        return hasWaiterRole;
      })
      .map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0] || 'N/A',
        created_at: user.created_at,
      }));

    console.log('🔵 Filtered waiters:', waiters.length);

    return new Response(JSON.stringify({ 
      waiters,
      debug: {
        totalUsers: users.length,
        totalWaiters: waiters.length
      }
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
