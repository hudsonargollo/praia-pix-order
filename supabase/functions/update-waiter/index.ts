import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('🔵 Authenticated user:', user.email);

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.error('❌ Not an admin:', profile);
      throw new Error('Forbidden: Admin access required');
    }

    console.log('✅ Admin verified');

    // Get request body
    const { waiterId, email, full_name, password } = await req.json();

    if (!waiterId || !email || !full_name) {
      throw new Error('Missing required fields: waiterId, email, full_name');
    }

    console.log('🔵 Updating waiter:', { waiterId, email, full_name, hasPassword: !!password });

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update email and metadata first (without password)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      waiterId,
      {
        email,
        user_metadata: { full_name }
      }
    );

    if (authError) {
      console.error('❌ Auth update error:', authError);
      console.error('❌ Error details:', JSON.stringify(authError, null, 2));
      throw new Error(`Failed to update waiter: ${authError.message}`);
    }

    console.log('✅ Auth user email and metadata updated');

    // If password is provided, update it in a completely separate call
    if (password && password.trim().length > 0) {
      console.log('🔵 Updating password separately...');
      
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        waiterId,
        {
          password: password.trim()
        }
      );

      if (passwordError) {
        console.error('❌ Password update error:', passwordError);
        console.error('❌ Password error details:', JSON.stringify(passwordError, null, 2));
        // Don't throw here - email was updated successfully
        console.log('⚠️ Warning: Email updated but password update failed');
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      console.log('🔵 No password update requested');
    }

    // Update profile
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        email,
        full_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', waiterId);

    if (profileUpdateError) {
      console.error('❌ Profile update error:', profileUpdateError);
      throw new Error(`Failed to update profile: ${profileUpdateError.message}`);
    }

    console.log('✅ Profile updated');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Waiter updated successfully',
        waiter: {
          id: authUser.user.id,
          email: authUser.user.email,
          full_name: authUser.user.user_metadata.full_name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
