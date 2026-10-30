import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('CUSTOM_SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials in Edge Function");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { store_id, listing_id, type } = body;

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { error: rpcErr } = await supabaseAdmin.rpc('increment_store_metric', {
      p_store_id: store_id,
      p_listing_id: listing_id || null,
      p_type: type || 'store_view',
      p_date: today,
    });

    if (rpcErr) {
      // Fallback if migration not yet applied
      if (type === 'store_view' || type === 'views') {
        const { data: existing } = await supabaseAdmin
          .from('modul_store_metrics')
          .select('id, store_views')
          .eq('store_id', store_id)
          .eq('date', today)
          .is('listing_id', null)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin
            .from('modul_store_metrics')
            .update({ store_views: (existing.store_views || 0) + 1 })
            .eq('id', existing.id);
        } else {
          await supabaseAdmin
            .from('modul_store_metrics')
            .insert({ store_id, date: today, listing_id: null, store_views: 1, product_views: 0 });
        }
      } else if (type === 'product_view' || type === 'clicks') {
        if (listing_id) {
          const { data: existingListing } = await supabaseAdmin
            .from('modul_store_metrics')
            .select('id, product_views')
            .eq('store_id', store_id)
            .eq('date', today)
            .eq('listing_id', listing_id)
            .maybeSingle();

          if (existingListing) {
            await supabaseAdmin
              .from('modul_store_metrics')
              .update({ product_views: (existingListing.product_views || 0) + 1 })
              .eq('id', existingListing.id);
          } else {
            await supabaseAdmin
              .from('modul_store_metrics')
              .insert({ store_id, date: today, listing_id, store_views: 0, product_views: 1 });
          }
        }

        const { data: existingStore } = await supabaseAdmin
          .from('modul_store_metrics')
          .select('id, store_views')
          .eq('store_id', store_id)
          .eq('date', today)
          .is('listing_id', null)
          .maybeSingle();

        if (existingStore) {
          await supabaseAdmin
            .from('modul_store_metrics')
            .update({ store_views: (existingStore.store_views || 0) + 1 })
            .eq('id', existingStore.id);
        } else {
          await supabaseAdmin
            .from('modul_store_metrics')
            .insert({ store_id, date: today, listing_id: null, store_views: 1, product_views: 0 });
        }
      }
    }

    // Ambil metrik hari ini untuk store ini
    const { data: latestMetrics, error: fetchMetricsErr } = await supabaseAdmin
      .from('modul_store_metrics')
      .select('*')
      .eq('store_id', store_id)
      .eq('date', today);

    return new Response(JSON.stringify({ success: true, metrics: latestMetrics }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("Error in record-store-metric:", err);
    return new Response(JSON.stringify({ error: "Gagal memproses metrik toko." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
