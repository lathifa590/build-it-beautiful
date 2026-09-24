// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// Robust JSON sanitization and parsing (aligned with generate-content)
// ============================================================
const sanitizeJsonResponse = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Fix illegal backslash escapes (e.g. LaTeX)
  cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

  // Replace literal control characters inside string
  cleaned = cleaned.replace(/[\n\r\t]+/g, " ");

  return cleaned;
};

const extractJsonFromResponse = (text: string): string => {
  const cleaned = sanitizeJsonResponse(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned;
};

const parseGeneratedJson = (text: string): { parsed?: any; sanitized: string; error?: unknown } => {
  const sanitized = extractJsonFromResponse(text);
  try {
    return { parsed: JSON.parse(sanitized), sanitized };
  } catch (parseError) {
    try {
      const fallbackContent = sanitizeJsonResponse(text);
      return { parsed: JSON.parse(fallbackContent), sanitized: fallbackContent };
    } catch {
      try {
        let repaired = sanitizeJsonResponse(text);
        repaired = extractJsonFromResponse(repaired);

        repaired = repaired.replace(/,\s*\.\.\./g, "");
        repaired = repaired.replace(/\.\.\.\s*,/g, "");
        repaired = repaired.replace(/\[\s*\.\.\.\s*\]/g, "[]");
        repaired = repaired.replace(/\{\s*\.\.\.\s*\}/g, "{}");
        repaired = repaired.replace(/([^"\w])\.\.\.(?=[^"\w]|$)/g, "$1null");

        repaired = repaired.replace(/,\s*"[^"]*(?:"[^"]*)*$/, "");
        repaired = repaired.replace(/"([^"\\]|\\["\\/bfnrtu])*$/, "");
        repaired = repaired.replace(/,\s*$/, "");

        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/\]/g) || []).length;

        if (openBrackets > closeBrackets) {
          repaired += "]".repeat(openBrackets - closeBrackets);
        }
        if (openBraces > closeBraces) {
          repaired += "}".repeat(openBraces - closeBraces);
        }

        return { parsed: JSON.parse(repaired), sanitized: repaired };
      } catch (finalError) {
        return { sanitized, error: finalError };
      }
    }
  }
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { tujuan_pembelajaran, mata_pelajaran, fase, kelas } = body;

    if (!tujuan_pembelajaran || !Array.isArray(tujuan_pembelajaran) || tujuan_pembelajaran.length === 0) {
      return new Response(JSON.stringify({ error: "Daftar Tujuan Pembelajaran wajib diisi" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth & Key Resolution
    let userId: string | null = null;
    let isTrial = false;
    let userKeyPool: Array<{ key: string; provider: "gemini" | "grok" | "openai" }> = [];
    const demoKeyPool: Array<{ key: string; provider: "gemini" }> = [];

    const authHeader = req.headers.get("Authorization");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);

      if (user) {
        userId = user.id;

        const { data: customerData } = await supabaseAdmin
          .from("allowed_customers")
          .select("account_type, subscription_expires_at")
          .eq("user_id", user.id)
          .maybeSingle();

        isTrial = customerData?.account_type === "trial";

        if (
          customerData?.account_type === "annual" &&
          customerData?.subscription_expires_at &&
          new Date(customerData.subscription_expires_at).getTime() < Date.now()
        ) {
          return new Response(
            JSON.stringify({
              error: "Langganan tahunan Anda telah berakhir. Silakan perpanjang.",
              errorCode: "subscription_expired",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!isTrial) {
          const { data: profileData } = await supabaseAdmin
            .from("profiles")
            .select("preferred_provider")
            .eq("user_id", user.id)
            .maybeSingle();

          const preferredProvider = (profileData?.preferred_provider as "gemini" | "grok" | "openai" | null) || null;

          const { data: userKeys } = await supabaseAdmin
            .from("user_api_keys")
            .select("api_key, provider")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: true });

          if (userKeys && userKeys.length > 0) {
            const normalized = userKeys.map((k: any) => ({
              key: k.api_key as string,
              provider: ((k.provider as "gemini" | "grok" | "openai") || "gemini"),
            }));

            userKeyPool = preferredProvider
              ? [
                  ...normalized.filter((k) => k.provider === preferredProvider),
                  ...normalized.filter((k) => k.provider !== preferredProvider),
                ]
              : normalized;
          }
        }

        const { data: demoKeys } = await supabaseAdmin
          .from("demo_api_keys")
          .select("api_key")
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (demoKeys && demoKeys.length > 0) {
          for (const dk of demoKeys) {
            demoKeyPool.push({ key: dk.api_key as string, provider: "gemini" });
          }
        }
      }
    }

    const candidateKeys = [...userKeyPool];
    if (candidateKeys.length === 0) {
      candidateKeys.push(...demoKeyPool);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (candidateKeys.length === 0 && !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API Key tidak tersedia. Silakan konfigurasi API Key di Pengaturan.", needApiKey: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tpListText = tujuan_pembelajaran
      .map((tp: any, i: number) => {
        const text = typeof tp === "object" && tp?.description ? tp.description : String(tp);
        return `${i + 1}. ${text}`;
      })
      .join("\n");

    const prompt = `Kamu adalah ahli kurikulum pendidikan Indonesia (Kurikulum Merdeka).

Buatkan KKTP (Kriteria Ketercapaian Tujuan Pembelajaran) untuk mata pelajaran ${mata_pelajaran || ""}, Fase ${fase || ""}, ${kelas || ""}.

Berikut daftar Tujuan Pembelajaran (TP):
${tpListText}

ATURAN WAJIB:
1. Untuk SETIAP TP, buat 2-3 indikator yang spesifik dan terukur (singkat & padat).
2. Setiap indikator memiliki 4 level deskriptor:
   - Belum Berkembang: kemampuan paling dasar
   - Mulai Berkembang: pemahaman awal dengan bimbingan
   - Berkembang Sesuai Harapan: penguasaan sesuai target TP
   - Sangat Berkembang: melampaui target
3. Tulis deskripsi secara ringkas, operasional, dan observable agar JSON tetap utuh dan tidak terpotong.
4. Nomor indikator mengikuti format: 1.1, 1.2 untuk TP 1; 2.1, 2.2 untuk TP 2, dst.

Kembalikan HANYA JSON valid (tanpa markdown, tanpa teks lain) dengan format:
{
  "kktp": [
    {
      "no": 1,
      "tujuan_pembelajaran": "Teks TP asli...",
      "indikator": [
        {
          "no_indikator": "1.1",
          "indikator": "Deskripsi indikator...",
          "belum_berkembang": "Deskripsi level...",
          "mulai_berkembang": "Deskripsi level...",
          "berkembang_sesuai_harapan": "Deskripsi level...",
          "sangat_berkembang": "Deskripsi level..."
        }
      ]
    }
  ]
}`;

    // Strictly adhere to .agents/rules/api-key.md (Experimental Tier Gemini models ONLY, NEVER gemini-1.5)
    const GEMINI_MODEL_CHAIN = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.0-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ];

    let resultData: any = null;
    let usedProvider = "";
    let usedModel = "";
    let lastError = "";

    const tryCandidateKey = async (entry: { key: string; provider: "gemini" | "grok" | "openai" }) => {
      if (entry.provider === "gemini") {
        for (const model of GEMINI_MODEL_CHAIN) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${entry.key}`;
            const resp = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 16384,
                  responseMimeType: "application/json",
                },
              }),
            });

            if (resp.ok) {
              const resJson = await resp.json();
              const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
              const { parsed, error: pError } = parseGeneratedJson(rawText);

              if (parsed && (Array.isArray(parsed.kktp) || Array.isArray(parsed))) {
                const kktpList = Array.isArray(parsed.kktp) ? parsed.kktp : parsed;
                return {
                  success: true,
                  data: { kktp: kktpList },
                  model,
                  provider: "gemini",
                };
              }
              console.log(`[generate-kktp] JSON parse failed on ${model}:`, pError);
            } else {
              const errBody = await resp.text().catch(() => "");
              console.log(`[generate-kktp] ${model} failed (${resp.status}): ${errBody.substring(0, 150)}`);
              lastError = `Gemini (${resp.status}): ${errBody.substring(0, 120)}`;
              if (resp.status !== 429 && resp.status !== 404 && resp.status !== 503) {
                break;
              }
            }
          } catch (e: any) {
            console.log(`[generate-kktp] Network error on ${model}:`, e?.message);
            lastError = e?.message || "Network error";
          }
        }
      } else {
        const endpoint =
          entry.provider === "grok"
            ? "https://api.x.ai/v1/chat/completions"
            : "https://api.openai.com/v1/chat/completions";
        const model = entry.provider === "grok" ? "grok-4-fast-reasoning" : "gpt-4o-mini";

        try {
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${entry.key}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: 16384,
              response_format: { type: "json_object" },
            }),
          });

          if (resp.ok) {
            const resJson = await resp.json();
            const rawText = resJson?.choices?.[0]?.message?.content || "";
            const { parsed, error: pError } = parseGeneratedJson(rawText);

            if (parsed && (Array.isArray(parsed.kktp) || Array.isArray(parsed))) {
              const kktpList = Array.isArray(parsed.kktp) ? parsed.kktp : parsed;
              return {
                success: true,
                data: { kktp: kktpList },
                model,
                provider: entry.provider,
              };
            }
            console.log(`[generate-kktp] ${entry.provider} JSON parse failed:`, pError);
          } else {
            const errBody = await resp.text().catch(() => "");
            console.log(`[generate-kktp] ${entry.provider} failed (${resp.status}): ${errBody.substring(0, 150)}`);
            lastError = `${entry.provider} (${resp.status}): ${errBody.substring(0, 120)}`;
          }
        } catch (e: any) {
          console.log(`[generate-kktp] Network error on ${entry.provider}:`, e?.message);
          lastError = e?.message || "Network error";
        }
      }

      return { success: false };
    };

    for (let i = 0; i < candidateKeys.length; i++) {
      const entry = candidateKeys[i];
      console.log(`[generate-kktp] Trying key ${i + 1}/${candidateKeys.length}: ${entry.provider} ...${entry.key.slice(-4)}`);
      const result = await tryCandidateKey(entry);
      if (result.success) {
        resultData = result.data;
        usedModel = result.model!;
        usedProvider = result.provider!;
        break;
      }
    }

    if (!resultData && userKeyPool.length > 0 && demoKeyPool.length > 0) {
      console.log(`[generate-kktp] User keys failed, falling back to ${demoKeyPool.length} demo keys`);
      for (const dk of demoKeyPool) {
        const result = await tryCandidateKey(dk);
        if (result.success) {
          resultData = result.data;
          usedModel = result.model!;
          usedProvider = result.provider!;
          break;
        }
      }
    }

    if (!resultData && LOVABLE_API_KEY) {
      console.log("[generate-kktp] Falling back to Lovable AI Gateway");
      try {
        const gatewayUrl = "https://api.lovable.dev/v1/chat/completions";
        const resp = await fetch(gatewayUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 16384,
            response_format: { type: "json_object" },
          }),
        });

        if (resp.ok) {
          const resJson = await resp.json();
          const rawText = resJson?.choices?.[0]?.message?.content || "";
          const { parsed } = parseGeneratedJson(rawText);

          if (parsed && (Array.isArray(parsed.kktp) || Array.isArray(parsed))) {
            const kktpList = Array.isArray(parsed.kktp) ? parsed.kktp : parsed;
            resultData = { kktp: kktpList };
            usedModel = "gemini-2.5-flash";
            usedProvider = "lovable-gateway";
          }
        }
      } catch (gwError: any) {
        console.error("[generate-kktp] Gateway error:", gwError?.message);
      }
    }

    if (!resultData) {
      return new Response(
        JSON.stringify({
          error: lastError
            ? `Gagal generate KKTP (${lastError}). Silakan coba klik Generate Ulang lagi.`
            : "Gagal generate KKTP. AI tidak dapat merespons atau kuota sementara penuh. Silakan coba lagi.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-kktp] Success using ${usedProvider}/${usedModel}`);

    if (userId) {
      await supabaseAdmin.from("generation_logs").insert({
        user_id: userId,
        content_type: "kktp",
        metadata: {
          mata_pelajaran,
          fase,
          kelas,
          tp_count: tujuan_pembelajaran.length,
          provider: usedProvider,
          model: usedModel,
        },
      });
    }

    return new Response(JSON.stringify({ data: resultData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-kktp:", error);
    return new Response(
      JSON.stringify({ error: `Terjadi kesalahan internal: ${error?.message || "Error tidak diketahui"}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
