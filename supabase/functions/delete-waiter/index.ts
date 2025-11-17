import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[delete-waiter] Function invoked')
    
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('[delete-waiter] Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('[delete-waiter] Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    console.log('[delete-waiter] Verifying user authentication')
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError) {
      console.error('[delete-waiter] Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user) {
      console.warn('[delete-waiter] No user found in session')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[delete-waiter] User authenticated:', user.id)
    console.log('[delete-waiter] Authenticated user deleting waiter')

    // Get waiter ID from request body
    const { waiterId } = await req.json()

    console.log('[delete-waiter] Request to delete waiter:', { waiterId })

    if (!waiterId) {
      console.warn('[delete-waiter] Missing waiterId')
      return new Response(
        JSON.stringify({ error: 'Waiter ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[delete-waiter] Deleting waiter:', waiterId)

    // Create Supabase admin client for deletion
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('[delete-waiter] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[delete-waiter] Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Delete the waiter user from auth.users using admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(waiterId)

    if (deleteError) {
      console.error('[delete-waiter] Error deleting waiter:', {
        error: deleteError,
        message: deleteError.message,
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete waiter',
          details: deleteError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[delete-waiter] Waiter deleted successfully:', waiterId)

    return new Response(
      JSON.stringify({ success: true, message: 'Waiter deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('[delete-waiter] Unexpected function error:', {
      error,
      message: error.message,
      stack: error.stack,
    })
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
