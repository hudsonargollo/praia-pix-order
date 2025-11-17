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
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('No authorization header found')
      throw new Error('Missing authorization header')
    }

    // Extract and verify JWT token
    const jwt = authHeader.replace('Bearer ', '').replace('bearer ', '')
    console.log('JWT length:', jwt.length)
    
    // Verify the user is authenticated using the admin client
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
    console.log('User verification:', user ? `User ${user.id}` : 'No user')

    if (userError || !user) {
      console.error('User verification failed:', userError)
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Profile check:', profile ? `Role: ${profile.role}` : 'No profile')

    if (profileError || profile?.role !== 'admin') {
      console.error('Admin check failed:', profileError || 'Not admin')
      throw new Error('Only admins can delete waiters')
    }

    // Get waiter ID from request body
    const { waiterId } = await req.json()

    if (!waiterId) {
      throw new Error('Waiter ID is required')
    }

    console.log('Deleting waiter:', waiterId)

    // Delete the waiter user from auth.users using admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(waiterId)

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
