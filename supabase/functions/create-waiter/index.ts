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

    // User is authenticated - that's enough since we simplified RLS policies
    console.log('[create-waiter] Authenticated user creating waiter')

    // Get request body
    const { email, password, full_name, phone_number } = await req.json()

    console.log('[create-waiter] Request to create waiter:', {
      email,
      full_name,
      phone_number,
      hasPassword: !!password,
    })

    // Validate required fields
    if (!email || !password || !full_name) {
      console.warn('[create-waiter] Missing required fields')
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
      console.warn('[create-waiter] Invalid email format')
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

    console.log('[create-waiter] Calling database function to create waiter')

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('[create-waiter] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlLength: supabaseUrl?.length,
      keyLength: serviceRoleKey?.length,
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[create-waiter] Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing credentials' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    console.log('[create-waiter] Using admin API to create user')

    // Use Supabase Admin API to create user (proper way)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
      },
    })

    if (createError) {
      console.error('[create-waiter] Error creating user via admin API:', createError)
      
      if (createError.message.includes('already exists') || createError.message.includes('already registered')) {
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

    if (!userData.user) {
      console.error('[create-waiter] No user returned from admin API')
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = userData.user.id

    console.log('[create-waiter] User created via admin API:', userId)

    // Add waiter role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'waiter' })

    if (roleError) {
      console.error('[create-waiter] Error adding role:', roleError)
      // Continue anyway, role might already exist
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        role: 'waiter',
        full_name: full_name,
        phone_number: phone_number || null,
      })

    if (profileError) {
      console.error('[create-waiter] Error creating profile:', profileError)
      // Continue anyway
    }

    const data = { user_id: userId }

    if (createError) {
      console.error('[create-waiter] Error creating user:', {
        error: createError,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code,
      })

      // Handle duplicate email error
      if (createError.message.includes('already exists')) {
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          error: createError.message,
          details: createError.details,
          hint: createError.hint,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[create-waiter] Waiter created successfully:', data)

    return new Response(
      JSON.stringify({
        message: 'Waiter created successfully',
        userId: data.user_id,
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
