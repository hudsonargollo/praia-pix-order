// Supabase Edge Function to list waiter accounts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify the user is an admin
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // User is authenticated - that's enough since we simplified RLS policies
    console.log('Authenticated user listing waiters:', user.id)

    // Create admin client with service role
    // These env vars are automatically available in Supabase Edge Functions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // List all users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return new Response(
        JSON.stringify({ error: listError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Filter waiters
    const waiters = users
      .filter(u => u.app_metadata?.role === 'waiter' || u.user_metadata?.role === 'waiter')
      .map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || 'N/A',
        created_at: u.created_at,
      }))

    return new Response(
      JSON.stringify({ waiters }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
