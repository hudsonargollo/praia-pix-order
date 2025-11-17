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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '')
    console.log('Token extracted, length:', token.length)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Only admins can delete waiters')
    }

    // Get waiter ID from request body
    const { waiterId } = await req.json()

    if (!waiterId) {
      throw new Error('Waiter ID is required')
    }

    console.log('Deleting waiter:', waiterId)

    // Delete the waiter user from auth.users using admin API
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(waiterId)

    if (deleteError) {
      console.error('Error deleting waiter:', deleteError)
      throw new Error(`Failed to delete waiter: ${deleteError.message}`)
    }

    console.log('Waiter deleted successfully:', waiterId)

    return new Response(
      JSON.stringify({ success: true, message: 'Waiter deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in delete-waiter function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
