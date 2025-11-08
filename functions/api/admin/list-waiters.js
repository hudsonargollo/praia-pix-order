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

    // List users with the 'waiter' role. Supabase Admin API does not support filtering by app_metadata.
    // The most secure way is to query the `auth.users` table directly from the service role client.
    // However, the Supabase client library does not expose a direct `from('auth.users')` method.
    // The alternative is to use a custom SQL query via an RPC function or a dedicated view.

    // Since we are using the Admin API, we will fetch all users and filter them, which is inefficient
    // but the only way with the current Supabase Admin SDK.
    // A better approach is to use a dedicated Supabase Function (RPC) that queries the `auth.users` table.

    // **Alternative: Using a dedicated Supabase RPC function `get_waiter_users`**
    // We will assume the existence of a Supabase RPC function for security and efficiency.
    
    const { data: waiters, error: rpcError } = await supabaseAdmin.rpc('get_waiter_users');

    if (rpcError) {
      console.error("Supabase RPC error:", rpcError);
      // Fallback to a less secure/efficient method if RPC fails (or assume the RPC is not deployed yet)
      // For now, we will return the error and rely on the AdminWaiters.tsx mock if the RPC is not set up.
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(waiters), {
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
