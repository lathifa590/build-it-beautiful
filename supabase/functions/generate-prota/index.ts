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
    const { cp, mata_pelajaran, fase, kelas, jp_per_minggu, minggu_efektif_sem1, minggu_efektif_sem2, tujuan_pembelajaran } = await req.json();

    if (!cp || !mata_pelajaran) {
      return new Response(JSON.stringify({ error: "CP dan Mata Pelajaran wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: get user API key
    let userApiKey: string | null = null;
    let userId: string | null = null;

    const authHeader = req.headers.get('Authorization');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);

      if (user) {
        userId = user.id;

        // Check account type
        const { data: customerData } = await supabaseAdmin
          .from('allowed_customers')
          .select('account_type, subscription_expires_at')
          .eq('user_id', user.id)
          .maybeSingle();

        const isTrial = customerData?.account_type === 'trial';

        if (
          customerData?.account_type === 'annual' &&
          customerData?.subscription_expires_at &&
          new Date(customerData.subscription_expires_at).getTime() < Date.now()
        ) {
          return new Response(
            JSON.stringify({ error: 'Langganan tahunan Anda telah berakhir. Silakan perpanjang.', errorCode: 'subscription_expired' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user API keys (skip for trial)
        if (!isTrial) {
          const { data: userKeys } = await supabaseAdmin
            .from('user_api_keys')
            .select('api_key')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

          if (userKeys && userKeys.length > 0) {
            userApiKey = userKeys[0].api_key;
          }
        }

        // Fallback to demo keys
        if (!userApiKey) {
          const { data: demoKeys } = await supabaseAdmin
            .from('demo_api_keys')
            .select('api_key')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

          if (demoKeys && demoKeys.length > 0) {
            userApiKey = demoKeys[0].api_key;
          }
        }
      }
    }

    // Determine API key and endpoint
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const apiKey = userApiKey || LOVABLE_API_KEY;
    const useGeminiDirect = !!userApiKey;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key tidak tersedia", needApiKey: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalJPSem1 = jp_per_minggu * minggu_efektif_sem1;
    const totalJPSem2 = jp_per_minggu * minggu_efektif_sem2;
    
    let tpInstruction = "";
    if (tujuan_pembelajaran && Array.isArray(tujuan_pembelajaran) && tujuan_pembelajaran.length > 0) {
      // Map to string in case it's an array of objects { description: string }
      const tpStrings = tujuan_pembelajaran.map(tp => typeof tp === 'object' && tp.description ? tp.description : tp);
      
      tpInstruction = `1. WAJIB GUNAKAN DAFTAR Tujuan Pembelajaran (TP) berikut SECARA UTUH tanpa mengubah redaksinya atau membuat TP baru:\n${tpStrings.map((tp, i) => `   - TP ${i+1}: ${tp}`).join('\n')}\n2. Kamu HANYA perlu melengkapi materi_pokok, alokasi_jp, semester, dimensi_profil_lulusan, panca_cinta, dan keterangan untuk masing-masing TP tersebut.`;
    } else {
      tpInstruction = "1. Breakdown CP menjadi beberapa Tujuan Pembelajaran (TP) yang spesifik, terukur, dan operasional\n2. Setiap TP harus punya materi pokok yang jelas";
    }

    const prompt = `Kamu adalah ahli kurikulum pendidikan Indonesia (Kurikulum Merdeka).

Berdasarkan Capaian Pembelajaran (CP) berikut untuk mata pelajaran ${mata_pelajaran}, Fase ${fase}, ${kelas}:

"""
${cp}
"""

Buatlah Program Tahunan (Prota) yang lengkap dan terstruktur.

Informasi JP:
- JP per minggu: ${jp_per_minggu}
- Minggu efektif Semester 1: ${minggu_efektif_sem1} → Total JP Sem 1: ${totalJPSem1}
- Minggu efektif Semester 2: ${minggu_efektif_sem2} → Total JP Sem 2: ${totalJPSem2}

ATURAN:
${tpInstruction}
3. Alokasi JP harus realistis dan TOTAL JP per semester TIDAK BOLEH melebihi kapasitas
4. Total JP Semester 1 harus ≤ ${totalJPSem1}
5. Total JP Semester 2 harus ≤ ${totalJPSem2}
6. Distribusikan TP secara seimbang antara Semester 1 dan 2
7. Dimensi Profil Lulusan (DPL) pilih dari: Beriman dan Bertakwa, Beridentitas Global, Bergotong Royong, Mandiri, Bernalar Kritis, Kreatif, Berkesadaran Lingkungan, Berjiwa Wirausaha
8. Nomor TP harus berurutan dari 1 sampai N (gabungan kedua semester)
9. Untuk panca_cinta, jika relevan pilih SATU dari: "Cinta kepada Allah dan Rasul-Nya", "Cinta kepada Ilmu", "Cinta kepada Diri dan Sesama Manusia", "Cinta kepada Alam dan Lingkungan", "Cinta kepada Tanah Air". Jika tidak relevan, isi string kosong.

Kembalikan HANYA JSON valid (tanpa markdown, tanpa teks lain) dengan format:
{
  "prota": [
    {
      "no": 1,
      "tujuan_pembelajaran": "Peserta didik mampu ...",
      "materi_pokok": "...",
      "alokasi_jp": 12,
      "semester": 1,
      "dimensi_profil_lulusan": ["Bernalar Kritis", "Mandiri"],
      "panca_cinta": "Cinta Ilmu",
      "keterangan": "..."
    }
  ],
  "total_jp_sem1": ${totalJPSem1},
  "total_jp_sem2": ${totalJPSem2}
}`;

    let resultData;

    if (useGeminiDirect) {
      // Native Gemini API
      const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      let response: Response | null = null;
      let usedModel = models[0];

      for (const model of models) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 8192,
              responseMimeType: "application/json"
            },
          }),
        });

        if (response.ok) {
          usedModel = model;
          break;
        }

        const status = response.status;
        if (status !== 429 && status !== 404 && status !== 503) break;
        console.log(`Model ${model} failed (${status}), trying next...`);
      }

      if (!response || !response.ok) {
        const errorText = await response?.text();
        console.error("Gemini API error:", errorText);
        return new Response(JSON.stringify({ error: "Gagal generate Prota. Coba lagi." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Clean markdown code blocks
      const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const startIndex = cleanText.indexOf('{');
      const endIndex = cleanText.lastIndexOf('}');
      
      if (startIndex === -1 || endIndex === -1) {
        return new Response(JSON.stringify({ error: "Format response AI tidak valid (tidak ada JSON object)" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const jsonStr = cleanText.substring(startIndex, endIndex + 1);
      
      try {
        resultData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Raw JSON:", jsonMatch[0]);
        return new Response(JSON.stringify({ error: "Gagal memproses hasil dari AI. AI memberikan format yang tidak valid." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`Prota generated using model: ${usedModel}`);
    } else {
      // Lovable AI Gateway
      const gatewayUrl = "https://api.lovable.dev/v1/chat/completions";
      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", errorText);
        return new Response(JSON.stringify({ error: "Gagal generate Prota via AI Gateway" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || "";
      const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const startIndex = cleanText.indexOf('{');
      const endIndex = cleanText.lastIndexOf('}');
      
      if (startIndex === -1 || endIndex === -1) {
        return new Response(JSON.stringify({ error: "Format response AI tidak valid" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const jsonStr = cleanText.substring(startIndex, endIndex + 1);
      
      try {
        resultData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Raw JSON:", jsonStr);
        return new Response(JSON.stringify({ error: "Gagal memproses hasil dari AI (Gateway). AI memberikan format yang tidak valid." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Log generation
    if (userId) {
      await supabaseAdmin.from('generation_logs').insert({
        user_id: userId,
        content_type: 'prota',
        metadata: { mata_pelajaran, fase, kelas, jp_per_minggu },
      });
    }

    return new Response(JSON.stringify({ data: resultData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-prota:", error);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
