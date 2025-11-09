import { createClient } from '@supabase/supabase-js';

// This Worker handles the secure deletion of waiter accounts using the Supabase Service Role Key.
// The Supabase URL and Service Role Key must be set as environment variables in the Cloudflare Worker settings.

export async function onRequestDelete(context) {
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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Extract user ID from the URL path or query parameter
    const url = new URL(context.request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // Path is /api/admin/delete-waiter/[waiterId] or /api/admin/delete-waiter?id=[waiterId]
    let waiterId = pathSegments[pathSegments.length - 1];
    
    // If the last segment is 'delete-waiter', check query params
    if (waiterId === 'delete-waiter') {
      waiterId = url.searchParams.get('id');
    }

    console.log('Delete waiter request:', { pathname: url.pathname, waiterId, pathSegments });

    if (!waiterId || waiterId === 'delete-waiter') {
      return new Response(JSON.stringify({ error: "Waiter ID is required." }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    // 1. Delete the user from Supabase Auth
    const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(waiterId);

    if (userError) {
      console.error("Supabase delete user error:", userError);
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Delete associated data (e.g., from public.profiles if not handled by RLS/triggers)
    // This is often not necessary as Supabase RLS/triggers can handle cascade deletes.
    
    return new Response(JSON.stringify({ message: "Waiter account deleted successfully", userId: waiterId }), {
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
