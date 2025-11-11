// Test function to verify Auth Admin API access
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
    console.log('[test-auth-admin] Testing Auth Admin API access')
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('[test-auth-admin] SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('[test-auth-admin] SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET (length: ' + serviceRoleKey.length + ')' : 'NOT SET')
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing environment variables',
          supabaseUrl: !!supabaseUrl,
          serviceRoleKey: !!serviceRoleKey
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    console.log('[test-auth-admin] Testing listUsers()')
    
    // Try to list users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('[test-auth-admin] Error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Auth Admin API Error',
          message: error.message,
          status: error.status,
          code: error.code
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    console.log('[test-auth-admin] Success! Found', data.users.length, 'users')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Auth Admin API is working!',
        userCount: data.users.length,
        environmentVariables: {
          supabaseUrl: !!supabaseUrl,
          serviceRoleKey: !!serviceRoleKey,
          serviceRoleKeyLength: serviceRoleKey?.length
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[test-auth-admin] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error',
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
