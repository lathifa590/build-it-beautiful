import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedEmail = email.toLowerCase().trim();

    // 1. First check if user already has an account (profile exists)
    // This allows existing users (including admins) to login from any device
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error('Profile check error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If profile exists, allow login immediately (bypass whitelist)
    if (existingProfile) {
      console.log('Existing user found:', normalizedEmail);
      return new Response(
        JSON.stringify({ 
          allowed: true,
          name: existingProfile.display_name,
          hasAccount: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. If no profile exists, check if email is in whitelist (for new registrations)
    const { data: customer, error: customerError } = await supabase
      .from('allowed_customers')
      .select('id, name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (customerError) {
      console.error('Whitelist check error:', customerError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customer) {
      // 3. Check agency invites (pending) — invited member can register
      const { data: invite } = await supabase
        .from('agency_invites')
        .select('id, email')
        .ilike('email', normalizedEmail)
        .eq('status', 'pending')
        .maybeSingle();

      if (invite) {
        console.log('Agency invite found for:', normalizedEmail);
        return new Response(
          JSON.stringify({
            allowed: true,
            name: normalizedEmail.split('@')[0],
            hasAccount: false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          allowed: false,
          name: null,
          hasAccount: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whitelisted customer, no account yet
    return new Response(
      JSON.stringify({ 
        allowed: true,
        name: customer.name,
        hasAccount: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
