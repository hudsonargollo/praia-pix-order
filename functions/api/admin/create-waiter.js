import { createClient } from '@supabase/supabase-js';

// This Worker handles the secure creation of waiter accounts using the Supabase Service Role Key.
// The Supabase URL and Service Role Key must be set as environment variables in the Cloudflare Worker settings.

export async function onRequestPost(context) {
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

    const { email, password, full_name, role } = await context.request.json();

    if (!email || !password || !full_name || role !== 'waiter') {
      return new Response(JSON.stringify({ error: "Missing required fields or invalid role." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Create the user in Supabase Auth
    const { data: userResponse, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for staff accounts
      user_metadata: {
        full_name,
        role: 'waiter',
      },
      app_metadata: {
        role: 'waiter',
      },
    });

    if (userError) {
      console.error("Supabase create user error:", userError);
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Insert profile data (optional, but good practice if a public 'profiles' table exists)
    // Assuming the project uses a public 'profiles' table that mirrors auth.users metadata
    // This step is often handled by a trigger in Supabase, but doing it explicitly for completeness.
    
    // const { error: profileError } = await supabaseAdmin
    //   .from('profiles')
    //   .insert({
    //     id: userResponse.user.id,
    //     full_name: full_name,
    //     role: 'waiter',
    //   });

    // if (profileError) {
    //   console.error("Supabase profile insert error:", profileError);
    //   // Decide whether to roll back user creation or just log the error
    // }

    return new Response(JSON.stringify({ message: "Waiter account created successfully", userId: userResponse.user.id }), {
      status: 201,
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
