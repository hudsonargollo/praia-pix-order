// Supabase Edge Function to create waiter accounts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[create-waiter] Function invoked:', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get('Authorization'),
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[create-waiter] CORS preflight request')
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

    console.log('[create-waiter] Verifying user authentication')

    // Verify the user is an admin
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError) {
      console.error('[create-waiter] Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!user) {
      console.warn('[create-waiter] No user found in session')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[create-waiter] User authenticated:', { userId: user.id, email: user.email })

    // Check if user is admin (check both metadata and profiles table)
    console.log('[create-waiter] Checking admin role for user:', user.id)
    const userRole = user.user_metadata?.role || user.app_metadata?.role
    
    // Try to get role from profiles table as fallback
    let profileRole = null
    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      profileRole = profile?.role
      console.log('[create-waiter] Profile role from table:', profileRole)
    } catch (error) {
      console.log('[create-waiter] Could not query profiles table, using metadata role:', userRole)
    }

    const finalRole = profileRole || userRole
    console.log('[create-waiter] Final determined role:', finalRole)

    if (finalRole !== 'admin') {
      console.warn('[create-waiter] Access denied - user is not admin:', {
        userId: user.id,
        role: finalRole,
      })
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get request body
    const { email, password, full_name } = await req.json()

    console.log('[create-waiter] Request to create waiter:', {
      email,
      full_name,
      hasPassword: !!password,
    })

    // Validate required fields
    if (!email || !password || !full_name) {
      console.warn('[create-waiter] Missing required fields:', {
        hasEmail: !!email,
        hasPassword: !!password,
        hasFullName: !!full_name,
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, and full_name are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.warn('[create-waiter] Invalid email format:', email)
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate password length
    if (password.length < 6) {
      console.warn('[create-waiter] Password too short')
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
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

    console.log('[create-waiter] Creating waiter user with admin client')

    // Create the waiter user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'waiter',
      },
      app_metadata: {
        role: 'waiter',
      },
    })

    if (createError) {
      console.error('[create-waiter] Error creating user:', {
        error: createError,
        message: createError.message,
        status: createError.status,
      })

      // Handle duplicate email error specifically
      if (createError.message.includes('already registered') || 
          createError.message.includes('duplicate') ||
          createError.message.includes('already exists')) {
        console.warn('[create-waiter] Duplicate email detected:', email)
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[create-waiter] Waiter created successfully:', {
      userId: newUser.user.id,
      email: newUser.user.email,
    })

    return new Response(
      JSON.stringify({
        message: 'Waiter created successfully',
        userId: newUser.user.id,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[create-waiter] Unexpected function error:', {
      error,
      message: error.message,
      stack: error.stack,
    })
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
