// This Worker handles the secure listing of waiter accounts using the Supabase Service Role Key.
// Uses direct REST API calls instead of Supabase JS client for Cloudflare Workers compatibility

export async function onRequest(context) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Support both GET and POST methods
  if (context.request.method !== 'GET' && context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;
    
    console.log('🔵 List waiters - Environment check:', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_KEY,
      url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing',
      keyPrefix: SUPABASE_SERVICE_KEY ? `${SUPABASE_SERVICE_KEY.substring(0, 20)}...` : 'missing'
    });
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('🔴 Missing environment variables');
      return new Response(JSON.stringify({ 
        error: "Database connection not configured. Please check environment variables.",
        details: {
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_SERVICE_KEY,
          message: "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in Cloudflare Pages environment"
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List all users using Supabase Admin API directly
    console.log('🔵 Fetching users from Supabase Admin API...');
    console.log('🔵 Request URL:', `${SUPABASE_URL}/auth/v1/admin/users`);
    
    const listUsersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔵 Supabase response:', {
      status: listUsersResponse.status,
      statusText: listUsersResponse.statusText,
      ok: listUsersResponse.ok,
      headers: Object.fromEntries(listUsersResponse.headers.entries())
    });

    let usersData;
    try {
      usersData = await listUsersResponse.json();
    } catch (parseError) {
      console.error('🔴 Failed to parse response as JSON:', parseError);
      const textResponse = await listUsersResponse.text();
      console.error('🔴 Raw response:', textResponse);
      return new Response(JSON.stringify({ 
        error: "Invalid response from Supabase API",
        details: {
          status: listUsersResponse.status,
          statusText: listUsersResponse.statusText,
          rawResponse: textResponse.substring(0, 500)
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!listUsersResponse.ok) {
      console.error("🔴 Supabase API error:", {
        status: listUsersResponse.status,
        statusText: listUsersResponse.statusText,
        error: usersData
      });
      
      let errorMessage = "Database error finding users";
      if (listUsersResponse.status === 401) {
        errorMessage = "Authentication failed - invalid service key";
      } else if (listUsersResponse.status === 403) {
        errorMessage = "Access denied - insufficient permissions";
      } else if (listUsersResponse.status === 404) {
        errorMessage = "Supabase endpoint not found";
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: {
          status: listUsersResponse.status,
          statusText: listUsersResponse.statusText,
          supabaseError: usersData.msg || usersData.message || usersData.error
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
