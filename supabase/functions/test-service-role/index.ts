// Test Edge Function to verify service role key is available
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlValue: supabaseUrl,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...',
    })

    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'SUPABASE_SERVICE_ROLE_KEY not found',
          available: Object.keys(Deno.env.toObject())
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Try to create admin client
    const supabaseAdmin = createClient(supabaseUrl ?? '', supabaseServiceKey)

    // Try to list users
    console.log('Attempting to list users...')
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error listing users:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to list users',
          details: error.message,
          status: error.status
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Successfully listed users:', data.users.length)

    return new Response(
      JSON.stringify({ 
        success: true,
        userCount: data.users.length,
        message: 'Service role key is working correctly'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
