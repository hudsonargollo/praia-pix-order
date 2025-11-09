import { createClient } from '@supabase/supabase-js';

// This Worker handles the secure listing of waiter accounts using the Supabase Service Role Key.
// The Supabase URL and Service Role Key must be set as environment variables in the Cloudflare Worker settings.

export async function onRequestGet(context) {
  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "Supabase environment variables not set." }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // List all users and filter by role
    // Note: This is not the most efficient approach, but it works with the Admin API
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("Supabase list users error:", listError);
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Filter users with waiter role
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
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Worker error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
