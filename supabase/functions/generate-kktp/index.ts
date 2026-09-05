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
    const { tujuan_pembelajaran, mata_pelajaran, fase, kelas } = await req.json();

    if (!tujuan_pembelajaran || !Array.isArray(tujuan_pembelajaran) || tujuan_pembelajaran.length === 0) {
      return new Response(JSON.stringify({ error: "Daftar Tujuan Pembelajaran wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: same pattern as generate-prota
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

        let userProvider: 'gemini' | 'grok' | 'openai' = 'gemini';
        if (!isTrial) {
          const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('preferred_provider')
            .eq('user_id', user.id)
            .maybeSingle();
          const preferredProvider = (profileData?.preferred_provider as 'gemini' | 'grok' | 'openai' | null) || null;
          
          let q = supabaseAdmin
            .from('user_api_keys')
            .select('api_key, provider')
            .eq('user_id', user.id)
            .eq('is_active', true);
          if (preferredProvider) q = q.eq('provider', preferredProvider);
          
          const { data: userKeys } = await q.order('created_at', { ascending: true });

          if (userKeys && userKeys.length > 0) {
            userApiKey = userKeys[0].api_key;
            userProvider = (userKeys[0].provider as 'gemini' | 'grok' | 'openai') || 'gemini';
          }
        }

        if (!userApiKey) {
          const { data: demoKeys } = await supabaseAdmin
            .from('demo_api_keys')
            .select('api_key')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

          if (demoKeys && demoKeys.length > 0) {
            userApiKey = demoKeys[0].api_key;
            userProvider = 'gemini';
          }
        }
        (globalThis as any).__kktpProvider = userProvider;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const apiKey = userApiKey || LOVABLE_API_KEY;
    const useGeminiDirect = !!userApiKey;
    const activeProvider: 'gemini' | 'grok' | 'openai' = (globalThis as any).__kktpProvider || 'gemini';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key tidak tersedia", needApiKey: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tpListText = tujuan_pembelajaran.map((tp: string, i: number) => `${i + 1}. ${tp}`).join('\n');

    const prompt = `Kamu adalah ahli kurikulum pendidikan Indonesia (Kurikulum Merdeka).

Buatkan KKTP (Kriteria Ketercapaian Tujuan Pembelajaran) untuk mata pelajaran ${mata_pelajaran || ''}, Fase ${fase || ''}, ${kelas || ''}.

Berikut daftar Tujuan Pembelajaran (TP):
${tpListText}

ATURAN:
1. Untuk SETIAP TP, buat 3-4 indikator yang spesifik dan terukur
2. Setiap indikator harus memiliki 4 level deskriptor:
   - Belum Berkembang: deskripsi kemampuan paling dasar, belum menunjukkan penguasaan
   - Mulai Berkembang: mulai menunjukkan pemahaman awal dengan bimbingan
   - Berkembang Sesuai Harapan: menunjukkan penguasaan sesuai target TP
   - Sangat Berkembang: melampaui target, menunjukkan penguasaan mendalam
3. Deskriptor harus progresif dan jelas perbedaan level-nya
4. Gunakan bahasa yang operasional dan observable (dapat diamati)
5. Nomor indikator mengikuti format: 1.1, 1.2, 1.3, dst untuk TP 1; 2.1, 2.2 dst untuk TP 2

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

    let resultData;

    if (useGeminiDirect && activeProvider !== 'gemini') {
      // GROK / OpenAI (OpenAI-compatible)
      const endpoint = activeProvider === 'grok'
        ? 'https://api.x.ai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const model = activeProvider === 'grok' ? 'grok-4-fast-reasoning' : 'gpt-4o-mini';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 16384,
          response_format: { type: 'json_object' },
        }),
      });
      if (!response.ok) {
        console.error(`${activeProvider} API error:`, await response.text().catch(() => ''));
        return new Response(JSON.stringify({ error: `Gagal generate KKTP via ${activeProvider}.` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await response.json();
      const text = r.choices?.[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(JSON.stringify({ error: 'Format response AI tidak valid' }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      resultData = JSON.parse(jsonMatch[0]);
      console.log(`KKTP generated using ${activeProvider}/${model}`);
    } else if (useGeminiDirect) {
      const models = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"];
      let response: Response | null = null;
      let usedModel = models[0];

      for (const model of models) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
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
        return new Response(JSON.stringify({ error: "Gagal generate KKTP. Coba lagi." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(JSON.stringify({ error: "Format response AI tidak valid" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      resultData = JSON.parse(jsonMatch[0]);
      console.log(`KKTP generated using model: ${usedModel}`);
    } else {
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
          max_tokens: 16384,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", errorText);
        return new Response(JSON.stringify({ error: "Gagal generate KKTP via AI Gateway" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(JSON.stringify({ error: "Format response AI tidak valid" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      resultData = JSON.parse(jsonMatch[0]);
    }

    // Log generation
    if (userId) {
      await supabaseAdmin.from('generation_logs').insert({
        user_id: userId,
        content_type: 'kktp',
        metadata: { mata_pelajaran, fase, kelas, tp_count: tujuan_pembelajaran.length },
      });
    }

    return new Response(JSON.stringify({ data: resultData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-kktp:", error);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
