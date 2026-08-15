import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_DAILY_LIMIT_TRIAL = 3;
// generate-image uses Cloudflare Worker, no user API key needed for image gen

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt diperlukan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const CLOUDFLARE_IMAGE_API_KEY = Deno.env.get("CLOUDFLARE_IMAGE_API_KEY");
    if (!CLOUDFLARE_IMAGE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key belum dikonfigurasi" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth & rate limit check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check account type for trial limits
    const { data: customerData } = await supabaseAdmin
      .from('allowed_customers')
      .select('account_type, subscription_expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const isTrial = customerData?.account_type === 'trial';
    
    // Check user's preferred provider for routing image generation
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('preferred_provider')
      .eq('user_id', user.id)
      .maybeSingle();
    const preferredProvider = (profileData?.preferred_provider as 'gemini' | 'grok' | 'openai' | null) || null;

    if (
      customerData?.account_type === 'annual' &&
      customerData?.subscription_expires_at &&
      new Date(customerData.subscription_expires_at).getTime() < Date.now()
    ) {
      return new Response(
        JSON.stringify({
          error: 'Langganan tahunan Anda telah berakhir. Silakan perpanjang.',
          errorCode: 'subscription_expired',
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit check - only for trial users
    let remaining: number | undefined;
    let imageLimit: number | undefined;
    if (isTrial) {
      imageLimit = IMAGE_DAILY_LIMIT_TRIAL;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: dailyCount } = await supabaseAdmin
        .from("generation_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("content_type", "image")
        .gte("created_at", today.toISOString());

      const currentCount = dailyCount ?? 0;
      remaining = Math.max(0, imageLimit - currentCount);

      if (currentCount >= imageLimit) {
        return new Response(
          JSON.stringify({
            error: `Batas harian tercapai (${imageLimit}/hari). Coba lagi besok.`,
            errorCode: "rate_limit_exceeded",
            remaining: 0,
            limit: imageLimit,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Decide image source: user provider key (GROK/OpenAI) or fallback Cloudflare Worker
    let imageBytes: Uint8Array | null = null;
    let imageContentType = 'image/jpeg';
    let imageExt = 'jpg';
    let providerUsed: string = 'cloudflare';
    
    if (!isTrial && (preferredProvider === 'grok' || preferredProvider === 'openai')) {
      // Fetch user's active key for this provider
      const { data: userKeys } = await supabaseAdmin
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('provider', preferredProvider)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);
      
      const userKey = userKeys?.[0]?.api_key;
      if (userKey) {
        try {
          if (preferredProvider === 'grok') {
            const grokResp = await fetch('https://api.x.ai/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${userKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'grok-2-image-1212',
                prompt: prompt.slice(0, 1024),
                n: 1,
                response_format: 'b64_json',
              }),
            });
            if (grokResp.ok) {
              const j = await grokResp.json();
              const b64 = j?.data?.[0]?.b64_json;
              if (b64) {
                imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                imageContentType = 'image/jpeg';
                imageExt = 'jpg';
                providerUsed = 'grok';
              }
            } else {
              console.error('GROK image error:', grokResp.status, await grokResp.text().catch(() => ''));
            }
          } else if (preferredProvider === 'openai') {
            const oaiResp = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${userKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-image-1',
                prompt: prompt.slice(0, 1024),
                n: 1,
                size: '1024x1024',
              }),
            });
            if (oaiResp.ok) {
              const j = await oaiResp.json();
              const b64 = j?.data?.[0]?.b64_json;
              if (b64) {
                imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                imageContentType = 'image/png';
                imageExt = 'png';
                providerUsed = 'openai';
              }
            } else {
              console.error('OpenAI image error:', oaiResp.status, await oaiResp.text().catch(() => ''));
            }
          }
        } catch (e) {
          console.error(`${preferredProvider} image generation failed:`, e);
        }
      }
    }
    
    // Fallback to Cloudflare Worker if no provider image yet
    if (!imageBytes) {
      const cfResponse = await fetch("https://divine-recipe-76bd.jazialathif.workers.dev/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_IMAGE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!cfResponse.ok) {
        const errText = await cfResponse.text().catch(() => "Unknown error");
        console.error("Cloudflare Worker Error:", cfResponse.status, errText);
        const snippet = errText.slice(0, 200);
        return new Response(
          JSON.stringify({
            error: `Provider gambar gagal (${cfResponse.status}). ${snippet}`,
            providerStatus: cfResponse.status,
            remaining,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await cfResponse.arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);
      imageContentType = 'image/jpeg';
      imageExt = 'jpg';
      providerUsed = 'cloudflare';
    }

    // Upload to Supabase Storage
    const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${imageExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("stimulus-images")
      .upload(fileName, imageBytes, {
        contentType: imageContentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Gagal menyimpan gambar ke storage.", remaining }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("stimulus-images")
      .getPublicUrl(fileName);

    // Log usage
    await supabaseAdmin.from("generation_logs").insert({
      user_id: user.id,
      content_type: "image",
      metadata: { prompt: prompt.slice(0, 200), provider: providerUsed },
    });

    const newRemaining = isTrial && remaining !== undefined ? remaining - 1 : undefined;

    return new Response(
      JSON.stringify({
        imageUrl: publicUrlData.publicUrl,
        ...(isTrial ? { remaining: newRemaining, limit: imageLimit } : {}),
        isTrial,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
