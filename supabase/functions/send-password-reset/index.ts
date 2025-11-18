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
    const { waiterId, waiterEmail, waiterName, phoneNumber } = await req.json();

    if (!waiterId || !waiterEmail || !phoneNumber) {
      throw new Error('Missing required fields: waiterId, waiterEmail, phoneNumber');
    }

    console.log('🔵 Sending password reset:', { waiterId, waiterEmail, phoneNumber });

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

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: waiterEmail,
    });

    if (resetError) {
      console.error('❌ Reset link generation error:', resetError);
      throw new Error(`Failed to generate reset link: ${resetError.message}`);
    }

    console.log('✅ Reset link generated');

    // Send WhatsApp message with reset link
    const evolutionApiUrl = Deno.env.get('VITE_EVOLUTION_API_URL') || 'http://wppapi.clubemkt.digital';
    const evolutionApiKey = Deno.env.get('VITE_EVOLUTION_API_KEY') || 'DD451E404240-4C45-AF35-BFCA6A976927';
    const instanceName = Deno.env.get('VITE_EVOLUTION_INSTANCE_NAME') || 'cocooo';

    const message = `Olá ${waiterName || 'Garçom'}! 👋

Você recebeu um link para redefinir sua senha:

${resetData.properties.action_link}

Este link é válido por 1 hora. Clique nele para criar uma nova senha.

Se você não solicitou esta redefinição, ignore esta mensagem.`;

    const whatsappResponse = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message
      })
    });

    if (!whatsappResponse.ok) {
      const errorText = await whatsappResponse.text();
      console.error('❌ WhatsApp send error:', errorText);
      throw new Error('Failed to send WhatsApp message');
    }

    console.log('✅ WhatsApp message sent');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Link de redefinição enviado via WhatsApp'
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
