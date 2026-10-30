import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Resilient Gemini Model Hierarchy.
 * WARNING: Models must match the tier available to the account.
 */
const GEMINI_MODEL_CHAIN = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

function getGeminiEndpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function stripMarkdownJson(text: string): string {
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return clean.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const { type = "generate", systemPrompt = "", userPrompt = "", customKeys = [] } = payload;

    // 1. Gather all candidate API keys for this user
    let userApiKeys: string[] = [];

    if (Array.isArray(customKeys) && customKeys.length > 0) {
      userApiKeys = customKeys.filter(Boolean);
    } else {
      const { data: dbKeys } = await supabaseClient
        .from("user_api_keys")
        .select("api_key")
        .eq("user_id", user.id)
        .eq("provider", "gemini")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (dbKeys && dbKeys.length > 0) {
        userApiKeys = dbKeys.map((k: { api_key: string }) => k.api_key).filter(Boolean);
      }
    }

    // Fallback to system secret if configured (optional)
    const systemSecret = Deno.env.get("GEMINI_API_KEY");
    if (userApiKeys.length === 0 && systemSecret) {
      userApiKeys.push(systemSecret);
    }

    if (userApiKeys.length === 0) {
      return new Response(
        JSON.stringify({
          needApiKey: true,
          error: "API Key Gemini belum diatur. Silakan tambahkan API key di menu Pengaturan.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Handle connectivity test ping
    if (type === "test") {
      const testKey = userApiKeys[0];
      const testModel = GEMINI_MODEL_CHAIN[0];
      const res = await fetch(getGeminiEndpoint(testModel, testKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping. Balas 'pong'." }] }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return new Response(
          JSON.stringify({ success: false, error: `Test API gagal (${res.status}): ${errText}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, model: testModel, message: "Koneksi Gemini berhasil!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Prepare generation payload
    const requestBody = {
      contents: [
        ...(systemPrompt
          ? [{ role: "user", parts: [{ text: `INSTRUCTIONS:\n${systemPrompt}` }] },
             { role: "model", parts: [{ text: "Siap, saya mengerti instruksi tersebut." }] }]
          : []),
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
      },
    };

    // 4. Multi-key pool rotation + Model chain fallback
    let lastError: string | null = null;
    let successfulData: unknown = null;
    let usedModel = "";

    keyLoop: for (let kIdx = 0; kIdx < userApiKeys.length; kIdx++) {
      const currentKey = userApiKeys[kIdx];
      const keyShort = `...${currentKey.slice(-4)}`;

      for (const model of GEMINI_MODEL_CHAIN) {
        try {
          const res = await fetch(getGeminiEndpoint(model, currentKey), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (res.ok) {
            const data = await res.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) {
              lastError = "Model mengembalikan respons kosong.";
              continue; // try next model
            }

            successfulData = textResponse;
            usedModel = model;
            break keyLoop; // success! Exit completely
          }

          // Handle 429 Quota exhausted -> Rotate to next key immediately
          if (res.status === 429) {
            console.warn(`[Gemini BYOK] Quota limit (429) hit for key ${keyShort}. Switching to next key.`);
            lastError = `Quota limit 429 pada key ${keyShort}`;
            break; // Break inner model loop, proceed to next key in keyLoop
          }

          // Handle 404 Model Not Found or 503 Overloaded -> Try next model with same key
          if (res.status === 404 || res.status === 503) {
            console.warn(`[Gemini BYOK] Model ${model} returned ${res.status}. Trying next model...`);
            lastError = `Model ${model} error (${res.status})`;
            continue;
          }

          // Non-recoverable auth error for this key -> Go to next key
          if (res.status === 401 || res.status === 403) {
            console.error(`[Gemini BYOK] Key ${keyShort} invalid (${res.status}). Skipping.`);
            lastError = `API key tidak valid (${res.status})`;
            break;
          }

          // Other unexpected errors
          const errText = await res.text();
          lastError = `API error (${res.status}): ${errText}`;
        } catch (fetchErr) {
          lastError = `Network fetch error: ${String(fetchErr)}`;
        }
      }
    }

    if (!successfulData) {
      return new Response(
        JSON.stringify({
          error: lastError || "Semua API key atau model Gemini habis/gagal.",
          transient: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Attempt JSON parse if desired by client
    const rawText = String(successfulData);
    let parsedJson: unknown = null;
    try {
      parsedJson = JSON.parse(stripMarkdownJson(rawText));
    } catch {
      parsedJson = null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        usedModel,
        rawText,
        data: parsedJson ?? rawText,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("[generate-content-core] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || "Terjadi kesalahan internal." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
