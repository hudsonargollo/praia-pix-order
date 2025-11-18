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
    const { waiterId, email, full_name, phone_number } = await req.json();

    if (!waiterId || !email || !full_name) {
      throw new Error('Missing required fields: waiterId, email, full_name');
    }

    console.log('🔵 Updating waiter profile:', { waiterId, email, full_name, phone_number });

    // Create admin client to bypass RLS
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

    // Update profile using admin client (bypasses RLS)
    const updateData: any = {
      email,
      full_name,
      updated_at: new Date().toISOString()
    };

    // Only update phone_number if provided (allow null to clear it)
    if (phone_number !== undefined) {
      updateData.phone_number = phone_number || null;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', waiterId);

    if (updateError) {
      console.error('❌ Profile update error:', updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log('✅ Profile updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Waiter profile updated successfully'
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
