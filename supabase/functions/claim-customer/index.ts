import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = {
      id: claimsData.claims.sub as string,
      email: claimsData.claims.email as string | undefined,
    };

    // Check if this user's email is in allowed_customers
    const { data: customer, error: customerError } = await supabase
      .from('allowed_customers')
      .select('*')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customer) {
      return new Response(
        JSON.stringify({ claimed: false, message: 'Not a whitelisted customer' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already claimed, return success
    if (customer.is_claimed) {
      return new Response(
        JSON.stringify({ claimed: true, message: 'Already claimed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update allowed_customers to mark as claimed
    const { error: updateCustomerError } = await supabase
      .from('allowed_customers')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        user_id: user.id,
      })
      .eq('id', customer.id);

    if (updateCustomerError) {
      console.error('Error updating customer:', updateCustomerError);
      return new Response(
        JSON.stringify({ error: 'Failed to claim customer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user profile with customer data
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        display_name: customer.name,
        phone: customer.phone,
      })
      .eq('user_id', user.id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({ 
        claimed: true, 
        message: 'Customer claimed successfully',
        customer: {
          name: customer.name,
          phone: customer.phone,
        }
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
