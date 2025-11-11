// Supabase Edge Function to delete waiter accounts
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
    console.log('Authenticated user deleting waiter:', user.id)

    // Get waiter ID from request body
    const { waiterId } = await req.json()

    if (!waiterId) {
      console.error('Missing waiterId in request body')
      return new Response(
        JSON.stringify({ error: 'Waiter ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate waiterId format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(waiterId)) {
      console.error('Invalid waiterId format:', waiterId)
      return new Response(
        JSON.stringify({ error: 'Invalid waiter ID format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create admin client with service role
    // These env vars are automatically available in Supabase Edge Functions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user exists before attempting deletion
    const { data: userToDelete, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(waiterId)

    if (getUserError || !userToDelete) {
      console.error('User not found:', waiterId, getUserError)
      return new Response(
        JSON.stringify({ error: 'Waiter not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the user is actually a waiter (optional safety check)
    const targetUserRole = userToDelete.user_metadata?.role || userToDelete.app_metadata?.role
    if (targetUserRole !== 'waiter') {
      console.error('Attempted to delete non-waiter user:', waiterId, 'Role:', targetUserRole)
      return new Response(
        JSON.stringify({ error: 'User is not a waiter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Deleting waiter:', waiterId, 'Email:', userToDelete.email)

    // Delete the waiter user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(waiterId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Successfully deleted waiter:', waiterId)

    return new Response(
      JSON.stringify({
        message: 'Waiter deleted successfully',
        userId: waiterId,
      }),
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
